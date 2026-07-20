<?php

namespace App\Services;

use App\Models\PartnerProfitBalance;
use App\Models\ProfitDistributionItem;

class PartnerProfitBalanceService
{
    // -------------------------------------------------------------------------
    // Credit — called on ProfitDistribution::approve()
    // -------------------------------------------------------------------------

    /**
     * Credit earned amounts for a partner-based distribution item.
     * Handles both product-based (cost + profit) and fixed_percent (profit only).
     *
     * Call this inside the same DB::transaction() as distribution approve().
     */
    public function creditEarned(ProfitDistributionItem $item): void
    {
        if (! $item->partner_id) {
            return;
        }

        $balance = PartnerProfitBalance::findOrCreateForPartner($item->partner_id);

        $costAmount   = (float) ($item->cost_return_amount ?? 0);
        $totalAmount  = (float) $item->share_amount;
        $profitAmount = $totalAmount - $costAmount;

        $balance->creditCostReturn($costAmount);
        $balance->creditProfitShare($profitAmount);
    }

    // -------------------------------------------------------------------------
    // Payment recording — called on markAsPaid / markAsDeferred / markAsReinvested
    // -------------------------------------------------------------------------

    /**
     * Record a payment against the partner's balance.
     * Splits cost vs profit using the item's stored cost_return_amount.
     *
     * $paidAmount = actual amount being paid (may be partial).
     */
    public function recordPayment(ProfitDistributionItem $item, float $paidAmount): void
    {
        if (! $item->partner_id || $paidAmount <= 0) {
            return;
        }

        $balance = PartnerProfitBalance::findOrCreateForPartner($item->partner_id);

        [$costPortion, $profitPortion] = $this->splitAmount($item, $paidAmount);

        $balance->recordPayment($costPortion, $profitPortion);
    }

    // -------------------------------------------------------------------------
    // Reversal — called on cancelPayment / distribution reverse
    // -------------------------------------------------------------------------

    /**
     * Reverse a previously recorded payment.
     * Called from ProfitDistributionItem::cancelPayment().
     */
    public function reversePayment(ProfitDistributionItem $item, float $reversedAmount): void
    {
        if (! $item->partner_id || $reversedAmount <= 0) {
            return;
        }

        $balance = PartnerProfitBalance::findOrCreateForPartner($item->partner_id);

        [$costPortion, $profitPortion] = $this->splitAmount($item, $reversedAmount);

        $balance->reversePayment($costPortion, $profitPortion);
    }

    /**
     * Reverse all earned amounts for a distribution item.
     * Called from ProfitDistribution::reverse() for each partner-based item.
     */
    public function reverseEarned(ProfitDistributionItem $item): void
    {
        if (! $item->partner_id) {
            return;
        }

        $balance = PartnerProfitBalance::findOrCreateForPartner($item->partner_id);

        $costAmount   = (float) ($item->cost_return_amount ?? 0);
        $totalAmount  = (float) $item->share_amount;
        $profitAmount = $totalAmount - $costAmount;

        $balance->reverseEarned($costAmount, $profitAmount);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Split a payment amount into cost vs profit portions,
     * proportional to the item's original cost_return_amount vs share_amount.
     *
     * If cost_return_amount is null or 0 (fixed_percent partner),
     * the entire amount goes to profit portion.
     *
     * Returns [costPortion, profitPortion].
     */
    private function splitAmount(ProfitDistributionItem $item, float $amount): array
    {
        $totalShare = (float) $item->share_amount;
        $costReturn = (float) ($item->cost_return_amount ?? 0);

        if ($totalShare <= 0 || $costReturn <= 0) {
            // No cost component — all profit
            return [0.0, $amount];
        }

        $costRatio    = $costReturn / $totalShare;
        $costPortion  = round($amount * $costRatio, 2);
        $profitPortion = round($amount - $costPortion, 2);

        return [$costPortion, $profitPortion];
    }
}
