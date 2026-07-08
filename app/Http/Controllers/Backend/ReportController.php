<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Response;

class ReportController extends Controller
{
    // ─── Permission gate ───────────────────────────────────────────────────────

    private function authorizeView(): void
    {
        abort_unless(Auth::check() && Gate::allows('report.view'), 403);
    }

    private function authorizeExport(): void
    {
        abort_unless(Auth::check() && Gate::allows('report.export'), 403);
    }

    // ─── Shared date range helper ───────────────────────────────────────────────

    private function dateRange(Request $request): array
    {
        // NOTE: Laravel's ConvertEmptyStringsToNull middleware turns "?from=&to="
        // into null values, so $request->input('from', $default) would return
        // null instead of falling back to $default. filled() correctly treats
        // both "missing" and "empty/null" as "use the default".
        $from = $request->filled('from') ? $request->input('from') : now()->startOfMonth()->toDateString();
        $to   = $request->filled('to')   ? $request->input('to')   : now()->toDateString();
        return [$from, $to];
    }

    // ─── Hub ────────────────────────────────────────────────────────────────────

    public function index(): \Inertia\Response
    {
        $this->authorizeView();
        return Inertia::render('Backend/Reports/Index');
    }

    // ─── 1. Sales Report ────────────────────────────────────────────────────────

    public function sales(Request $request): \Inertia\Response
    {
        $this->authorizeView();
        [$from, $to] = $this->dateRange($request);

        $rows = DB::table('sales')
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->leftJoin('payment_methods', 'sales.payment_method_id', '=', 'payment_methods.id')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->whereNull('sales.deleted_at')
            ->select(
                'sales.id',
                'sales.reference_no',
                'sales.sale_date',
                'customers.name as customer_name',
                'payment_methods.name as payment_method',
                'sales.subtotal',
                'sales.discount',
                'sales.tax',
                'sales.grand_total',
                'sales.paid_amount',
                'sales.due_amount',
                'sales.payment_status'
            )
            ->orderByDesc('sales.sale_date')
            ->get();

        $summary = [
            'total_sales'    => $rows->count(),
            'total_revenue'  => $rows->sum('grand_total'),
            'total_discount' => $rows->sum('discount'),
            'total_tax'      => $rows->sum('tax'),
            'total_paid'     => $rows->sum('paid_amount'),
            'total_due'      => $rows->sum('due_amount'),
        ];

        return Inertia::render('Backend/Reports/Sales', [
            'rows'    => $rows,
            'summary' => $summary,
            'filters' => ['from' => $from, 'to' => $to],
            'can'     => [
                'export' => Gate::allows('report.export'),
            ],
        ]);
    }

    // ─── 2. Purchase Report ─────────────────────────────────────────────────────

    public function purchases(Request $request): \Inertia\Response
    {
        $this->authorizeView();
        [$from, $to] = $this->dateRange($request);

        $rows = DB::table('purchases')
            ->leftJoin('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->leftJoin('users as creator', 'purchases.created_by', '=', 'creator.id')
            ->whereBetween('purchases.purchase_date', [$from, $to])
            ->whereNull('purchases.deleted_at')
            ->select(
                'purchases.id',
                'purchases.reference_no',
                'purchases.purchase_date',
                'suppliers.name as supplier_name',
                'purchases.purchase_status',
                'purchases.subtotal',
                'purchases.discount',
                'purchases.tax',
                'purchases.shipping_cost',
                'purchases.grand_total',
                'purchases.paid_amount',
                'purchases.due_amount',
                'purchases.payment_status'
            )
            ->orderByDesc('purchases.purchase_date')
            ->get();

        $summary = [
            'total_purchases'  => $rows->count(),
            'total_cost'       => $rows->sum('grand_total'),
            'total_discount'   => $rows->sum('discount'),
            'total_tax'        => $rows->sum('tax'),
            'total_shipping'   => $rows->sum('shipping_cost'),
            'total_paid'       => $rows->sum('paid_amount'),
            'total_due'        => $rows->sum('due_amount'),
        ];

        return Inertia::render('Backend/Reports/Purchases', [
            'rows'    => $rows,
            'summary' => $summary,
            'filters' => ['from' => $from, 'to' => $to],
            'can'     => [
                'export' => Gate::allows('report.export'),
            ],
        ]);
    }

    // ─── 3. Expense Report ──────────────────────────────────────────────────────

    public function expenses(Request $request): \Inertia\Response
    {
        $this->authorizeView();
        [$from, $to] = $this->dateRange($request);

        $rows = DB::table('expenses')
            ->leftJoin('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->leftJoin('payment_methods', 'expenses.payment_method_id', '=', 'payment_methods.id')
            ->whereBetween('expenses.expense_date', [$from, $to])
            ->whereNull('expenses.deleted_at')
            ->select(
                'expenses.id',
                'expenses.title',
                'expenses.expense_date',
                'expense_categories.name as category_name',
                'payment_methods.name as payment_method',
                'expenses.amount',
                'expenses.reference'
                // NOTE: 'expenses.status' column does not exist in DB — removed
            )
            ->orderByDesc('expenses.expense_date')
            ->get();

        $byCategory = DB::table('expenses')
            ->leftJoin('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->whereBetween('expenses.expense_date', [$from, $to])
            ->whereNull('expenses.deleted_at')
            ->select('expense_categories.name as category_name', DB::raw('SUM(expenses.amount) as total'))
            ->groupBy('expense_categories.name')
            ->orderByDesc('total')
            ->get();

        $summary = [
            'total_expenses' => $rows->count(),
            'total_amount'   => $rows->sum('amount'),
            // NOTE: 'by_status' removed — relied on non-existent 'status' column
        ];

        return Inertia::render('Backend/Reports/Expenses', [
            'rows'       => $rows,
            'byCategory' => $byCategory,
            'summary'    => $summary,
            'filters'    => ['from' => $from, 'to' => $to],
            'can'        => [
                'export' => Gate::allows('report.export'),

            ],
        ]);
    }

    // ─── 4. Profit & Loss ───────────────────────────────────────────────────────

    public function profitLoss(Request $request): \Inertia\Response
    {
        $this->authorizeView();
        [$from, $to] = $this->dateRange($request);

        // Revenue
        $revenue = (float) DB::table('sales')
            ->whereBetween('sale_date', [$from, $to])
            ->whereNull('deleted_at')
            ->sum('grand_total');

        // COGS — sum of (unit_price × quantity) for sold items in period
        $cogs = (float) DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->whereNull('sales.deleted_at')
            ->select(DB::raw('SUM(sale_items.quantity * products.cost_price) as total'))
            ->value('total') ?? 0;

        // Gross profit
        $grossProfit = $revenue - $cogs;

        // Expenses
        $totalExpenses = (float) DB::table('expenses')
            ->whereBetween('expense_date', [$from, $to])
            ->whereNull('deleted_at')
            ->sum('amount');

        // Expense breakdown by category
        $expenseByCategory = DB::table('expenses')
            ->leftJoin('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->whereBetween('expenses.expense_date', [$from, $to])
            ->whereNull('expenses.deleted_at')
            ->select('expense_categories.name as category', DB::raw('SUM(expenses.amount) as total'))
            ->groupBy('expense_categories.name')
            ->orderByDesc('total')
            ->get();

        // Investments received in period
        $totalInvestments = (float) DB::table('investments')
            ->whereBetween('investment_date', [$from, $to])
            ->whereNull('deleted_at')
            ->sum('amount');

        // Net profit
        $netProfit = $grossProfit - $totalExpenses;

        // Sales count & AOV
        $salesCount = (int) DB::table('sales')
            ->whereBetween('sale_date', [$from, $to])
            ->whereNull('deleted_at')
            ->count();

        $summary = [
            'revenue'            => $revenue,
            'cogs'               => $cogs,
            'gross_profit'       => $grossProfit,
            'gross_margin'       => $revenue > 0 ? round(($grossProfit / $revenue) * 100, 2) : 0,
            'total_expenses'     => $totalExpenses,
            'net_profit'         => $netProfit,
            'net_margin'         => $revenue > 0 ? round(($netProfit / $revenue) * 100, 2) : 0,
            'total_investments'  => $totalInvestments,
            'sales_count'        => $salesCount,
            'aov'                => $salesCount > 0 ? round($revenue / $salesCount, 2) : 0,
        ];

        return Inertia::render('Backend/Reports/ProfitLoss', [
            'summary'            => $summary,
            'expenseByCategory'  => $expenseByCategory,
            'filters'            => ['from' => $from, 'to' => $to],
                'can'                => [
                    'export' => Auth::check() && Gate::allows('report.export'),
                ],
        ]);
    }

    // ─── 5. Inventory Report ────────────────────────────────────────────────────

    public function inventory(Request $request): Response
    {
        $this->authorizeView();

        $rows = DB::table('products')
            ->leftJoin('product_categories', 'products.category_id', '=', 'product_categories.id')
            ->leftJoin('units', 'products.unit_id', '=', 'units.id')
            ->whereNull('products.deleted_at')
            ->select(
                'products.id',
                'products.name',
                'products.sku',
                'products.barcode',
                'product_categories.name as category_name',
                'units.name as unit_name',
                'products.stock_qty',
                'products.low_stock_threshold',
                'products.cost_price',
                'products.sale_price',
                DB::raw('products.stock_qty * products.cost_price as stock_value'),
                'products.is_active'
            )
            ->orderBy('products.name')
            ->get();

        $summary = [
            'total_products'   => $rows->count(),
            'total_stock_qty'  => $rows->sum('stock_qty'),
            'total_stock_value'=> $rows->sum('stock_value'),
            'low_stock_count'  => $rows->filter(fn($r) => $r->stock_qty > 0 && $r->stock_qty <= $r->low_stock_threshold)->count(),
            'out_of_stock'     => $rows->filter(fn($r) => $r->stock_qty <= 0)->count(),
            'active_count'     => $rows->filter(fn($r) => $r->is_active)->count(),
        ];

        return Inertia::render('Backend/Reports/Inventory', [
            'rows'    => $rows,
            'summary' => $summary,
            'can'     => [
                'export' => Auth::check() && Gate::allows('report.export'),
            ],
        ]);
    }

    // ─── 6. Customer Ledger ─────────────────────────────────────────────────────

    public function customerLedger(Request $request): \Inertia\Response
    {
        $this->authorizeView();
        [$from, $to] = $this->dateRange($request);
        $customerId  = $request->input('customer_id');

        $query = DB::table('sales')
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->leftJoin('payment_methods', 'sales.payment_method_id', '=', 'payment_methods.id')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->whereNull('sales.deleted_at');

        if ($customerId) {
            $query->where('sales.customer_id', $customerId);
        }

        $rows = $query->select(
            'sales.id',
            'sales.reference_no',
            'sales.sale_date',
            'customers.id as customer_id',
            'customers.name as customer_name',
            'customers.phone as customer_phone',
            'payment_methods.name as payment_method',
            'sales.grand_total',
            'sales.paid_amount',
            'sales.due_amount',
            'sales.payment_status'
        )
        ->orderByDesc('sales.sale_date')
        ->get();

        // Top customers in period
        $topCustomers = DB::table('sales')
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->whereNull('sales.deleted_at')
            ->whereNotNull('sales.customer_id')
            ->select(
                'customers.id',
                'customers.name',
                DB::raw('COUNT(sales.id) as total_orders'),
                DB::raw('SUM(sales.grand_total) as total_spent'),
                DB::raw('SUM(sales.due_amount) as total_due')
            )
            ->groupBy('customers.id', 'customers.name')
            ->orderByDesc('total_spent')
            ->limit(10)
            ->get();

        // Customer list for filter dropdown
        $customers = DB::table('customers')
            ->whereNull('deleted_at')
            ->where('is_active', true)
            ->select('id', 'name', 'phone')
            ->orderBy('name')
            ->get();

        $summary = [
            'total_sales'    => $rows->count(),
            'total_revenue'  => $rows->sum('grand_total'),
            'total_paid'     => $rows->sum('paid_amount'),
            'total_due'      => $rows->sum('due_amount'),
        ];

        return Inertia::render('Backend/Reports/CustomerLedger', [
            'rows'         => $rows,
            'topCustomers' => $topCustomers,
            'customers'    => $customers,
            'summary'      => $summary,
            'filters'      => ['from' => $from, 'to' => $to, 'customer_id' => $customerId],
            'can'          => [
                'export' => Auth::check() && Gate::allows('report.export'),
            ],
        ]);
    }

    // ─── 7. Investment Report ───────────────────────────────────────────────────

    public function investments(Request $request): \Inertia\Response
    {
        $this->authorizeView();
        [$from, $to] = $this->dateRange($request);

        $rows = DB::table('investments')
            ->leftJoin('investment_types', 'investments.investment_type_id', '=', 'investment_types.id')
            ->whereBetween('investments.investment_date', [$from, $to])
            ->whereNull('investments.deleted_at')
            ->select(
                'investments.id',
                'investments.title',
                'investments.investor_name',
                'investments.investment_date',
                'investment_types.name as type_name',
                'investments.amount',
                'investments.reference',
                'investments.status'
            )
            ->orderByDesc('investments.investment_date')
            ->get();

        // Distributions paid out in period
        $distributions = DB::table('profit_distributions')
            ->whereBetween('distribution_date', [$from, $to])
            ->whereNull('deleted_at')
            ->where('status', 'distributed')
            ->select('id', 'distribution_no', 'distribution_date', 'distributable_amount', 'net_profit')
            ->orderByDesc('distribution_date')
            ->get();

        $summary = [
            'total_investments'    => $rows->count(),
            'total_amount'         => $rows->sum('amount'),
            'active_amount'        => $rows->where('status', 'active')->sum('amount'),
            'withdrawn_amount'     => $rows->where('status', 'withdrawn')->sum('amount'),
            'total_distributions'  => $distributions->count(),
            'total_distributed'    => $distributions->sum('distributable_amount'),
        ];

        return Inertia::render('Backend/Reports/Investments', [
            'rows'          => $rows,
            'distributions' => $distributions,
            'summary'       => $summary,
            'filters'       => ['from' => $from, 'to' => $to],
            'can'           => [
                'export' => Auth::check() && Gate::allows('report.export'),
            ],
        ]);
    }

    // ─── Export ─────────────────────────────────────────────────────────────────

    public function export(Request $request, string $type, string $fmt): mixed
    {
        $this->authorizeExport();

        abort_unless(in_array($fmt, ['csv', 'pdf']), 404);
        abort_unless(in_array($type, [
            'sales', 'purchases', 'expenses',
            'profit-loss', 'inventory', 'customer-ledger', 'investments'
        ]), 404);

        [$from, $to] = $this->dateRange($request);

        $data     = $this->buildExportData($type, $request, $from, $to);
        $filename = "report_{$type}_{$from}_{$to}";

        if ($fmt === 'csv') {
            return $this->exportCsv($data, $filename);
        }

        // PDF
        $view = "pdf.report_{$this->typeToView($type)}";
        $pdf  = Pdf::loadView($view, array_merge($data, [
            'from' => $from,
            'to'   => $to,
        ]))->setPaper('a4', 'landscape');

        return $pdf->download("{$filename}.pdf");
    }

    // ─── Export helpers ─────────────────────────────────────────────────────────

    private function typeToView(string $type): string
    {
        return str_replace('-', '_', $type);
    }

    private function buildExportData(string $type, Request $request, string $from, string $to): array
    {
        return match ($type) {
            'sales'           => $this->salesData($from, $to),
            'purchases'       => $this->purchasesData($from, $to),
            'expenses'        => $this->expensesData($from, $to),
            'profit-loss'     => $this->profitLossData($from, $to),
            'inventory'       => $this->inventoryData(),
            'customer-ledger' => $this->customerLedgerData($from, $to, $request->input('customer_id')),
            'investments'     => $this->investmentsData($from, $to),
        };
    }

    private function exportCsv(array $data, string $filename): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $rows    = $data['rows'] ?? collect();
        $headers = $data['csv_headers'] ?? [];

        return response()->streamDownload(function () use ($rows, $headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($rows as $row) {
                fputcsv($out, array_values((array) $row));
            }
            fclose($out);
        }, "{$filename}.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }

    // ─── Private data builders (reused by export) ───────────────────────────────

    private function salesData(string $from, string $to): array
    {
        $rows = DB::table('sales')
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->leftJoin('payment_methods', 'sales.payment_method_id', '=', 'payment_methods.id')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->whereNull('sales.deleted_at')
            ->select(
                'sales.reference_no', 'sales.sale_date',
                'customers.name as customer_name',
                'payment_methods.name as payment_method',
                'sales.subtotal', 'sales.discount', 'sales.tax',
                'sales.grand_total', 'sales.paid_amount',
                'sales.due_amount', 'sales.payment_status'
            )
            ->orderByDesc('sales.sale_date')->get();

        return [
            'rows'        => $rows,
            'csv_headers' => ['Ref No', 'Date', 'Customer', 'Payment Method',
                              'Subtotal', 'Discount', 'Tax', 'Grand Total',
                              'Paid', 'Due', 'Status'],
        ];
    }

    private function purchasesData(string $from, string $to): array
    {
        $rows = DB::table('purchases')
            ->leftJoin('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->whereBetween('purchases.purchase_date', [$from, $to])
            ->whereNull('purchases.deleted_at')
            ->select(
                'purchases.reference_no', 'purchases.purchase_date',
                'suppliers.name as supplier_name',
                'purchases.purchase_status',
                'purchases.grand_total', 'purchases.paid_amount',
                'purchases.due_amount', 'purchases.payment_status'
            )
            ->orderByDesc('purchases.purchase_date')->get();

        return [
            'rows'        => $rows,
            'csv_headers' => ['Ref No', 'Date', 'Supplier', 'Status',
                              'Grand Total', 'Paid', 'Due', 'Payment Status'],
        ];
    }

    private function expensesData(string $from, string $to): array
    {
        $rows = DB::table('expenses')
            ->leftJoin('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->leftJoin('payment_methods', 'expenses.payment_method_id', '=', 'payment_methods.id')
            ->whereBetween('expenses.expense_date', [$from, $to])
            ->whereNull('expenses.deleted_at')
            ->select(
                'expenses.title', 'expenses.expense_date',
                'expense_categories.name as category_name',
                'payment_methods.name as payment_method',
                'expenses.amount', 'expenses.reference'
                // NOTE: 'expenses.status' column does not exist in DB — removed
            )
            ->orderByDesc('expenses.expense_date')->get();

        return [
            'rows'        => $rows,
            'csv_headers' => ['Title', 'Date', 'Category', 'Payment Method',
                              'Amount', 'Reference'],
        ];
    }

    private function profitLossData(string $from, string $to): array
    {
        $revenue = (float) DB::table('sales')
            ->whereBetween('sale_date', [$from, $to])
            ->whereNull('deleted_at')->sum('grand_total');

        $cogs = (float) DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->whereNull('sales.deleted_at')
            ->select(DB::raw('SUM(sale_items.quantity * products.cost_price) as total'))
            ->value('total') ?? 0;

        $expenses = (float) DB::table('expenses')
            ->whereBetween('expense_date', [$from, $to])
            ->whereNull('deleted_at')->sum('amount');

        $expenseByCategory = DB::table('expenses')
            ->leftJoin('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->whereBetween('expenses.expense_date', [$from, $to])
            ->whereNull('expenses.deleted_at')
            ->select('expense_categories.name as category', DB::raw('SUM(expenses.amount) as total'))
            ->groupBy('expense_categories.name')
            ->orderByDesc('total')->get();

        $totalInvestments = (float) DB::table('investments')
            ->whereBetween('investment_date', [$from, $to])
            ->whereNull('deleted_at')
            ->sum('amount');

        $grossProfit = $revenue - $cogs;
        $netProfit   = $grossProfit - $expenses;

        $salesCount = (int) DB::table('sales')
            ->whereBetween('sale_date', [$from, $to])
            ->whereNull('deleted_at')
            ->count();

        // Flat rows for CSV — P&L is a statement, not a table
        $rows = collect([
            ['item' => 'Total Revenue',       'amount' => $revenue],
            ['item' => 'Cost of Goods Sold',  'amount' => $cogs],
            ['item' => 'Gross Profit',         'amount' => $grossProfit],
            ['item' => 'Total Expenses',       'amount' => $expenses],
            ['item' => 'Net Profit',           'amount' => $netProfit],
        ]);

        return [
            'rows'               => $rows,
            'csv_headers'        => ['Item', 'Amount'],
            // NOTE: keys must match what report_profit_loss.blade.php expects
            // (snake_case, not the camelCase compact() previously produced)
            'summary'            => [
                'revenue'            => $revenue,
                'cogs'               => $cogs,
                'gross_profit'       => $grossProfit,
                'gross_margin'       => $revenue > 0 ? round(($grossProfit / $revenue) * 100, 2) : 0,
                'total_expenses'     => $expenses,
                'net_profit'         => $netProfit,
                'net_margin'         => $revenue > 0 ? round(($netProfit / $revenue) * 100, 2) : 0,
                'total_investments'  => $totalInvestments,
                'sales_count'        => $salesCount,
                'aov'                => $salesCount > 0 ? round($revenue / $salesCount, 2) : 0,
            ],
            'expenseByCategory'  => $expenseByCategory,
        ];
    }

    private function inventoryData(): array
    {
        $rows = DB::table('products')
            ->leftJoin('product_categories', 'products.category_id', '=', 'product_categories.id')
            ->leftJoin('units', 'products.unit_id', '=', 'units.id')
            ->whereNull('products.deleted_at')
            ->select(
                'products.name', 'products.sku',
                'product_categories.name as category_name',
                'units.name as unit_name',
                'products.stock_qty',
                'products.cost_price', 'products.sale_price',
                DB::raw('products.stock_qty * products.cost_price as stock_value'),
                'products.is_active'
            )
            ->orderBy('products.name')->get();

        return [
            'rows'        => $rows,
            'csv_headers' => ['Product', 'SKU', 'Category', 'Unit',
                              'Stock Qty', 'Cost Price', 'Sale Price',
                              'Stock Value', 'Active'],
        ];
    }

    private function customerLedgerData(string $from, string $to, ?string $customerId): array
    {
        $query = DB::table('sales')
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->leftJoin('payment_methods', 'sales.payment_method_id', '=', 'payment_methods.id')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->whereNull('sales.deleted_at');

        if ($customerId) {
            $query->where('sales.customer_id', $customerId);
        }

        $rows = $query->select(
            'sales.reference_no', 'sales.sale_date',
            'customers.name as customer_name', 'customers.phone as customer_phone',
            'payment_methods.name as payment_method',
            'sales.grand_total', 'sales.paid_amount',
            'sales.due_amount', 'sales.payment_status'
        )->orderByDesc('sales.sale_date')->get();

        return [
            'rows'        => $rows,
            'csv_headers' => ['Ref No', 'Date', 'Customer', 'Phone',
                              'Payment Method', 'Grand Total', 'Paid', 'Due', 'Status'],
        ];
    }

    private function investmentsData(string $from, string $to): array
    {
        $rows = DB::table('investments')
            ->leftJoin('investment_types', 'investments.investment_type_id', '=', 'investment_types.id')
            ->whereBetween('investments.investment_date', [$from, $to])
            ->whereNull('investments.deleted_at')
            ->select(
                'investments.title', 'investments.investor_name',
                'investments.investment_date',
                'investment_types.name as type_name',
                'investments.amount', 'investments.reference', 'investments.status'
            )
            ->orderByDesc('investments.investment_date')->get();

        return [
            'rows'        => $rows,
            'csv_headers' => ['Title', 'Investor', 'Date', 'Type',
                              'Amount', 'Reference', 'Status'],
        ];
    }
}