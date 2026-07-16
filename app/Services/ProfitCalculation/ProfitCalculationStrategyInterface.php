<?php

namespace App\Services\ProfitCalculation;

/**
 * Contract for all profit calculation strategies.
 *
 * Every strategy receives the same input context and returns
 * a standardized preview array for one partner.
 *
 * The engine NEVER writes to the database — it returns read-only preview data only.
 * Snapshot persistence is handled by ProfitDistributionController::store().
 */
interface ProfitCalculationStrategyInterface
{
    /**
     * Calculate profit share for a single partner.
     *
     * @param  array  $context  {
     *     partner_id:           int,
     *     period_start:         string (Y-m-d),
     *     period_end:           string (Y-m-d),
     *     distributable_amount: float,
     *     rule:                 PartnerProfitRule,
     *     settlement:           array (from SettlementCalculationService::calculate()),
     * }
     * @return array{
     *     partner_id:            int,
     *     partner_name:          string,
     *     partner_code:          string,
     *     rule_type:             string,
     *     profit_source:         string,
     *     share_percent:         float,
     *     share_amount:          float,
     *     cost_return_amount:    float,
     *     settlement_type:       string,
     *     payment_preference:    string,
     *     profit_rule_snapshot:  array,
     *     is_eligible:           bool,
     *     eligibility_reason:    string|null,
     * }
     */
    public function calculate(array $context): array;
}
