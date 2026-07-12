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
        'total_deposited',
        'total_withdrawn',
        'total_reinvested',
        'total_adjusted',
        'current_balance',
    ];

    protected $casts = [
        'total_deposited'   => 'decimal:2',
        'total_withdrawn'   => 'decimal:2',
        'total_reinvested'  => 'decimal:2',
        'total_adjusted'    => 'decimal:2',
        'current_balance'   => 'decimal:2',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class)->withTrashed();
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
     * Check if withdrawal amount is within available balance.
     */
    public function canWithdraw(float $amount): bool
    {
        return (float) $this->current_balance >= $amount;
    }
}
