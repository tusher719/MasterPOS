<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreSaleRequest;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Notifications\NewSaleNotification;
use App\Services\ActivityLogService;
use App\Services\SaleStockService;
use Illuminate\Http\JsonResponse;
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

        $products = Product::with(['category', 'unit', 'images', 'variants'])
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
                    'has_variants'        => (bool) $p->has_variants,
                    'variants'            => $p->variants
                        ->where('is_active', true)
                        ->map(fn($v) => [
                            'id'                  => $v->id,
                            'sku'                 => $v->sku,
                            'attributes'          => $v->attributes,
                            'stock_qty'           => (float) $v->stock_qty,
                            'price_override'      => $v->price_override !== null ? (float) $v->price_override : null,
                            'cost_price_override' => $v->cost_price_override !== null ? (float) $v->cost_price_override : null,
                            'is_active'           => (bool) $v->is_active,
                            'label'               => $v->label,
                        ])
                        ->values(),
                ];
            });

        $customers = Customer::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'email']);

        // Map payment methods with all charge fields + active banks
        $paymentMethods = PaymentMethod::with('banks')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn($pm) => [
                'id'                  => $pm->id,
                'name'                => $pm->name,
                'type'                => $pm->type,
                'charge_enabled'      => (bool) $pm->charge_enabled,
                'online_charge_type'  => $pm->online_charge_type,
                'online_charge_value' => (float) $pm->online_charge_value,
                'charge_label'        => $pm->charge_label,
                'banks'               => $pm->banks
                    ->where('is_active', true)
                    ->map(fn($b) => [
                        'id'             => $b->id,
                        'bank_name'      => $b->bank_name,
                        'account_number' => $b->account_number,
                        'account_name'   => $b->account_name,
                        'charge_type'    => $b->charge_type,
                        'charge_value'   => (float) $b->charge_value,
                        'charge_enabled' => (bool) $b->charge_enabled,
                        'charge_label'   => $b->charge_label,
                        'is_active'      => (bool) $b->is_active,
                    ])
                    ->values(),
            ]);

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

    /**
     * POS checkout — returns JSON {id, reference_no}.
     * Frontend uses axios.post() not Inertia form submission.
     */
    public function store(StoreSaleRequest $request): JsonResponse
    {
        $this->authorize('create', Sale::class);

        $data = $request->validated();

        $saleId = null;

        DB::transaction(function () use ($data, &$saleId) {
            // ── Calculate item subtotal ───────────────────────────
            $subtotal = collect($data['items'])->sum(function ($item) {
                return ($item['unit_price'] * $item['quantity']) - ($item['discount'] ?? 0);
            });

            $discount = (float) ($data['discount'] ?? 0);
            $tax      = (float) ($data['tax'] ?? 0);

            // ── Delivery charge ───────────────────────────────────
            $deliveryChargeFree = (bool) ($data['delivery_charge_free'] ?? false);
            $deliveryType       = $data['delivery_type'] ?? null;
            $deliveryCharge     = 0.0;

            if (! $deliveryChargeFree && $deliveryType !== 'store_pickup') {
                $deliveryCharge = (float) ($data['delivery_charge'] ?? 0);
            }

            $grandTotal = $subtotal - $discount + $tax + $deliveryCharge;

            // ── Payment charge ────────────────────────────────────
            // Calculated at POS and passed in — stored on sale_payments row,
            // not on the sales table. Grand total does NOT include charge
            // (charge is a pass-through cost to the customer, tracked separately).
            $paymentCharge = (float) ($data['payment_charge'] ?? 0);

            // ── COD guard — no upfront payment ───────────────────
            $paymentType       = $data['payment_type'] ?? null;
            $isCOD             = $paymentType === 'cash_on_delivery';
            $initialPaidAmount = $isCOD ? 0.0 : (float) ($data['paid_amount'] ?? 0);
            $dueAmount         = max(0, $grandTotal - $initialPaidAmount);

            $paymentStatus = match (true) {
                $initialPaidAmount <= 0           => 'due',
                $initialPaidAmount >= $grandTotal => 'paid',
                default                           => 'partial',
            };

            // ── Delivery status ───────────────────────────────────
            $deliveryStatus = null;
            if ($deliveryType && $deliveryType !== 'store_pickup') {
                $deliveryStatus = $data['delivery_status'] ?? 'pending';
            }

            // ── Create sale ───────────────────────────────────────
            $sale = Sale::create([
                'reference_no'           => Sale::generateReference(),
                'customer_id'            => $data['customer_id'] ?? null,
                'sale_date'              => $data['sale_date'],
                'subtotal'               => $subtotal,
                'discount'               => $discount,
                'tax'                    => $tax,
                'grand_total'            => $grandTotal,
                'paid_amount'            => $initialPaidAmount,
                'due_amount'             => $dueAmount,
                'payment_status'         => $paymentStatus,
                'payment_method_id'      => $isCOD ? null : ($data['payment_method_id'] ?? null),
                'order_status'           => 'processing',
                'payment_type'           => $paymentType,
                'delivery_type'          => $deliveryType,
                'delivery_charge'        => $deliveryCharge,
                'delivery_charge_free'   => $deliveryChargeFree,
                'delivery_address'       => $data['delivery_address'] ?? null,
                'delivery_contact_phone' => $data['delivery_contact_phone'] ?? null,
                'delivery_status'        => $deliveryStatus,
                'note'                   => $data['note'] ?? null,
                'created_by'             => Auth::id(),
            ]);

            // ── Create sale items ─────────────────────────────────
            foreach ($data['items'] as $item) {
                SaleItem::create([
                    'sale_id'    => $sale->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'quantity'   => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount'   => $item['discount'] ?? 0,
                    'subtotal'   => ($item['unit_price'] * $item['quantity']) - ($item['discount'] ?? 0),
                ]);
            }

            // ── Create initial sale_payment row (non-COD, paid > 0) ──
            if (! $isCOD && $initialPaidAmount > 0) {
                SalePayment::create([
                    'sale_id'                => $sale->id,
                    'payment_method_id'      => $data['payment_method_id'] ?? null,
                    'payment_method_bank_id' => $data['payment_method_bank_id'] ?? null,
                    'amount'                 => $initialPaidAmount,
                    'payment_charge'         => $paymentCharge,
                    'payment_date'           => $data['sale_date'],
                    'reference'              => $data['payment_reference'] ?? null,
                    'note'                   => null,
                    'payment_proof_image'    => null,
                    'payment_status_manual'  => 'verified', // POS: immediate verification
                    'transaction_id'         => $data['transaction_id'] ?? null,
                    'verified_by'            => Auth::id(),
                    'verified_at'            => now(),
                    'created_by'             => Auth::id(),
                ]);

                // Sync paid_amount / due_amount / payment_status from actual rows
                $sale->recalculatePaymentStatus();
            }

            // ── Stock deduction ───────────────────────────────────
            $sale->load('items');
            $this->stockService->applyStock($sale);

            // ── Activity log ──────────────────────────────────────
            ActivityLogService::log(
                'sales',
                'create',
                'Sale created: ' . $sale->reference_no,
                $sale,
                [
                    'grand_total'     => $sale->grand_total,
                    'paid_amount'     => $sale->paid_amount,
                    'payment_status'  => $sale->payment_status,
                    'order_status'    => $sale->order_status,
                    'payment_type'    => $sale->payment_type,
                    'payment_charge'  => $paymentCharge,
                    'delivery_type'   => $sale->delivery_type,
                    'delivery_charge' => $sale->delivery_charge,
                    'delivery_status' => $sale->delivery_status,
                ]
            );

            // ── Notification ──────────────────────────────────────
            $admins = \App\Models\User::role('Admin')->get();
            if ($admins->isNotEmpty()) {
                Notification::send($admins, new NewSaleNotification(
                    $sale->id,
                    (float) $sale->grand_total,
                    $sale->customer?->name ?? 'Walk-in Customer',
                    $sale->items->count()
                ));
            }

            $saleId = $sale->id;
        });

        $sale = Sale::find($saleId);

        return response()->json([
            'id'           => $sale?->id,
            'reference_no' => $sale?->reference_no,
        ]);
    }

    // ─── Sales History List ───────────────────────────────────────

    public function salesList(): Response
    {
        $this->authorize('viewAny', Sale::class);

        $filters = request()->only([
            'search',
            'status',
            'order_status',
            'payment_type',
            'delivery_type',
            'delivery_status',
            'trashed',
            'date_from',
            'date_to',
        ]);

        $query = Sale::with(['customer', 'paymentMethod', 'creator'])
            ->withCount('items');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if (!empty($filters['status'])) {
            $query->where('payment_status', $filters['status']);
        }

        if (!empty($filters['order_status'])) {
            $query->where('order_status', $filters['order_status']);
        }

        if (!empty($filters['payment_type'])) {
            $query->where('payment_type', $filters['payment_type']);
        }

        if (!empty($filters['delivery_type'])) {
            $query->where('delivery_type', $filters['delivery_type']);
        }

        if (!empty($filters['delivery_status'])) {
            $query->where('delivery_status', $filters['delivery_status']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('sale_date', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('sale_date', '<=', $filters['date_to']);
        }

        if (!empty($filters['trashed'])) {
            $query->onlyTrashed();
        }

        $sales = $query->orderByDesc('created_at')->paginate(15)->withQueryString();

        $stats = [
            'total'         => Sale::count(),
            'today'         => Sale::whereDate('sale_date', today())->count(),
            'total_revenue' => (float) Sale::sum('grand_total'),
            'due_amount'    => (float) Sale::where('payment_status', '!=', 'paid')->sum('due_amount'),
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

    // ─── Sale Detail ──────────────────────────────────────────────

    public function show(Sale $sale): Response
    {
        $this->authorize('viewAny', Sale::class);

        $sale->load([
            'customer',
            'paymentMethod',
            'creator',
            'items.product',
            'salePayments.paymentMethod',
            'salePayments.paymentMethodBank',
            'salePayments.verifiedBy',
        ]);

        return Inertia::render('Backend/POS/Sales/Show', [
            'sale' => $sale,
            'can'  => [
                'delete'  => Gate::allows('delete', Sale::class),
                'restore' => Gate::allows('restore', Sale::class),
            ],
        ]);
    }

    // ─── Void Sale ────────────────────────────────────────────────

    public function destroy(Sale $sale): RedirectResponse
    {
        $this->authorize('delete', Sale::class);

        DB::transaction(function () use ($sale) {
            $sale->load('items');
            $this->stockService->reverseStock($sale);
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
