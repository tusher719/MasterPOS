<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Investment;
use App\Models\Product;
use App\Models\ProfitDistribution;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    // ─────────────────────────────────────────────
    //  Inertia page
    // ─────────────────────────────────────────────
    public function index(): \Inertia\Response
    {
        return Inertia::render('Backend/Dashboard/Index');
    }

    // ─────────────────────────────────────────────
    //  Single JSON data endpoint
    // ─────────────────────────────────────────────
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
            'period'              => [
                'type' => $period,
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
            ],
            'financial'           => $this->financialKpis($from, $to, $prevFrom, $prevTo),
            'sales_analytics'     => $this->salesAnalytics($from, $to),
            'inventory'           => $this->inventoryAnalytics(),
            'customer_analytics'  => $this->customerAnalytics($from, $to),
            'product_analytics'   => $this->productAnalytics($from, $to),
            'charts'              => $this->chartData($from, $to),
            'recent_sales'        => $this->recentSales(),
            'top_products'        => $this->topProducts($from, $to),
            'top_customers'       => $this->topCustomers($from, $to),
            'low_stock'           => $this->lowStockProducts(),
            'never_sold'          => $this->neverSoldProducts(),
            'needs_attention'     => $this->needsAttention(),
            'recent_activities'   => $this->recentActivities(),
            'recent_notifications'=> $this->recentNotifications(),
        ]);
    }

    // ─────────────────────────────────────────────
    //  Period helpers
    // ─────────────────────────────────────────────
    private function resolvePeriod(string $period, Request $request): array
    {
        $now = Carbon::now();

        return match ($period) {
            'today'      => [Carbon::today(), Carbon::today()->endOfDay()],
            'this_week'  => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'this_year'  => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            'custom'     => [
                Carbon::parse($request->date_from)->startOfDay(),
                Carbon::parse($request->date_to)->endOfDay(),
            ],
            default      => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()], // this_month
        };
    }

    private function previousPeriod(Carbon $from, Carbon $to): array
    {
        $days    = $from->diffInDays($to) + 1;
        $prevTo  = $from->copy()->subDay();
        $prevFrom = $prevTo->copy()->subDays($days - 1)->startOfDay();

        return [$prevFrom, $prevTo->endOfDay()];
    }

    // ─────────────────────────────────────────────
    //  Financial KPIs
    // ─────────────────────────────────────────────
    private function financialKpis(
        Carbon $from, Carbon $to,
        Carbon $prevFrom, Carbon $prevTo
    ): array {
        $today = Carbon::today();

        // Current period aggregates
        $revenue  = $this->saleRevenue($from, $to);
        $cogs     = $this->saleCogs($from, $to);
        $expenses = $this->expenseTotal($from, $to);
        $profit   = $revenue - $cogs - $expenses;
        $count    = Sale::whereNull('deleted_at')
                        ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
                        ->count();

        // Today
        $todayRevenue  = $this->saleRevenue($today->copy()->startOfDay(), $today->copy()->endOfDay());
        $todayCogs     = $this->saleCogs($today->copy()->startOfDay(), $today->copy()->endOfDay());
        $todayExpenses = $this->expenseTotal($today->copy()->startOfDay(), $today->copy()->endOfDay());
        $todayProfit   = $todayRevenue - $todayCogs - $todayExpenses;

        // Previous period
        $prevRevenue  = $this->saleRevenue($prevFrom, $prevTo);
        $prevCogs     = $this->saleCogs($prevFrom, $prevTo);
        $prevExpenses = $this->expenseTotal($prevFrom, $prevTo);
        $prevProfit   = $prevRevenue - $prevCogs - $prevExpenses;

        // Due amounts (all-time outstanding)
        $salesDue    = Sale::whereNull('deleted_at')
                           ->whereIn('payment_status', ['due', 'partial'])
                           ->sum('due_amount');
        $purchaseDue = Purchase::whereNull('deleted_at')
                               ->whereIn('payment_status', ['due', 'partial'])
                               ->sum('due_amount');

        // Investments & distributions (all-time)
        $totalInvestment = Investment::whereNull('deleted_at')
                                     ->where('status', 'active')
                                     ->sum('amount');
        $totalDistributed = ProfitDistribution::whereNull('deleted_at')
                                              ->where('status', 'distributed')
                                              ->sum('distributable_amount');

        return [
            'revenue'              => round($revenue, 2),
            'today_revenue'        => round($todayRevenue, 2),
            'expenses'             => round($expenses, 2),
            'cogs'                 => round($cogs, 2),
            'net_profit'           => round($profit, 2),
            'today_profit'         => round($todayProfit, 2),
            'sales_count'          => $count,
            'aov'                  => $count > 0 ? round($revenue / $count, 2) : 0,
            'profit_margin'        => $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0,
            'sales_due'            => round($salesDue, 2),
            'purchase_due'         => round($purchaseDue, 2),
            'total_investment'     => round($totalInvestment, 2),
            'total_distributed'    => round($totalDistributed, 2),
            'prev_revenue'         => round($prevRevenue, 2),
            'prev_expenses'        => round($prevExpenses, 2),
            'prev_profit'          => round($prevProfit, 2),
            'revenue_change_pct'   => $this->changePct($prevRevenue, $revenue),
            'expenses_change_pct'  => $this->changePct($prevExpenses, $expenses),
            'profit_change_pct'    => $this->changePct($prevProfit, $profit),
        ];
    }

    // ─────────────────────────────────────────────
    //  Sales Analytics
    // ─────────────────────────────────────────────
    private function salesAnalytics(Carbon $from, Carbon $to): array
    {
        // Payment method breakdown
        $paymentBreakdown = DB::table('sales')
            ->leftJoin('payment_methods', 'sales.payment_method_id', '=', 'payment_methods.id')
            ->whereNull('sales.deleted_at')
            ->whereBetween('sales.sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('payment_methods.id', 'payment_methods.name')
            ->select(
                DB::raw('COALESCE(payment_methods.name, "Cash / Unspecified") as method'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(sales.grand_total) as total')
            )
            ->get();

        // Status breakdown
        $statusBreakdown = DB::table('sales')
            ->whereNull('deleted_at')
            ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('payment_status')
            ->select('payment_status', DB::raw('COUNT(*) as count'), DB::raw('SUM(grand_total) as total'))
            ->get();

        return [
            'payment_breakdown' => $paymentBreakdown,
            'status_breakdown'  => $statusBreakdown,
        ];
    }

    // ─────────────────────────────────────────────
    //  Inventory Analytics
    // ─────────────────────────────────────────────
    private function inventoryAnalytics(): array
    {
        $products = DB::table('products')->whereNull('deleted_at');

        $totalValue    = (clone $products)->sum(DB::raw('stock_qty * average_cost'));
        $totalSku      = (clone $products)->count();
        $outOfStock    = (clone $products)->where('stock_qty', 0)->count();
        $lowStock      = (clone $products)
                            ->where('stock_qty', '>', 0)
                            ->whereColumn('stock_qty', '<=', 'low_stock_threshold')
                            ->count();

        return [
            'total_inventory_value' => round($totalValue, 2),
            'total_sku'             => $totalSku,
            'out_of_stock_count'    => $outOfStock,
            'low_stock_count'       => $lowStock,
        ];
    }

    // ─────────────────────────────────────────────
    //  Customer Analytics
    // ─────────────────────────────────────────────
    private function customerAnalytics(Carbon $from, Carbon $to): array
    {
        $total = Customer::whereNull('deleted_at')->count();

        $newCustomers = Customer::whereNull('deleted_at')
                                ->whereBetween('created_at', [$from, $to])
                                ->count();

        // Returning = customers with ≥ 2 sales in period
        $returning = DB::table('sales')
            ->select('customer_id')
            ->whereNull('deleted_at')
            ->whereNotNull('customer_id')
            ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('customer_id')
            ->havingRaw('COUNT(*) >= 2')
            ->get()
            ->count();

        return [
            'total'      => $total,
            'new'        => $newCustomers,
            'returning'  => $returning,
        ];
    }

    // ─────────────────────────────────────────────
    //  Product Analytics
    // ─────────────────────────────────────────────
    private function productAnalytics(Carbon $from, Carbon $to): array
    {
        $dateRange = [$from->toDateString(), $to->toDateString()];

        // Fast moving — top 5 by quantity
        $fast = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereNull('sales.deleted_at')
            ->whereNull('products.deleted_at')
            ->whereBetween('sales.sale_date', $dateRange)
            ->groupBy('products.id', 'products.name')
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(sale_items.quantity) as total_qty'),
                DB::raw('SUM(sale_items.subtotal) as total_revenue')
            )
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        // Slow moving — lowest qty (but > 0)
        $slow = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereNull('sales.deleted_at')
            ->whereNull('products.deleted_at')
            ->whereBetween('sales.sale_date', $dateRange)
            ->groupBy('products.id', 'products.name')
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(sale_items.quantity) as total_qty'),
                DB::raw('SUM(sale_items.subtotal) as total_revenue')
            )
            ->orderBy('total_qty')
            ->limit(5)
            ->get();

        // Highest profit — (unit_price - average_cost) * quantity
        $highProfit = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereNull('sales.deleted_at')
            ->whereNull('products.deleted_at')
            ->whereBetween('sales.sale_date', $dateRange)
            ->groupBy('products.id', 'products.name')
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(sale_items.quantity) as total_qty'),
                DB::raw('SUM((sale_items.unit_price - products.average_cost) * sale_items.quantity) as total_profit')
            )
            ->orderByDesc('total_profit')
            ->limit(5)
            ->get();

        return [
            'fast_moving'    => $fast,
            'slow_moving'    => $slow,
            'highest_profit' => $highProfit,
        ];
    }

    // ─────────────────────────────────────────────
    //  Chart Data
    // ─────────────────────────────────────────────
    private function chartData(Carbon $from, Carbon $to): array
    {
        $days = $from->diffInDays($to) + 1;

        // Use daily grouping for ≤ 60 days, monthly for > 60
        if ($days <= 60) {
            $salesTrend    = $this->dailySalesTrend($from, $to);
            $expenseTrend  = $this->dailyExpenseTrend($from, $to);
            $granularity   = 'daily';
        } else {
            $salesTrend    = $this->monthlySalesTrend($from, $to);
            $expenseTrend  = $this->monthlyExpenseTrend($from, $to);
            $granularity   = 'monthly';
        }

        $expenseByCategory = $this->expenseByCategory($from, $to);

        return [
            'granularity'         => $granularity,
            'sales_trend'         => $salesTrend,
            'expense_trend'       => $expenseTrend,
            'expense_by_category' => $expenseByCategory,
        ];
    }

    // ─────────────────────────────────────────────
    //  Trend helpers
    // ─────────────────────────────────────────────
    private function dailySalesTrend(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sales')
            ->whereNull('deleted_at')
            ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('sale_date')
            ->select(
                'sale_date as label',
                DB::raw('SUM(grand_total) as revenue'),
                DB::raw('COUNT(*) as count')
            )
            ->orderBy('sale_date')
            ->get();
    }

    private function dailyExpenseTrend(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('expenses')
            ->whereNull('deleted_at')
            ->whereBetween('expense_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('expense_date')
            ->select(
                'expense_date as label',
                DB::raw('SUM(amount) as amount')
            )
            ->orderBy('expense_date')
            ->get();
    }

    private function monthlySalesTrend(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sales')
            ->whereNull('deleted_at')
            ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy(DB::raw("DATE_FORMAT(sale_date, '%Y-%m')"))
            ->select(
                DB::raw("DATE_FORMAT(sale_date, '%Y-%m') as label"),
                DB::raw('SUM(grand_total) as revenue'),
                DB::raw('COUNT(*) as count')
            )
            ->orderBy('label')
            ->get();
    }

    private function monthlyExpenseTrend(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('expenses')
            ->whereNull('deleted_at')
            ->whereBetween('expense_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy(DB::raw("DATE_FORMAT(expense_date, '%Y-%m')"))
            ->select(
                DB::raw("DATE_FORMAT(expense_date, '%Y-%m') as label"),
                DB::raw('SUM(amount) as amount')
            )
            ->orderBy('label')
            ->get();
    }

    private function expenseByCategory(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('expenses')
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->whereNull('expenses.deleted_at')
            ->whereBetween('expenses.expense_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('expense_categories.id', 'expense_categories.name')
            ->select(
                'expense_categories.name as category',
                DB::raw('SUM(expenses.amount) as total')
            )
            ->orderByDesc('total')
            ->get();
    }

    // ─────────────────────────────────────────────
    //  Tables
    // ─────────────────────────────────────────────
    private function recentSales(): \Illuminate\Support\Collection
    {
        return DB::table('sales')
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->whereNull('sales.deleted_at')
            ->select(
                'sales.id',
                'sales.reference_no',
                'sales.sale_date',
                'sales.grand_total',
                'sales.payment_status',
                DB::raw('COALESCE(customers.name, "Walk-in") as customer_name')
            )
            ->orderByDesc('sales.created_at')
            ->limit(10)
            ->get();
    }

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
                DB::raw('SUM(sale_items.subtotal) as total_revenue')
            )
            ->orderByDesc('total_qty')
            ->limit(5)
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
                DB::raw('SUM(sales.grand_total) as total_spent')
            )
            ->orderByDesc('total_spent')
            ->limit(5)
            ->get();
    }

    private function lowStockProducts(): \Illuminate\Support\Collection
    {
        return DB::table('products')
            ->whereNull('deleted_at')
            ->where('stock_qty', '>', 0)
            ->whereColumn('stock_qty', '<=', 'low_stock_threshold')
            ->select('id', 'name', 'stock_qty', 'low_stock_threshold')
            ->orderBy('stock_qty')
            ->limit(10)
            ->get();
    }

    private function neverSoldProducts(): \Illuminate\Support\Collection
    {
        return DB::table('products')
            ->leftJoin('sale_items', 'products.id', '=', 'sale_items.product_id')
            ->whereNull('products.deleted_at')
            ->whereNull('sale_items.product_id')
            ->select('products.id', 'products.name', 'products.stock_qty', 'products.sale_price')
            ->orderBy('products.name')
            ->limit(10)
            ->get();
    }

    // ─────────────────────────────────────────────
    //  Needs Attention
    // ─────────────────────────────────────────────
    private function needsAttention(): array
    {
        $lowStock = DB::table('products')
            ->whereNull('deleted_at')
            ->where('stock_qty', '>', 0)
            ->whereColumn('stock_qty', '<=', 'low_stock_threshold')
            ->count();

        $outOfStock = DB::table('products')
            ->whereNull('deleted_at')
            ->where('stock_qty', 0)
            ->count();

        $salesDueCount = Sale::whereNull('deleted_at')
                             ->whereIn('payment_status', ['due', 'partial'])
                             ->count();

        $purchaseDueCount = Purchase::whereNull('deleted_at')
                                    ->whereIn('payment_status', ['due', 'partial'])
                                    ->count();

        $draftDistributions = ProfitDistribution::whereNull('deleted_at')
                                                ->where('status', 'draft')
                                                ->count();

        $unreadNotifications = DB::table('notifications')
            ->whereNull('read_at')
            ->where('notifiable_id', Auth::id())
            ->count();

        return [
            'low_stock_count'           => $lowStock,
            'out_of_stock_count'        => $outOfStock,
            'sales_due_count'           => $salesDueCount,
            'purchase_due_count'        => $purchaseDueCount,
            'draft_distributions_count' => $draftDistributions,
            'unread_notifications_count'=> $unreadNotifications,
        ];
    }

    // ─────────────────────────────────────────────
    //  Recent Activities
    // ─────────────────────────────────────────────
    private function recentActivities(): \Illuminate\Support\Collection
    {
        return ActivityLog::with('user:id,name')
            ->latest()
            ->limit(10)
            ->get(['id', 'user_id', 'module', 'action', 'description', 'created_at']);
    }

    // ─────────────────────────────────────────────
    //  Recent Notifications
    // ─────────────────────────────────────────────
    private function recentNotifications(): \Illuminate\Support\Collection
    {
        return DB::table('notifications')
            ->where('notifiable_id', Auth::id())
            ->orderByDesc('created_at')
            ->limit(8)
            ->get(['id', 'type', 'data', 'read_at', 'created_at']);
    }

    // ─────────────────────────────────────────────
    //  Aggregate helpers
    // ─────────────────────────────────────────────
    private function saleRevenue(Carbon $from, Carbon $to): float
    {
        return (float) Sale::whereNull('deleted_at')
            ->whereBetween('sale_date', [$from->toDateString(), $to->toDateString()])
            ->sum('grand_total');
    }

    private function saleCogs(Carbon $from, Carbon $to): float
    {
        return (float) DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereNull('sales.deleted_at')
            ->whereNull('products.deleted_at')
            ->whereBetween('sales.sale_date', [$from->toDateString(), $to->toDateString()])
            ->sum(DB::raw('sale_items.quantity * products.average_cost'));
    }

    private function expenseTotal(Carbon $from, Carbon $to): float
    {
        return (float) Expense::whereNull('deleted_at')
            ->whereBetween('expense_date', [$from->toDateString(), $to->toDateString()])
            ->sum('amount');
    }

    private function changePct(float $prev, float $current): float
    {
        if ($prev == 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $prev) / abs($prev)) * 100, 2);
    }
}
