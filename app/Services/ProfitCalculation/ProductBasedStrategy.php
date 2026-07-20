<?php

namespace App\Services\ProfitCalculation;

use App\Services\PartnerProductAssignmentService;
use App\Services\SettlementCalculationService;
use Illuminate\Support\Facades\DB;

class ProductBasedStrategy implements ProfitCalculationStrategyInterface
{
    public function __construct(
        private PartnerProductAssignmentService $assignmentService,
        private SettlementCalculationService    $settlementService
    ) {}

    public function calculate(array $context): array
    {
        $rule                = $context['rule'];
        $partner             = $context['partner'];
        $periodStart         = $context['period_start'];
        $periodEnd           = $context['period_end'];
        $distributableAmount = (float) $context['distributable_amount'];

        $sharePercent = (float) $rule->share_percent;

        $productTotals = $this->aggregateProductSales($partner->id, $periodStart, $periodEnd);

        $profitShareAmount = 0.0;
        $costReturnAmount  = 0.0;
        $productBreakdown  = [];

        foreach ($productTotals as $row) {
            $productProfit     = (float) $row->total_revenue - (float) $row->total_cost;
            $partnerProfit     = round($productProfit * ($sharePercent / 100), 2);
            $partnerCostReturn = (bool) $row->cost_return_enabled
                ? round((float) $row->total_cost, 2)
                : 0.0;

            $profitShareAmount += $partnerProfit;
            $costReturnAmount  += $partnerCostReturn;

            $productBreakdown[] = [
                'product_id'     => $row->product_id,
                'product_name'   => $row->product_name,
                'qty_sold'       => (int) $row->qty_sold,
                'total_revenue'  => round((float) $row->total_revenue, 2),
                'total_cost'     => round((float) $row->total_cost, 2),
                'product_profit' => round($productProfit, 2),
                'partner_profit' => $partnerProfit,
                'cost_return'    => $partnerCostReturn,
            ];
        }

        $profitShareAmount = round($profitShareAmount, 2);
        $costReturnAmount  = round($costReturnAmount, 2);

        // share_amount = total payable (cost return + profit share)
        // cost_return_amount stored separately for split tracking in balance table
        $totalShareAmount = round($profitShareAmount + $costReturnAmount, 2);

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
            'rule_type'            => 'product_based',
            'profit_source'        => $rule->profit_source,
            'share_percent'        => $sharePercent,
            // Total payable — cost return + profit share combined (backward compat)
            'share_amount'         => $totalShareAmount,
            // Separate tracking — persisted to profit_distribution_items.cost_return_amount
            'cost_return_amount'   => $costReturnAmount,
            // Derived: share_amount − cost_return_amount = profit share portion
            'profit_share_amount'  => $profitShareAmount,
            'settlement_type'      => $settlement['settlement_type'],
            'payment_preference'   => $settlement['payment_preference'],
            'product_breakdown'    => $productBreakdown,
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

    private function aggregateProductSales(
        int    $partnerId,
        string $periodStart,
        string $periodEnd
    ): \Illuminate\Support\Collection {
        return DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->join('products as p', 'p.id', '=', 'si.product_id')
            ->join('partner_product_assignments as ppa', function ($join) use ($partnerId) {
                $join->on('ppa.assignable_id', '=', 'si.product_id')
                     ->where('ppa.assignable_type', '=', 'product')
                     ->where('ppa.partner_id', '=', $partnerId)
                     ->whereNotNull('ppa.approved_by')
                     ->where('ppa.is_active', '=', true);
            })
            ->whereNull('s.deleted_at')
            ->whereBetween('s.sale_date', [$periodStart, $periodEnd])
            ->whereRaw('ppa.effective_from <= s.sale_date')
            ->whereRaw('(ppa.effective_to IS NULL OR ppa.effective_to >= s.sale_date)')
            ->select([
                'si.product_id',
                'p.name as product_name',
                'ppa.cost_return_enabled',
                DB::raw('SUM(si.quantity) as qty_sold'),
                DB::raw('SUM(si.quantity * si.unit_price) as total_revenue'),
                DB::raw('SUM(si.quantity * p.average_cost) as total_cost'),
            ])
            ->groupBy('si.product_id', 'p.name', 'ppa.cost_return_enabled')
            ->get();
    }
}
