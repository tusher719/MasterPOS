<?php

// app/Models/InvestorCapitalBalance.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvestorCapitalBalance extends Model
{
    protected $fillable = [
        'investment_id',
        'investor_name',
        'partner_id',
        'total_deposited',
        'total_withdrawn',
        'total_reinvested',
        'total_adjusted',
        'current_balance',
        'unlocked_amount',
        'locked_amount',
    ];

    protected $casts = [
        'total_deposited'   => 'decimal:2',
        'total_withdrawn'   => 'decimal:2',
        'total_reinvested'  => 'decimal:2',
        'total_adjusted'    => 'decimal:2',
        'current_balance'   => 'decimal:2',
        'unlocked_amount'   => 'decimal:2',
        'locked_amount'     => 'decimal:2',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class)->withTrashed();
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class)->withTrashed();
    }

    // ─── Static Resolver ──────────────────────────────────────────────────────

    /**
     * Get or create balance record for an investment.
     * Locks row for update — always call inside DB::transaction().
     */
    public static function forInvestment(int $investmentId): static
    {
        return static::where('investment_id', $investmentId)
            ->lockForUpdate()
            ->firstOrFail();
    }

    // ─── Credit Operations ────────────────────────────────────────────────────

    /**
     * Record a capital deposit.
     * Returns the new running_balance for ledger entry snapshot.
     */
    public function recordDeposit(float $amount): float
    {
        $this->increment('total_deposited', $amount);
        $this->increment('current_balance', $amount);
        $this->refresh();

        return (float) $this->current_balance;
    }

    /**
     * Record a reinvestment (profit → capital bridge).
     * Returns the new running_balance for ledger entry snapshot.
     */
    public function recordReinvestment(float $amount): float
    {
        $this->increment('total_reinvested', $amount);
        $this->increment('current_balance', $amount);
        $this->refresh();

        return (float) $this->current_balance;
    }

    /**
     * Record a positive adjustment (admin correction upward).
     * Returns the new running_balance for ledger entry snapshot.
     */
    public function recordPositiveAdjustment(float $amount): float
    {
        $this->increment('total_adjusted', $amount);
        $this->increment('current_balance', $amount);
        $this->refresh();

        return (float) $this->current_balance;
    }

    // ─── Debit Operations ─────────────────────────────────────────────────────

    /**
     * Deduct approved withdrawal from balance.
     * Called only when withdrawal status → approved.
     * Returns the new running_balance for ledger entry snapshot.
     */
    public function recordWithdrawal(float $amount): float
    {
        $this->increment('total_withdrawn', $amount);
        $this->decrement('current_balance', $amount);
        $this->refresh();

        return (float) $this->current_balance;
    }

    /**
     * Record a negative adjustment (admin correction downward).
     * Returns the new running_balance for ledger entry snapshot.
     */
    public function recordNegativeAdjustment(float $amount): float
    {
        $this->decrement('total_adjusted', $amount);
        $this->decrement('current_balance', $amount);
        $this->refresh();

        return (float) $this->current_balance;
    }

    // ─── Reversal Operations ──────────────────────────────────────────────────

    /**
     * Reverse a withdrawal deduction (when rejected or cancelled after approval).
     * Only call if balance was already deducted.
     */
    public function reverseWithdrawal(float $amount): void
    {
        $this->decrement('total_withdrawn', $amount);
        $this->increment('current_balance', $amount);
    }

    // ─── Guards ───────────────────────────────────────────────────────────────

    /**
     * Check if withdrawal amount is within BOTH current balance AND unlocked amount.
     * Called at withdrawal request time and again at approval time (double guard).
     */
    public function canWithdraw(float $amount): bool
    {
        return (float) $this->current_balance >= $amount
            && $this->availableToWithdraw() >= $amount;
    }

    /**
     * How much the investor can actually withdraw right now.
     * = unlocked_amount − total_withdrawn
     * Cannot go below zero.
     */
    public function availableToWithdraw(): float
    {
        return max(0, (float) $this->unlocked_amount - (float) $this->total_withdrawn);
    }

    /**
     * Compute and store unlocked_amount + locked_amount from live sales data.
     * Call this before any withdrawal validation.
     * Always call inside DB::transaction() since we write to this row.
     *
     * Formula:
     *   unlocked_amount = MIN(total_deposited, total_sales_since_investment_date)
     *   locked_amount   = total_deposited − unlocked_amount
     */
    public function computeAndSaveUnlockStatus(string $investmentDate): void
    {
        $totalSales = \App\Models\Sale::whereNull('deleted_at')
            ->where('sale_date', '>=', $investmentDate)
            ->sum('grand_total');

        $deposited = (float) $this->total_deposited;
        $unlocked  = min($deposited, (float) $totalSales);
        $locked    = $deposited - $unlocked;

        $this->forceFill([
            'unlocked_amount' => $unlocked,
            'locked_amount'   => $locked,
        ])->save();

        $this->refresh();
    }
}
