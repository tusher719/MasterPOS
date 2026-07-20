<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerProfitBalance extends Model
{
    protected $fillable = [
        'partner_id',
        'total_cost_returned',
        'total_cost_paid',
        'pending_cost_balance',
        'total_profit_earned',
        'total_profit_paid',
        'pending_profit_balance',
    ];

    protected $casts = [
        'total_cost_returned'    => 'decimal:2',
        'total_cost_paid'        => 'decimal:2',
        'pending_cost_balance'   => 'decimal:2',
        'total_profit_earned'    => 'decimal:2',
        'total_profit_paid'      => 'decimal:2',
        'pending_profit_balance' => 'decimal:2',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class)->withTrashed();
    }

    // -------------------------------------------------------------------------
    // Static factory
    // -------------------------------------------------------------------------

    /**
     * Find or create the balance record for a given partner.
     */
    public static function findOrCreateForPartner(int $partnerId): static
    {
        return static::firstOrCreate(
            ['partner_id' => $partnerId],
            [
                'total_cost_returned'    => 0,
                'total_cost_paid'        => 0,
                'pending_cost_balance'   => 0,
                'total_profit_earned'    => 0,
                'total_profit_paid'      => 0,
                'pending_profit_balance' => 0,
            ]
        );
    }

    // -------------------------------------------------------------------------
    // Credit methods (called on distribution approve)
    // -------------------------------------------------------------------------

    /**
     * Credit cost return earned — called when a product-based distribution
     * item is approved and cost_return_amount > 0.
     */
    public function creditCostReturn(float $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        $this->increment('total_cost_returned', $amount);
        $this->increment('pending_cost_balance', $amount);
    }

    /**
     * Credit profit share earned — called when a partner-based distribution
     * item is approved.
     */
    public function creditProfitShare(float $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        $this->increment('total_profit_earned', $amount);
        $this->increment('pending_profit_balance', $amount);
    }

    // -------------------------------------------------------------------------
    // Debit methods (called on payment recording)
    // -------------------------------------------------------------------------

    /**
     * Record a payment — splits cost vs profit based on item's stored amounts.
     * costPortion + profitPortion must equal the total payment amount.
     */
    public function recordPayment(float $costPortion, float $profitPortion): void
    {
        if ($costPortion > 0) {
            $this->increment('total_cost_paid', $costPortion);
            $this->decrement('pending_cost_balance', $costPortion);
        }

        if ($profitPortion > 0) {
            $this->increment('total_profit_paid', $profitPortion);
            $this->decrement('pending_profit_balance', $profitPortion);
        }
    }

    // -------------------------------------------------------------------------
    // Reversal methods (called on payment cancellation / distribution reverse)
    // -------------------------------------------------------------------------

    /**
     * Reverse a previously recorded payment.
     */
    public function reversePayment(float $costPortion, float $profitPortion): void
    {
        if ($costPortion > 0) {
            $this->decrement('total_cost_paid', $costPortion);
            $this->increment('pending_cost_balance', $costPortion);
        }

        if ($profitPortion > 0) {
            $this->decrement('total_profit_paid', $profitPortion);
            $this->increment('pending_profit_balance', $profitPortion);
        }
    }

    /**
     * Reverse earned amounts — called on distribution reverse.
     * Guards against going below zero.
     */
    public function reverseEarned(float $costAmount, float $profitAmount): void
    {
        if ($costAmount > 0) {
            $safeReverseCost = min($costAmount, (float) $this->total_cost_returned);
            $this->decrement('total_cost_returned', $safeReverseCost);
            $safePendingCost = min($safeReverseCost, (float) $this->pending_cost_balance);
            $this->decrement('pending_cost_balance', $safePendingCost);
        }

        if ($profitAmount > 0) {
            $safeReverseProfit = min($profitAmount, (float) $this->total_profit_earned);
            $this->decrement('total_profit_earned', $safeReverseProfit);
            $safePendingProfit = min($safeReverseProfit, (float) $this->pending_profit_balance);
            $this->decrement('pending_profit_balance', $safePendingProfit);
        }
    }

    // -------------------------------------------------------------------------
    // Computed helpers
    // -------------------------------------------------------------------------

    /**
     * Total pending balance (cost + profit combined).
     */
    public function totalPending(): float
    {
        return (float) $this->pending_cost_balance
            + (float) $this->pending_profit_balance;
    }
}
