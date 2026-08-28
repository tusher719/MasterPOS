<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class InventoryDashboardController extends Controller
{
    public function data(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'period'    => 'nullable|in:today,this_week,this_month,this_year,custom',
            'date_from' => 'nullable|date|required_if:period,custom',
            'date_to'   => 'nullable|date|required_if:period,custom|after_or_equal:date_from',
        ]);

        $period = $request->input('period', 'this_month');
        [$from, $to] = $this->resolvePeriod($period, $request);

        return response()->json([
            'period'          => [
                'type' => $period,
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
            ],
            'kpis'            => $this->kpis(),
            'low_stock'       => $this->lowStock(),
            'out_of_stock'    => $this->outOfStock(),
            'never_sold'      => $this->neverSold(),
            'top_moving'      => $this->topMoving($from, $to),
            'slow_moving'     => $this->slowMoving($from, $to),
            'by_category'     => $this->stockByCategory(),
            'stock_movements' => $this->recentMovements($from, $to),
            'purchase_trend'  => $this->purchaseTrend($from, $to),
        ]);
    }

    // ── Period helper ─────────────────────────────────────────────────────────

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

    // ── KPIs (all-time inventory snapshot) ───────────────────────────────────

    private function kpis(): array
    {
        $products = DB::table('products')->whereNull('deleted_at');

        $totalValue  = (clone $products)->sum(DB::raw('stock_qty * average_cost'));
        $totalSku    = (clone $products)->count();
        $outOfStock  = (clone $products)->where('stock_qty', 0)->count();
        $lowStock    = (clone $products)
                            ->where('stock_qty', '>', 0)
                            ->whereColumn('stock_qty', '<=', 'low_stock_threshold')
                            ->count();
        $activeCount = (clone $products)->where('is_active', true)->count();

        // Total categories with stock
        $categoryCount = DB::table('products')
            ->whereNull('deleted_at')
            ->where('stock_qty', '>', 0)
            ->distinct('category_id')
            ->count('category_id');

        return [
            'total_inventory_value' => round($totalValue, 2),
            'total_sku'             => $totalSku,
            'active_products'       => $activeCount,
            'out_of_stock_count'    => $outOfStock,
            'low_stock_count'       => $lowStock,
            'category_count'        => $categoryCount,
        ];
    }

    // ── Low stock products ────────────────────────────────────────────────────

    private function lowStock(): \Illuminate\Support\Collection
    {
        return DB::table('products')
            ->leftJoin('product_categories', 'products.category_id', '=', 'product_categories.id')
            ->whereNull('products.deleted_at')
            ->where('products.stock_qty', '>', 0)
            ->whereColumn('products.stock_qty', '<=', 'products.low_stock_threshold')
            ->select(
                'products.id',
                'products.name',
                'products.stock_qty',
                'products.low_stock_threshold',
                'products.average_cost',
                'products.sale_price',
                'product_categories.name as category_name'
            )
            ->orderBy('products.stock_qty')
            ->limit(20)
            ->get();
    }

    // ── Out of stock ──────────────────────────────────────────────────────────

    private function outOfStock(): \Illuminate\Support\Collection
    {
        return DB::table('products')
            ->leftJoin('product_categories', 'products.category_id', '=', 'product_categories.id')
            ->whereNull('products.deleted_at')
            ->where('products.stock_qty', 0)
            ->select(
                'products.id',
                'products.name',
                'products.sale_price',
                'product_categories.name as category_name'
            )
            ->orderBy('products.name')
            ->limit(20)
            ->get();
    }

    // ── Never sold ────────────────────────────────────────────────────────────

    private function neverSold(): \Illuminate\Support\Collection
    {
        return DB::table('products')
            ->leftJoin('sale_items', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin('product_categories', 'products.category_id', '=', 'product_categories.id')
            ->whereNull('products.deleted_at')
            ->whereNull('sale_items.product_id')
            ->select(
                'products.id',
                'products.name',
                'products.stock_qty',
                'products.sale_price',
                'products.average_cost',
                'product_categories.name as category_name'
            )
            ->orderBy('products.name')
            ->limit(15)
            ->get();
    }

    // ── Top moving (by qty sold in period) ───────────────────────────────────

    private function topMoving(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereNull('sales.deleted_at')
            ->whereNull('products.deleted_at')
            ->whereBetween('sales.sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('products.id', 'products.name', 'products.stock_qty')
            ->select(
                'products.id',
                'products.name',
                'products.stock_qty',
                DB::raw('SUM(sale_items.quantity) as total_qty_sold'),
                DB::raw('SUM(sale_items.subtotal) as total_revenue')
            )
            ->orderByDesc('total_qty_sold')
            ->limit(10)
            ->get();
    }

    // ── Slow moving (sold least in period) ───────────────────────────────────

    private function slowMoving(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereNull('sales.deleted_at')
            ->whereNull('products.deleted_at')
            ->whereBetween('sales.sale_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('products.id', 'products.name', 'products.stock_qty')
            ->select(
                'products.id',
                'products.name',
                'products.stock_qty',
                DB::raw('SUM(sale_items.quantity) as total_qty_sold'),
                DB::raw('SUM(sale_items.subtotal) as total_revenue')
            )
            ->orderBy('total_qty_sold')
            ->limit(10)
            ->get();
    }

    // ── Stock value by category ───────────────────────────────────────────────

    private function stockByCategory(): \Illuminate\Support\Collection
    {
        return DB::table('products')
            ->join('product_categories', 'products.category_id', '=', 'product_categories.id')
            ->whereNull('products.deleted_at')
            ->groupBy('product_categories.id', 'product_categories.name')
            ->select(
                'product_categories.name as category',
                DB::raw('COUNT(products.id) as product_count'),
                DB::raw('SUM(products.stock_qty) as total_qty'),
                DB::raw('SUM(products.stock_qty * products.average_cost) as total_value')
            )
            ->orderByDesc('total_value')
            ->get();
    }

    // ── Recent stock movements ────────────────────────────────────────────────

    private function recentMovements(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('stock_movements')
            ->join('products', 'stock_movements.product_id', '=', 'products.id')
            ->whereNull('products.deleted_at')
            ->whereBetween('stock_movements.created_at', [$from, $to])
            ->select(
                'stock_movements.id',
                'products.name as product_name',
                'stock_movements.type',
                'stock_movements.quantity',
                'stock_movements.before_quantity',
                'stock_movements.after_quantity',
                'stock_movements.created_at'
            )
            ->orderByDesc('stock_movements.created_at')
            ->limit(20)
            ->get();
    }

    // ── Purchase trend (intake) in period ────────────────────────────────────

    private function purchaseTrend(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        $days = $from->diffInDays($to) + 1;

        if ($days <= 60) {
            return DB::table('purchases')
                ->whereNull('deleted_at')
                ->whereBetween('purchase_date', [$from->toDateString(), $to->toDateString()])
                ->groupBy('purchase_date')
                ->select(
                    'purchase_date as label',
                    DB::raw('SUM(grand_total) as total'),
                    DB::raw('COUNT(*) as count')
                )
                ->orderBy('purchase_date')
                ->get();
        }

        return DB::table('purchases')
            ->whereNull('deleted_at')
            ->whereBetween('purchase_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy(DB::raw("DATE_FORMAT(purchase_date, '%Y-%m')"))
            ->select(
                DB::raw("DATE_FORMAT(purchase_date, '%Y-%m') as label"),
                DB::raw('SUM(grand_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->orderBy('label')
            ->get();
    }
}
