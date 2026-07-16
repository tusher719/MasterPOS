<?php

namespace App\Services\ProfitCalculation;

use App\Models\Investment;

class CapitalBasedStrategy implements ProfitCalculationStrategyInterface
{
    public function calculate(array $context): array
    {
        $partner             = $context['partner'];
        $distributableAmount = (float) $context['distributable_amount'];
        $periodStart         = $context['period_start'];

        // Legacy mode — share percent derived from capital amount ratio.
        // This is the ONLY strategy where investment amount determines share.
        // All partner_based strategies use rule.share_percent instead.
        $totalInvestment = Investment::where('status', 'active')->sum('amount');

        // Find the primary linked investment for this partner
        $linkedInvestment = $partner->investments()
            ->wherePivot('is_primary', true)
            ->where('status', 'active')
            ->first();

        if (! $linkedInvestment || $totalInvestment <= 0) {
            return $this->zeroResult($partner, 'No active linked investment found.');
        }

        $investedAmount = (float) $linkedInvestment->amount;
        $sharePercent   = round(($investedAmount / $totalInvestment) * 100, 4);
        $shareAmount    = round(($sharePercent / 100) * $distributableAmount, 2);

        return [
            'partner_id'           => $partner->id,
            'partner_name'         => $partner->name,
            'partner_code'         => $partner->code,
            'rule_type'            => 'capital_based',
            'profit_source'        => 'capital_share',
            'share_percent'        => $sharePercent,
            'share_amount'         => $shareAmount,
            'cost_return_amount'   => 0.0,
            'settlement_type'      => 'profit_only',
            'payment_preference'   => 'cash',
            'profit_rule_snapshot' => [
                'rule_type'        => 'capital_based',
                'invested_amount'  => $investedAmount,
                'total_investment' => $totalInvestment,
                'share_percent'    => $sharePercent,
                'period_start'     => $periodStart,
                'note'             => 'Legacy capital-based calculation.',
            ],
            'is_eligible'          => true,
            'eligibility_reason'   => null,
        ];
    }

    // -----------------------------------------------------------------------
    // Private
    // -----------------------------------------------------------------------

    private function zeroResult(mixed $partner, string $reason): array
    {
        return [
            'partner_id'           => $partner->id,
            'partner_name'         => $partner->name,
            'partner_code'         => $partner->code,
            'rule_type'            => 'capital_based',
            'profit_source'        => 'capital_share',
            'share_percent'        => 0.0,
            'share_amount'         => 0.0,
            'cost_return_amount'   => 0.0,
            'settlement_type'      => 'profit_only',
            'payment_preference'   => 'cash',
            'profit_rule_snapshot' => [],
            'is_eligible'          => false,
            'eligibility_reason'   => $reason,
        ];
    }
}
