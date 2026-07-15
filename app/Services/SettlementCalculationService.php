<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\PartnerSettlementConfig;
use App\Models\PartnerProductAssignment;
use Illuminate\Support\Carbon;

class SettlementCalculationService
{
    /**
     * Calculate settlement breakdown for a partner in a given period.
     *
     * Returns a breakdown of cost_return + profit_share amounts.
     * Called by Phase 4F ProfitCalculationEngine — never writes to database.
     *
     * @param  Partner  $partner
     * @param  string   $periodStart  Y-m-d
     * @param  string   $periodEnd    Y-m-d
     * @param  float    $distributableAmount  Total distributable profit for the period
     * @param  float    $partnerSharePercent  Partner's share_percent from resolved profit rule
     * @return array{
     *     settlement_type: string,
     *     payment_preference: string,
     *     auto_cost_return: bool,
     *     profit_share_amount: float,
     *     cost_return_amount: float,
     *     total_settlement_amount: float,
     *     breakdown: array
     * }
     */
    public function calculate(
        Partner $partner,
        string $periodStart,
        string $periodEnd,
        float $distributableAmount,
        float $partnerSharePercent
    ): array {
        $config = $this->getActiveConfig($partner);

        $settlementType    = $config?->settlement_type ?? 'profit_only';
        $paymentPreference = $config?->payment_preference ?? 'cash';
        $autoCostReturn    = $config?->auto_cost_return ?? false;

        $profitShareAmount  = round(($partnerSharePercent / 100) * $distributableAmount, 2);
        $costReturnAmount   = 0.0;
        $breakdown          = [];

        if ($settlementType === 'cost_plus_profit' && $autoCostReturn) {
            // Phase 4F will inject actual product sale cost data here.
            // Placeholder: cost return calculated from partner_product_assignments
            // once ProductBasedStrategy aggregates sale totals per product.
            $costReturnAmount = $this->calculateCostReturn($partner, $periodStart, $periodEnd);
        }

        $breakdown[] = [
            'label'  => 'Profit Share (' . $partnerSharePercent . '%)',
            'amount' => $profitShareAmount,
        ];

        if ($costReturnAmount > 0) {
            $breakdown[] = [
                'label'  => 'Cost Return',
                'amount' => $costReturnAmount,
            ];
        }

        $totalSettlementAmount = round($profitShareAmount + $costReturnAmount, 2);

        return [
            'settlement_type'        => $settlementType,
            'payment_preference'     => $paymentPreference,
            'auto_cost_return'       => $autoCostReturn,
            'profit_share_amount'    => $profitShareAmount,
            'cost_return_amount'     => $costReturnAmount,
            'total_settlement_amount'=> $totalSettlementAmount,
            'breakdown'              => $breakdown,
        ];
    }

    /**
     * Get the active settlement config for a partner.
     * Returns null if no config exists — callers must handle the default case.
     */
    public function getActiveConfig(Partner $partner): ?PartnerSettlementConfig
    {
        return $partner->settlementConfigs()->active()->latest()->first();
    }

    /**
     * Check whether a partner has an active settlement config.
     */
    public function hasActiveConfig(Partner $partner): bool
    {
        return $partner->settlementConfigs()->active()->exists();
    }

    /**
     * Get the settlement type for a partner.
     * Falls back to 'profit_only' when no config is set.
     */
    public function getSettlementType(Partner $partner): string
    {
        return $this->getActiveConfig($partner)?->settlement_type ?? 'profit_only';
    }

    /**
     * Get the payment preference for a partner.
     * Falls back to 'cash' when no config is set.
     */
    public function getPaymentPreference(Partner $partner): string
    {
        return $this->getActiveConfig($partner)?->payment_preference ?? 'cash';
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Calculate cost return for product partners in a given period.
     *
     * Phase 4F (ProductBasedStrategy) will call this with pre-aggregated sale data.
     * Current implementation is a placeholder — returns 0 until Phase 4E assignments exist.
     *
     * Full implementation:
     *   SELECT SUM(si.quantity * p.average_cost)
     *   FROM sale_items si
     *   JOIN sales s ON s.id = si.sale_id
     *   JOIN partner_product_assignments ppa
     *     ON ppa.assignable_type = 'product'
     *     AND ppa.assignable_id = si.product_id
     *     AND ppa.partner_id = :partner_id
     *     AND ppa.effective_from <= s.sale_date
     *     AND (ppa.effective_to IS NULL OR ppa.effective_to >= s.sale_date)
     *     AND ppa.approved_by IS NOT NULL
     *     AND ppa.is_active = 1
     *   WHERE s.sale_date BETWEEN :period_start AND :period_end
     *     AND s.deleted_at IS NULL
     *
     * @return float
     */
    private function calculateCostReturn(
        Partner $partner,
        string $periodStart,
        string $periodEnd
    ): float {
        // Placeholder until Phase 4E partner_product_assignments table exists.
        // Phase 4F will replace this with the full SQL aggregation above.
        return 0.0;
    }
}
