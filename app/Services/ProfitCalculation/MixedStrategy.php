<?php

namespace App\Services\ProfitCalculation;

use App\Services\SettlementCalculationService;

class MixedStrategy implements ProfitCalculationStrategyInterface
{
    public function __construct(
        private FixedPercentStrategy         $fixedStrategy,
        private ProductBasedStrategy         $productStrategy,
        private SettlementCalculationService $settlementService
    ) {}

    public function calculate(array $context): array
    {
        $rule    = $context['rule'];
        $partner = $context['partner'];

        // Run both sub-strategies and sum their results
        $fixedResult   = $this->fixedStrategy->calculate($context);
        $productResult = $this->productStrategy->calculate($context);

        $sharePercent     = (float) $rule->share_percent;
        $shareAmount      = round($fixedResult['share_amount'] + $productResult['share_amount'], 2);
        $costReturnAmount = round($fixedResult['cost_return_amount'] + $productResult['cost_return_amount'], 2);

        $settlement = $this->settlementService->calculate(
            $partner,
            $context['period_start'],
            $context['period_end'],
            (float) $context['distributable_amount'],
            $sharePercent
        );

        return [
            'partner_id'           => $partner->id,
            'partner_name'         => $partner->name,
            'partner_code'         => $partner->code,
            'rule_type'            => 'mixed',
            'profit_source'        => $rule->profit_source,
            'share_percent'        => $sharePercent,
            'share_amount'         => $shareAmount,
            'cost_return_amount'   => $costReturnAmount,
            'settlement_type'      => $settlement['settlement_type'],
            'payment_preference'   => $settlement['payment_preference'],
            'product_breakdown'    => $productResult['product_breakdown'] ?? [],
            'profit_rule_snapshot' => [
                'id'             => $rule->id,
                'rule_type'      => 'mixed',
                'profit_source'  => $rule->profit_source,
                'share_percent'  => $sharePercent,
                'effective_from' => $rule->effective_from,
                'effective_to'   => $rule->effective_to,
                'approved_by'    => $rule->approved_by,
                'approved_at'    => $rule->approved_at,
                'sub_strategies' => ['fixed_percent', 'product_based'],
            ],
            'is_eligible'          => true,
            'eligibility_reason'   => null,
        ];
    }
}
