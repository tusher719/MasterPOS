<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvestorProfitBalance extends Model
{
    protected $fillable = [
        'investment_id',
        'investor_name',
        'partner_id',
        'total_earned',
        'total_paid',
        'total_deferred',
        'total_reinvested',
        'pending_balance',
    ];

    protected $casts = [
        'total_earned'     => 'decimal:2',
        'total_paid'       => 'decimal:2',
        'total_deferred'   => 'decimal:2',
        'total_reinvested' => 'decimal:2',
        'pending_balance'  => 'decimal:2',
    ];

    // ─── Relations ────────────────────────────────────────────

    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class)->withTrashed();
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class)->withTrashed();
    }

    // ─── Balance Mutation Methods ─────────────────────────────

    /**
     * Credit earned profit when a distribution item is approved.
     * Called inside DB::transaction() from ProfitDistributionController.
     */
    public function creditEarned(float $amount): void
    {
        $this->increment('total_earned', $amount);
        $this->increment('pending_balance', $amount);
    }

    /**
     * Record a payment against pending balance.
     * Validates that payment does not exceed pending balance.
     */
    public function recordPayment(float $amount): void
    {
        if ($amount > (float) $this->pending_balance) {
            throw new \RuntimeException(
                "Payment amount ({$amount}) exceeds pending balance ({$this->pending_balance}) " .
                "for investor: {$this->investor_name}"
            );
        }

        $this->increment('total_paid', $amount);
        $this->decrement('pending_balance', $amount);
    }

    /**
     * Mark an amount as deferred (carried forward to next period).
     */
    public function recordDeferred(float $amount): void
    {
        if ($amount > (float) $this->pending_balance) {
            throw new \RuntimeException(
                "Deferred amount ({$amount}) exceeds pending balance ({$this->pending_balance}) " .
                "for investor: {$this->investor_name}"
            );
        }

        $this->increment('total_deferred', $amount);
        $this->decrement('pending_balance', $amount);
    }

    /**
     * Mark an amount as reinvested into capital.
     */
    public function recordReinvested(float $amount): void
    {
        if ($amount > (float) $this->pending_balance) {
            throw new \RuntimeException(
                "Reinvested amount ({$amount}) exceeds pending balance ({$this->pending_balance}) " .
                "for investor: {$this->investor_name}"
            );
        }

        $this->increment('total_reinvested', $amount);
        $this->decrement('pending_balance', $amount);
    }

    /**
     * Reverse a payment — restore amount back to pending balance.
     * Used by DistributionReverseController.
     */
    public function reversePayment(float $amount): void
    {
        $this->decrement('total_paid', $amount);
        $this->increment('pending_balance', $amount);
    }

    /**
     * Reverse a deferred entry.
     */
    public function reverseDeferred(float $amount): void
    {
        $this->decrement('total_deferred', $amount);
        $this->increment('pending_balance', $amount);
    }

    /**
     * Reverse a reinvestment entry.
     */
    public function reverseReinvested(float $amount): void
    {
        $this->decrement('total_reinvested', $amount);
        $this->increment('pending_balance', $amount);
    }

    /**
     * Reverse earned credit — used when entire distribution is reversed.
     * Resets all ledger entries for this distribution's contribution.
     */
    public function reverseEarned(float $amount): void
    {
        $this->decrement('total_earned', $amount);
        // Only decrement pending_balance by what's actually pending
        $pendingToReverse = min($amount, (float) $this->pending_balance);
        if ($pendingToReverse > 0) {
            $this->decrement('pending_balance', $pendingToReverse);
        }
    }

    // ─── Static Helpers ───────────────────────────────────────

    /**
     * Get or create balance record for an investor.
     * Safe to call multiple times — idempotent.
     */
    public static function findOrCreateForInvestment(Investment $investment): self
    {
        return self::firstOrCreate(
            ['investment_id' => $investment->id],
            ['investor_name' => $investment->investor_name]
        );
    }

    // ─── Computed Helpers ─────────────────────────────────────

    public function hasPendingBalance(): bool
    {
        return (float) $this->pending_balance > 0;
    }

    public function roi(): float
    {
        $invested = (float) $this->investment?->amount;

        if ($invested <= 0) {
            return 0.0;
        }

        return round(((float) $this->total_earned / $invested) * 100, 2);
    }
}
