<?php

namespace App\Services\ProfitCalculation;

use App\Models\Investment;
use App\Models\Partner;
use App\Services\PartnerEligibilityService;
use App\Services\PartnerPeriodResolutionService;
use App\Services\PartnerRuleResolutionService;
use App\Services\SettlementCalculationService;
use Illuminate\Support\Facades\DB;

class ProfitCalculationEngine
{
    public function __construct(
    private FixedPercentStrategy              $fixedStrategy,
    private ProductBasedStrategy              $productStrategy,
    private CapitalBasedStrategy              $capitalStrategy,
    private MixedStrategy                     $mixedStrategy,
    private PartnerEligibilityService         $eligibilityService,
    private PartnerRuleResolutionService      $ruleService,
    private SettlementCalculationService      $settlementService,
    private PartnerPeriodResolutionService $periodResolutionService
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
        string $sourceType = 'investment_based',
        ?int   $excludeDistributionId = null
    ): array {
        if ($sourceType === 'partner_based') {
            return $this->previewPartnerBased(
                $periodStart,
                $periodEnd,
                $distributionPercent,
                $excludeDistributionId
            );
        }

        // investment_based — legacy path (single financial summary for full period)
        $financials = $this->calculateFinancials($periodStart, $periodEnd, $distributionPercent);

        $items = $this->calculateInvestmentBased($financials['distributable_amount']);

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

    /**
     * Partner-based preview — computes Financial Summary ONCE per unique Effective Period.
     * Each partner gets their own Effective Period via PartnerPeriodResolutionService.
     */
    private function previewPartnerBased(
        string $periodStart,
        string $periodEnd,
        float  $distributionPercent,
        ?int   $excludeDistributionId
    ): array {
        $partners = Partner::where('is_active', true)
            ->whereNull('deleted_at')
            ->get();

        if ($partners->isEmpty()) {
            return $this->emptyPartnerPreview($periodStart, $periodEnd, $distributionPercent);
        }

        $partnerIds = $partners->pluck('id')->all();

        // --- Step 1: Resolve effective period per partner ---
        $resolvedPeriods = $this->periodResolutionService->resolveAll(
            $partnerIds,
            $periodStart,
            $periodEnd,
            $excludeDistributionId
        );

        // --- Step 2: Group partners by unique Effective Period ---
        $periodGroups = $this->periodResolutionService
            ->groupByEffectivePeriod($resolvedPeriods)
            ->map(fn($g) => EffectivePeriodGroup::fromArray($g));

        // --- Step 3: Compute Financial Summary ONCE per unique Effective Period ---
        foreach ($periodGroups as $group) {
            $summary = $this->calculateFinancials(
                $group->effectiveStart,
                $group->effectiveEnd,
                $distributionPercent
            );
            $group->attachSummary($summary);
        }

        // --- Step 4: Build a lookup: partner_id → EffectivePeriodGroup ---
        $partnerGroupMap = [];
        foreach ($periodGroups as $group) {
            foreach ($group->partnerIds as $pid) {
                $partnerGroupMap[$pid] = $group;
            }
        }

        // --- Step 5: Resolve rules per partner using their effective start date ---
        // Rule resolution must use each partner's effective_start, not the selected period_start.
        // A partner whose eligibility starts Jul 7 may have a rule effective_from Jul 7 —
        // resolving with Jul 6 would miss it.
        $ruleMap = [];
        foreach ($partnerIds as $pid) {
            $resolved = $resolvedPeriods->get($pid);
            // Use effective_start if eligible, otherwise fall back to selected period_start
            $ruleAnchorDate = ($resolved && $resolved['is_eligible'])
                ? $resolved['effective_start']
                : $periodStart;
            $rule = $this->ruleService->resolve($pid, $ruleAnchorDate);
            if ($rule) {
                $ruleMap[$pid] = $rule;
            }
        }

        // --- Step 6: Build items per partner ---
        $items = [];

        foreach ($partners as $partner) {
            $resolved = $resolvedPeriods->get($partner->id);

            // Ineligible (no eligibility record, or effective period is empty)
            if (! $resolved || ! $resolved['is_eligible']) {
                $items[] = $this->ineligibleResult(
                    $partner,
                    $resolved['adjustment_reason'] ?? 'No active eligibility record covering this period.',
                    $resolved
                );
                continue;
            }

            $rule = $ruleMap[$partner->id] ?? null;

            if (! $rule) {
                $items[] = $this->ineligibleResult(
                    $partner,
                    'No approved profit rule active at period start.',
                    $resolved
                );
                continue;
            }

            /** @var EffectivePeriodGroup $group */
            $group = $partnerGroupMap[$partner->id];

            $context = [
                'partner'              => $partner,
                'rule'                 => $rule,
                'period_start'         => $group->effectiveStart,
                'period_end'           => $group->effectiveEnd,
                'distributable_amount' => $group->distributableAmount($distributionPercent),
            ];

            $item = $this->dispatch($rule->rule_type, $context);

            // Attach effective period info to item for frontend display
            $item['effective_period'] = [
                'start'              => $group->effectiveStart,
                'end'                => $group->effectiveEnd,
                'selected_start'     => $periodStart,
                'selected_end'       => $periodEnd,
                'adjustment_reason'  => $resolved['adjustment_reason'],
                'last_paid_info'     => $resolved['last_paid_info'],
                'financial_summary'  => $group->financialSummary,
            ];

            $items[] = $item;
        }

        // Top-level financials = selected period (for display in distribution header)
        $headerFinancials = $this->calculateFinancials($periodStart, $periodEnd, $distributionPercent);

        return array_merge($headerFinancials, [
            'source_type' => 'partner_based',
            'items'       => $items,
        ]);
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

    private function ineligibleResult(Partner $partner, string $reason, ?array $resolved = null): array
    {
        return [
            'partner_id'           => $partner->id,
            'partner_name'         => $partner->name,
            'partner_code'         => $partner->code,
            'rule_type'            => null,
            // investment_type is NOT NULL — ineligible partner-based items use 'partner_based'
            'investment_type'      => 'partner_based',
            'profit_source'        => null,
            'share_percent'        => 0.0,
            'share_amount'         => 0.0,
            'cost_return_amount'   => 0.0,
            'settlement_type'      => null,
            'payment_preference'   => null,
            'profit_rule_snapshot' => [],
            'is_eligible'          => false,
            'eligibility_reason'   => $reason,
            'effective_period'     => $resolved ? [
                'start'             => $resolved['effective_start'],
                'end'               => $resolved['effective_end'],
                'selected_start'    => $resolved['selected_start'],
                'selected_end'      => $resolved['selected_end'],
                'adjustment_reason' => $resolved['adjustment_reason'],
                'last_paid_info'    => $resolved['last_paid_info'],
                'financial_summary' => null,
            ] : null,
        ];
    }

    /**
     * Empty preview response when no active partners exist.
     */
    private function emptyPartnerPreview(
        string $periodStart,
        string $periodEnd,
        float  $distributionPercent
    ): array {
        $financials = $this->calculateFinancials($periodStart, $periodEnd, $distributionPercent);

        return array_merge($financials, [
            'source_type' => 'partner_based',
            'items'       => [],
        ]);
    }
}
