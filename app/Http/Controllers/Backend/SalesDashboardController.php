<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SalesDashboardController extends Controller
{
    public function data(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'period'    => 'nullable|in:today,this_week,this_month,this_year,custom',
            'date_from' => 'nullable|date|required_if:period,custom',
            'date_to'   => 'nullable|date|required_if:period,custom|after_or_equal:date_from',
        ]);

        $period = $request->input('period', 'this_month');
        [$from, $to]         = $this->resolvePeriod($period, $request);
        [$prevFrom, $prevTo] = $this->previousPeriod($from, $to);

        return response()->json([
            'period'           => [
                'type' => $period,
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
            ],
            'kpis'             => $this->kpis($from, $to, $prevFrom, $prevTo),
            'charts'           => $this->charts($from, $to),
            'order_status'     => $this->orderStatusBreakdown($from, $to),
            'payment_status'   => $this->paymentStatusBreakdown($from, $to),
            'payment_methods'  => $this->paymentMethodBreakdown($from, $to),
            'delivery_types'   => $this->deliveryTypeBreakdown($from, $to),
            'top_products'     => $this->topProducts($from, $to),
            'top_customers'    => $this->topCustomers($from, $to),
            'recent_sales'     => $this->recentSales($from, $to),
            'hourly_trend'     => $this->hourlyTrend($from, $to),
        ]);
    }

    // ── Period helpers ────────────────────────────────────────────────────────

    private function resolvePeriod(string $period, Request $request): array
    {
        $now = Carbon::now();

        return match ($period) {
            'today'     => [Carbon::today(), Carbon::today()->endOfDay()],
            'this_week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'this_year' => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            'custom'    => [
                Carbon::parse($request->date_from)->startOfDay(),
                Carbon::parse($request->date_to)->endOfDay(),
            ],
            default     => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
        };
    }

    private function previousPeriod(Carbon $from, Carbon $to): array
    {
        $days    = $from->diffInDays($to) + 1;
        $prevTo  = $from->copy()->subDay()->endOfDay();
        $prevFrom = $prevTo->copy()->subDays($days - 1)->startOfDay();

        return [$prevFrom, $prevTo];
    }

    // ── KPIs ──────────────────────────────────────────────────────────────────

    private function kpis(Carbon $from, Carbon $to, Carbon $prevFrom, Carbon $prevTo): array
    {
        $dateRange     = [$from->toDateString(), $to->toDateString()];
        $prevDateRange = [$prevFrom->toDateString(), $prevTo->toDateString()];

        $revenue     = $this->revenue($from, $to);
        $prevRevenue = $this->revenue($prevFrom, $prevTo);

        $count     = Sale::whereNull('deleted_at')->whereBetween('sale_date', $dateRange)->count();
        $prevCount = Sale::whereNull('deleted_at')->whereBetween('sale_date', $prevDateRange)->count();

        $paid    = Sale::whereNull('deleted_at')->whereBetween('sale_date', $dateRange)->where('payment_status', 'paid')->count();
        $due     = Sale::whereNull('deleted_at')->whereBetween('sale_date', $dateRange)->whereIn('payment_status', ['due', 'partial'])->sum('due_amount');

        $delivered   = Sale::whereNull('deleted_at')->whereBetween('sale_date', $dateRange)->where('order_status', 'delivered')->count();
        $cancelled   = Sale::whereNull('deleted_at')->whereBetween('sale_date', $dateRange)->where('order_status', 'cancelled')->count();

        $aov     = $count > 0 ? round($revenue / $count, 2) : 0;
        $prevAov = $prevCount > 0 ? round($prevRevenue / $prevCount, 2) : 0;

        // COD sales count
        $codCount = Sale::whereNull('deleted_at')
            ->whereBetween('sale_date', $dateRange)
            ->where('payment_type', 'cash_on_delivery')
            ->count();

        return [
            'revenue'            => round($revenue, 2),
            'prev_revenue'       => round($prevRevenue, 2),
            'revenue_change_pct' => $this->changePct($prevRevenue, $revenue),
            'sales_count'        => $count,
            'prev_sales_count'   => $prevCount,
            'count_change_pct'   => $this->changePct($prevCount, $count),
            'aov'                => $aov,
            'prev_aov'           => $prevAov,
            'aov_change_pct'     => $this->changePct($prevAov, $aov),
            'paid_count'         => $paid,
            'due_amount'         => round($due, 2),
            'delivered_count'    => $delivered,
            'cancelled_count'    => $cancelled,
            'cod_count'          => $codCount,
        ];
    }

    // ── Charts ────────────────────────────────────────────────────────────────

    private function charts(Carbon $from, Carbon $to): array
    {
        $days = $from->diffInDays($to) + 1;

        if ($days <= 60) {
            $trend       = $this->dailyTrend($from, $to);
            $granularity = 'daily';
        } else {
            $trend       = $this->monthlyTrend($from, $to);
            $granularity = 'monthly';
        }

        return [
            'granularity' => $granularity,
            'trend'       => $trend,
        ];
    }

    private function dailyTrend(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sales')
            ->whereNull('deleted_at')
            ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('sale_date')
            ->select(
                'sale_date as label',
                DB::raw('SUM(grand_total) as revenue'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(due_amount) as due')
            )
            ->orderBy('sale_date')
            ->get();
    }

    private function monthlyTrend(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sales')
            ->whereNull('deleted_at')
            ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy(DB::raw("DATE_FORMAT(sale_date, '%Y-%m')"))
            ->select(
                DB::raw("DATE_FORMAT(sale_date, '%Y-%m') as label"),
                DB::raw('SUM(grand_total) as revenue'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(due_amount) as due')
            )
            ->orderBy('label')
            ->get();
    }

    // ── Breakdowns ────────────────────────────────────────────────────────────

    private function orderStatusBreakdown(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sales')
            ->whereNull('deleted_at')
            ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('order_status')
            ->select(
                'order_status as status',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(grand_total) as total')
            )
            ->orderByDesc('count')
            ->get();
    }

    private function paymentStatusBreakdown(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sales')
            ->whereNull('deleted_at')
            ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('payment_status')
            ->select(
                'payment_status as status',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(grand_total) as total'),
                DB::raw('SUM(due_amount) as due')
            )
            ->orderByDesc('count')
            ->get();
    }

    private function paymentMethodBreakdown(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sales')
            ->leftJoin('payment_methods', 'sales.payment_method_id', '=', 'payment_methods.id')
            ->whereNull('sales.deleted_at')
            ->whereBetween('sales.sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('payment_methods.id', 'payment_methods.name')
            ->select(
                DB::raw('COALESCE(payment_methods.name, "Unspecified") as method'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(sales.grand_total) as total')
            )
            ->orderByDesc('total')
            ->get();
    }

    private function deliveryTypeBreakdown(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sales')
            ->whereNull('deleted_at')
            ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
            ->whereNotNull('delivery_type')
            ->groupBy('delivery_type')
            ->select(
                'delivery_type as type',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(delivery_charge) as total_charge')
            )
            ->orderByDesc('count')
            ->get();
    }

    // ── Top lists ─────────────────────────────────────────────────────────────

    private function topProducts(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereNull('sales.deleted_at')
            ->whereNull('products.deleted_at')
            ->whereBetween('sales.sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('products.id', 'products.name')
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(sale_items.quantity) as total_qty'),
                DB::raw('SUM(sale_items.subtotal) as total_revenue'),
                DB::raw('SUM((sale_items.unit_price - products.average_cost) * sale_items.quantity) as total_profit')
            )
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get();
    }

    private function topCustomers(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->whereNull('sales.deleted_at')
            ->whereNull('customers.deleted_at')
            ->whereNotNull('sales.customer_id')
            ->whereBetween('sales.sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('customers.id', 'customers.name', 'customers.phone')
            ->select(
                'customers.id',
                'customers.name',
                'customers.phone',
                DB::raw('COUNT(sales.id) as total_orders'),
                DB::raw('SUM(sales.grand_total) as total_spent'),
                DB::raw('SUM(sales.due_amount) as total_due')
            )
            ->orderByDesc('total_spent')
            ->limit(10)
            ->get();
    }

    private function recentSales(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sales')
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->whereNull('sales.deleted_at')
            ->whereBetween('sales.sale_date', [$from->toDateString(), $to->toDateString()])
            ->select(
                'sales.id',
                'sales.reference_no',
                'sales.sale_date',
                'sales.grand_total',
                'sales.payment_status',
                'sales.order_status',
                'sales.payment_type',
                DB::raw('COALESCE(customers.name, "Walk-in") as customer_name')
            )
            ->orderByDesc('sales.created_at')
            ->limit(15)
            ->get();
    }

    // Hourly trend — only useful for today/this_week
    private function hourlyTrend(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        $days = $from->diffInDays($to) + 1;

        // Only compute hourly breakdown for ranges <= 7 days
        if ($days > 7) {
            return collect([]);
        }

        return DB::table('sales')
            ->whereNull('deleted_at')
            ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy(DB::raw('HOUR(created_at)'))
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(grand_total) as revenue')
            )
            ->orderBy('hour')
            ->get();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function revenue(Carbon $from, Carbon $to): float
    {
        return (float) Sale::whereNull('deleted_at')
            ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
            ->sum('grand_total');
    }

    private function changePct(float $prev, float $current): float
    {
        if ($prev == 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $prev) / abs($prev)) * 100, 2);
    }
}
