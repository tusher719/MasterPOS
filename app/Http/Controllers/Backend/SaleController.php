<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreSaleRequest;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Notifications\NewSaleNotification;
use App\Services\ActivityLogService;
use App\Services\SaleStockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private SaleStockService $stockService) {}

    // ─── POS Terminal ─────────────────────────────────────────────

    public function index(): Response
    {
        $this->authorize('viewAny', Sale::class);

        $products = Product::with('category', 'unit', 'images')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function ($p) {
                $sortedImages = $p->images->sortByDesc('is_primary')->values();

                return [
                    'id'                  => $p->id,
                    'name'                => $p->name,
                    'sku'                 => $p->sku,
                    'barcode'             => $p->barcode,
                    'sale_price'          => (float) $p->sale_price,
                    'cost_price'          => (float) $p->cost_price,
                    'stock_qty'           => (int) $p->stock_qty,
                    'low_stock_threshold' => $p->low_stock_threshold,
                    'min_sale_qty'        => $p->min_sale_qty !== null ? (float) $p->min_sale_qty : null,
                    'category'            => $p->category?->name,
                    'unit'                => $p->unit?->name,
                    'description'         => $p->description,
                    'weight'              => $p->weight !== null ? (float) $p->weight : null,
                    'weight_unit'         => $p->weight_unit,
                    'is_featured'         => (bool) $p->is_featured,
                    'is_taxable'          => (bool) $p->is_taxable,
                    'discount_type'       => $p->discount_type,
                    'discount_value'      => $p->discount_value !== null ? (float) $p->discount_value : null,
                    'image'               => $sortedImages->first()?->image_path,
                    'images'              => $sortedImages->pluck('image_path')->filter()->values()->all(),
                ];
            });

        $customers = Customer::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'email']);

        $paymentMethods = PaymentMethod::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Backend/POS/Index', [
            'products'       => $products,
            'customers'      => $customers,
            'paymentMethods' => $paymentMethods,
            'can'            => [
                'create'  => Gate::allows('create', Sale::class),
                'delete'  => Gate::allows('delete', Sale::class),
                'restore' => Gate::allows('restore', Sale::class),
            ],
        ]);
    }

    // ─── Process Sale ─────────────────────────────────────────────

    public function store(StoreSaleRequest $request): RedirectResponse
    {
        $this->authorize('create', Sale::class);

        $data = $request->validated();

        DB::transaction(function () use ($data) {
            // ── Calculate totals ──────────────────────────────────
            $subtotal = collect($data['items'])->sum(function ($item) {
                $itemSubtotal = $item['unit_price'] * $item['quantity'];
                $itemDiscount = $item['discount'] ?? 0;
                return $itemSubtotal - $itemDiscount;
            });

            $discount   = (float) ($data['discount'] ?? 0);
            $tax        = (float) ($data['tax'] ?? 0);
            $grandTotal = $subtotal - $discount + $tax;
            $paidAmount = (float) $data['paid_amount'];
            $dueAmount  = max(0, $grandTotal - $paidAmount);

            $paymentStatus = match (true) {
                $paidAmount <= 0              => 'due',
                $paidAmount >= $grandTotal    => 'paid',
                default                       => 'partial',
            };

            // ── Create sale ───────────────────────────────────────
            $sale = Sale::create([
                'reference_no'      => Sale::generateReference(),
                'customer_id'       => $data['customer_id'] ?? null,
                'sale_date'         => $data['sale_date'],
                'subtotal'          => $subtotal,
                'discount'          => $discount,
                'tax'               => $tax,
                'grand_total'       => $grandTotal,
                'paid_amount'       => $paidAmount,
                'due_amount'        => $dueAmount,
                'payment_status'    => $paymentStatus,
                'payment_method_id' => $data['payment_method_id'] ?? null,
                'note'              => $data['note'] ?? null,
                'created_by'        => Auth::id(),
            ]);

            // ── Create sale items ─────────────────────────────────
            foreach ($data['items'] as $item) {
                $itemSubtotal = ($item['unit_price'] * $item['quantity'])
                    - ($item['discount'] ?? 0);

                SaleItem::create([
                    'sale_id'    => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount'   => $item['discount'] ?? 0,
                    'subtotal'   => $itemSubtotal,
                ]);
            }

            // ── Reload items for stock service ────────────────────
            $sale->load('items');

            // ── Deduct stock ──────────────────────────────────────
            $this->stockService->applyStock($sale);

            // ── Activity log ──────────────────────────────────────
            ActivityLogService::log(
                'sales',
                'create',
                'Sale created: ' . $sale->reference_no,
                $sale,
                ['grand_total' => $sale->grand_total, 'payment_status' => $sale->payment_status]
            );

            // ── Fire NewSaleNotification ──────────────────────────
            $admins = \App\Models\User::role('Admin')->get();
            if ($admins->isNotEmpty()) {
                $customerName = $sale->customer?->name ?? 'Walk-in Customer';
                $itemCount = $sale->items->count();

                Notification::send($admins, new NewSaleNotification(
                    $sale->id,
                    (float) $sale->grand_total,
                    $customerName,
                    $itemCount
                ));
            }

            // ── Store sale id in session for receipt ──────────────
            session(['last_sale_id' => $sale->id]);
        });

        $saleId = session('last_sale_id');
        $sale   = Sale::find($saleId);

        return redirect()->back()->with([
            'id'           => $sale?->id,
            'reference_no' => $sale?->reference_no,
        ]);
    }

    // ─── Sales History List ───────────────────────────────────────

    public function salesList(): Response
    {
        $this->authorize('viewAny', Sale::class);

        $filters = request()->only(['search', 'status', 'trashed', 'date_from', 'date_to']);

        $query = Sale::with(['customer', 'paymentMethod', 'creator'])
            ->withCount('items');

        // Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        // Payment status filter
        if (!empty($filters['status'])) {
            $query->where('payment_status', $filters['status']);
        }

        // Date range filter
        if (!empty($filters['date_from'])) {
            $query->whereDate('sale_date', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('sale_date', '<=', $filters['date_to']);
        }

        // Trashed filter
        if (!empty($filters['trashed'])) {
            $query->onlyTrashed();
        }

        $sales = $query->orderByDesc('created_at')->paginate(15)->withQueryString();

        // Stats
        $stats = [
            'total'        => Sale::count(),
            'today'        => Sale::whereDate('sale_date', today())->count(),
            'total_revenue'=> (float) Sale::sum('grand_total'),
            'due_amount'   => (float) Sale::where('payment_status', '!=', 'paid')->sum('due_amount'),
        ];

        return Inertia::render('Backend/POS/Sales/Index', [
            'sales'   => $sales,
            'stats'   => $stats,
            'filters' => $filters,
            'can'     => [
                'view'    => Gate::allows('viewAny', Sale::class),
                'create'  => Gate::allows('create', Sale::class),
                'delete'  => Gate::allows('delete', Sale::class),
                'restore' => Gate::allows('restore', Sale::class),
            ],
        ]);
    }

    // ─── Sale Receipt / Detail ────────────────────────────────────

    public function show(Sale $sale): Response
    {
        $this->authorize('viewAny', Sale::class);

        $sale->load([
            'customer',
            'paymentMethod',
            'creator',
            'items.product',
        ]);

        return Inertia::render('Backend/POS/Sales/Show', [
            'sale' => $sale,
            'can'  => [
                'delete'  => Gate::allows('delete', Sale::class),
                'restore' => Gate::allows('restore', Sale::class),
            ],
        ]);
    }

    // ─── Void Sale (Soft Delete) ──────────────────────────────────

    public function destroy(Sale $sale): RedirectResponse
    {
        $this->authorize('delete', Sale::class);

        DB::transaction(function () use ($sale) {
            $sale->load('items');

            // Reverse stock
            $this->stockService->reverseStock($sale);

            // Soft delete
            $sale->delete();

            ActivityLogService::log(
                'sales',
                'delete',
                'Sale voided: ' . $sale->reference_no,
                $sale,
                ['grand_total' => $sale->grand_total]
            );
        });

        return redirect()->route('backend.pos.sales.index')
            ->with('success', 'Sale voided successfully.');
    }

    // ─── Restore Voided Sale ──────────────────────────────────────

    public function restore(int $id): RedirectResponse
    {
        $this->authorize('restore', Sale::class);

        $sale = Sale::onlyTrashed()->findOrFail($id);

        DB::transaction(function () use ($sale) {
            $sale->restore();

            $sale->load('items');

            // Re-apply stock
            $this->stockService->reApplyStock($sale);

            ActivityLogService::log(
                'sales',
                'restore',
                'Sale restored: ' . $sale->reference_no,
                $sale,
                ['grand_total' => $sale->grand_total]
            );
        });

        return redirect()->route('backend.pos.sales.index')
            ->with('success', 'Sale restored successfully.');
    }
}
