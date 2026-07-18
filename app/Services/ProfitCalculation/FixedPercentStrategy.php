<?php

namespace App\Services\ProfitCalculation;

use App\Services\SettlementCalculationService;

class FixedPercentStrategy implements ProfitCalculationStrategyInterface
{
    public function __construct(
        private SettlementCalculationService $settlementService
    ) {}

    public function calculate(array $context): array
    {
        $rule                = $context['rule'];
        $distributableAmount = (float) $context['distributable_amount'];
        $partner             = $context['partner'];
        $periodStart         = $context['period_start'];
        $periodEnd           = $context['period_end'];

        $sharePercent = (float) $rule->share_percent;
        $shareAmount  = round(($sharePercent / 100) * $distributableAmount, 2);

        $settlement = $this->settlementService->calculate(
            $partner,
            $periodStart,
            $periodEnd,
            $distributableAmount,
            $sharePercent
        );

        return [
            'partner_id'           => $partner->id,
            'partner_name'         => $partner->name,
            'partner_code'         => $partner->code,
            'rule_type'            => 'fixed_percent',
            // investment_type is NOT NULL in DB — partner-based items use rule_type as value
            'investment_type'      => 'fixed_percent',
            'profit_source'        => $rule->profit_source,
            'share_percent'        => $sharePercent,
            'share_amount'         => $shareAmount,
            'cost_return_amount'   => $settlement['cost_return_amount'],
            'settlement_type'      => $settlement['settlement_type'],
            'payment_preference'   => $settlement['payment_preference'],
            'profit_rule_snapshot' => [
                'id'             => $rule->id,
                'rule_type'      => $rule->rule_type,
                'profit_source'  => $rule->profit_source,
                'share_percent'  => $sharePercent,
                'effective_from' => $rule->effective_from,
                'effective_to'   => $rule->effective_to,
                'approved_by'    => $rule->approved_by,
                'approved_at'    => $rule->approved_at,
            ],
            'is_eligible'          => true,
            'eligibility_reason'   => null,
        ];
    }
}
