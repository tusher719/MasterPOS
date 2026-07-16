<?php

namespace App\Services\ProfitCalculation;

use App\Models\Investment;
use App\Models\Partner;
use App\Services\PartnerEligibilityService;
use App\Services\PartnerRuleResolutionService;
use App\Services\SettlementCalculationService;
use Illuminate\Support\Facades\DB;

class ProfitCalculationEngine
{
    public function __construct(
        private FixedPercentStrategy         $fixedStrategy,
        private ProductBasedStrategy         $productStrategy,
        private CapitalBasedStrategy         $capitalStrategy,
        private MixedStrategy                $mixedStrategy,
        private PartnerEligibilityService    $eligibilityService,
        private PartnerRuleResolutionService $ruleService,
        private SettlementCalculationService $settlementService
    ) {}

    // -----------------------------------------------------------------------
    // Main Entry Point
    // -----------------------------------------------------------------------

    /**
     * Calculate profit preview for a distribution period.
     *
     * For investment_based: uses legacy capital pool calculation.
     * For partner_based:    dispatches to correct strategy per partner rule_type.
     *
     * Engine NEVER writes to database — returns preview array only.
     * ProfitDistributionController::store() writes the snapshot.
     *
     * @return array{
     *     total_revenue:        float,
     *     total_cogs:           float,
     *     total_expenses:       float,
     *     gross_profit:         float,
     *     net_profit:           float,
     *     distribution_percent: float,
     *     distributable_amount: float,
     *     source_type:          string,
     *     items:                array,
     * }
     */
    public function preview(
        string $periodStart,
        string $periodEnd,
        float  $distributionPercent,
        string $sourceType = 'investment_based'
    ): array {
        // Financial aggregates — same for both source types
        $financials = $this->calculateFinancials($periodStart, $periodEnd, $distributionPercent);

        $items = $sourceType === 'partner_based'
            ? $this->calculatePartnerBased(
                $periodStart,
                $periodEnd,
                $financials['distributable_amount']
            )
            : $this->calculateInvestmentBased(
                $financials['distributable_amount']
            );

        return array_merge($financials, [
            'source_type' => $sourceType,
            'items'       => $items,
        ]);
    }

    // -----------------------------------------------------------------------
    // Financial Aggregates
    // -----------------------------------------------------------------------

    private function calculateFinancials(
        string $periodStart,
        string $periodEnd,
        float  $distributionPercent
    ): array {
        $totalRevenue = (float) DB::table('sales')
            ->whereNull('deleted_at')
            ->whereBetween('sale_date', [$periodStart, $periodEnd])
            ->sum('grand_total');

        $totalCogs = (float) DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->join('products as p', 'p.id', '=', 'si.product_id')
            ->whereNull('s.deleted_at')
            ->whereBetween('s.sale_date', [$periodStart, $periodEnd])
            ->selectRaw('SUM(si.quantity * p.average_cost) as cogs')
            ->value('cogs') ?? 0.0;

        $totalExpenses = (float) DB::table('expenses')
            ->whereNull('deleted_at')
            ->whereBetween('expense_date', [$periodStart, $periodEnd])
            ->sum('amount');

        $grossProfit         = $totalRevenue - $totalCogs;
        $netProfit           = $grossProfit - $totalExpenses;
        $distributableAmount = max(0, round($netProfit * ($distributionPercent / 100), 2));

        return [
            'total_revenue'        => round($totalRevenue, 2),
            'total_cogs'           => round($totalCogs, 2),
            'total_expenses'       => round($totalExpenses, 2),
            'total_investment'     => 0.0, // filled per source_type below
            'gross_profit'         => round($grossProfit, 2),
            'net_profit'           => round($netProfit, 2),
            'distribution_percent' => $distributionPercent,
            'distributable_amount' => $distributableAmount,
        ];
    }

    // -----------------------------------------------------------------------
    // Investment-Based (Legacy)
    // -----------------------------------------------------------------------

    private function calculateInvestmentBased(float $distributableAmount): array
    {
        $investments     = Investment::with('investmentType')
            ->where('status', 'active')
            ->get();

        $totalInvestment = (float) $investments->sum('amount');

        return $investments->map(function ($inv) use ($totalInvestment, $distributableAmount) {
            $sharePercent = $totalInvestment > 0
                ? round(($inv->amount / $totalInvestment) * 100, 4)
                : 0.0;

            $shareAmount = round(($sharePercent / 100) * $distributableAmount, 2);

            return [
                'investment_id'    => $inv->id,
                'investor_name'    => $inv->investor_name,
                'investment_title' => $inv->title,
                'investment_type'  => $inv->investmentType?->name ?? '—',
                'invested_amount'  => (float) $inv->amount,
                'share_percent'    => $sharePercent,
                'share_amount'     => $shareAmount,
                'note'             => null,
            ];
        })->values()->all();
    }

    // -----------------------------------------------------------------------
    // Partner-Based (New)
    // -----------------------------------------------------------------------

    private function calculatePartnerBased(
        string $periodStart,
        string $periodEnd,
        float  $distributableAmount
    ): array {
        // Load all active partners
        $partners = Partner::where('is_active', true)
            ->whereNull('deleted_at')
            ->get();

        if ($partners->isEmpty()) {
            return [];
        }

        $partnerIds = $partners->pluck('id')->all();

        // Batch eligibility check — avoids N+1
        $eligibilityMap = $this->eligibilityService->isEligibleBatch(
            $partnerIds,
            $periodStart,
            $periodEnd
        );

        // Batch rule resolution — avoids N+1
        $ruleMap = $this->ruleService->resolveForPartners($partnerIds, $periodStart);

        $items = [];

        foreach ($partners as $partner) {
            $isEligible = $eligibilityMap[$partner->id] ?? false;

            // Ineligible partner — include in preview with zero amounts
            if (! $isEligible) {
                $items[] = $this->ineligibleResult($partner, 'No active eligibility record covering this period.');
                continue;
            }

            $rule = $ruleMap[$partner->id] ?? null;

            // No approved rule — skip with reason
            if (! $rule) {
                $items[] = $this->ineligibleResult($partner, 'No approved profit rule active at period start.');
                continue;
            }

            $context = [
                'partner'              => $partner,
                'rule'                 => $rule,
                'period_start'         => $periodStart,
                'period_end'           => $periodEnd,
                'distributable_amount' => $distributableAmount,
            ];

            $items[] = $this->dispatch($rule->rule_type, $context);
        }

        return $items;
    }

    // -----------------------------------------------------------------------
    // Strategy Dispatcher
    // -----------------------------------------------------------------------

    private function dispatch(string $ruleType, array $context): array
    {
        return match ($ruleType) {
            'fixed_percent'  => $this->fixedStrategy->calculate($context),
            'product_based'  => $this->productStrategy->calculate($context),
            'capital_based'  => $this->capitalStrategy->calculate($context),
            'mixed'          => $this->mixedStrategy->calculate($context),
            default          => $this->ineligibleResult(
                $context['partner'],
                "Unknown rule type: {$ruleType}"
            ),
        };
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private function ineligibleResult(Partner $partner, string $reason): array
    {
        return [
            'partner_id'           => $partner->id,
            'partner_name'         => $partner->name,
            'partner_code'         => $partner->code,
            'rule_type'            => null,
            'profit_source'        => null,
            'share_percent'        => 0.0,
            'share_amount'         => 0.0,
            'cost_return_amount'   => 0.0,
            'settlement_type'      => null,
            'payment_preference'   => null,
            'profit_rule_snapshot' => [],
            'is_eligible'          => false,
            'eligibility_reason'   => $reason,
        ];
    }
}
