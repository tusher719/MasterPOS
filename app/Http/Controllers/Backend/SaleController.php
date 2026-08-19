<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreSaleRequest;
use App\Http\Requests\Backend\StoreAdditionalPaymentRequest;
use App\Http\Requests\Backend\UpdateCourierRequest;
use App\Http\Requests\Backend\UpdateOrderStatusRequest as BackendUpdateOrderStatusRequest;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\SaleStatusHistory;
use App\Notifications\NewSaleNotification;
use App\Services\ActivityLogService;
use App\Services\Fraud\Layer1ValidationService;
use App\Services\Fraud\Layer2IpOrderLimitService;
use App\Services\SaleStockService;
use App\Services\SettingsService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use App\Mail\OrderConfirmationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private SaleStockService       $stockService,
        private Layer1ValidationService $layer1,
        private Layer2IpOrderLimitService   $layer2,
    ) {}

    // ─── POS Terminal ─────────────────────────────────────────────────────────

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

        $paymentMethods = $this->mapPaymentMethods();

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

    // ─── Process Sale ──────────────────────────────────────────────────────────

    /**
     * POS checkout — returns JSON {id, reference_no}.
     * Frontend uses axios.post() not Inertia form submission.
     *
     * Layer 1 fraud checks run BEFORE DB::transaction() (Rule 18 pattern).
     * A Layer 1 failure returns JSON {layer1_errors: {...}} with HTTP 422.
     * The frontend toasts each error inline — no page navigation.
     */
    public function store(StoreSaleRequest $request): JsonResponse
    {
        $this->authorize('create', Sale::class);

        $data = $request->validated();

        // ── Layer 1 validation (pre-flight, outside transaction) ──────────────
        // Resolve the phone to validate:
        //   - Walk-in order: staff typed customer_phone at checkout
        //   - Registered customer: read phone from the Customer record
        $phoneToCheck = null;

        if (! empty($data['customer_phone'])) {
            $phoneToCheck = $data['customer_phone'];
        } elseif (! empty($data['customer_id'])) {
            $customer     = Customer::find($data['customer_id']);
            $phoneToCheck = $customer?->phone;
        }

        // Only validate address when delivery is required (not store_pickup)
        $addressToCheck = null;
        $deliveryType   = $data['delivery_type'] ?? null;
        if ($deliveryType && $deliveryType !== 'store_pickup') {
            $addressToCheck = $data['delivery_address'] ?? null;
        }

        // customer_name is only checked for walk-in orders (no customer_id)
        $nameToCheck = empty($data['customer_id']) ? ($data['customer_name'] ?? null) : null;

        // AFTER
        if ($phoneToCheck !== null) {
            $layer1Errors = $this->layer1->validate($phoneToCheck, $nameToCheck, $addressToCheck);

            if (! empty($layer1Errors)) {
                return response()->json([
                    'layer1_errors' => $layer1Errors,
                ], 422);
            }
        }

        // ── Layer 2 validation (IP order limit, pre-flight, outside transaction) ─
        // Runs after Layer 1 so a gibberish-phone attempt does not consume an
        // IP slot. Only real-format phones proceed to the IP count check.
        // $request->ip() returns the client IP (respects X-Forwarded-For when
        // configured in TrustProxies middleware for production).
        $layer2Result = $this->layer2->check(
            ip:      $request->ip(),
            phone:   $phoneToCheck,
            name:    $nameToCheck,
            address: $addressToCheck,
        );

        if (! $layer2Result['passed']) {
            return response()->json([
                'layer2_blocked' => true,
                'reason'         => $layer2Result['message'], // 'ip_limit_exceeded'
            ], 422);
        }
        // ─────────────────────────────────────────────────────────────────────

        $saleId = null;

        DB::transaction(function () use ($data, &$saleId) {
            $subtotal = collect($data['items'])->sum(function ($item) {
                return ($item['unit_price'] * $item['quantity']) - ($item['discount'] ?? 0);
            });

            $discount = (float) ($data['discount'] ?? 0);
            $tax      = (float) ($data['tax'] ?? 0);

            $deliveryChargeFree = (bool) ($data['delivery_charge_free'] ?? false);
            $deliveryType       = $data['delivery_type'] ?? null;
            $deliveryCharge     = 0.0;

            if (! $deliveryChargeFree && $deliveryType !== 'store_pickup') {
                $deliveryCharge = (float) ($data['delivery_charge'] ?? 0);
            }

            $grandTotal    = $subtotal - $discount + $tax + $deliveryCharge;
            $paymentCharge = (float) ($data['payment_charge'] ?? 0);

            $paymentType       = $data['payment_type'] ?? null;
            $isCOD             = $paymentType === 'cash_on_delivery';
            $initialPaidAmount = $isCOD ? 0.0 : (float) ($data['paid_amount'] ?? 0);
            $dueAmount         = max(0, $grandTotal - $initialPaidAmount);

            $paymentStatus = match (true) {
                $initialPaidAmount <= 0           => 'due',
                $initialPaidAmount >= $grandTotal => 'paid',
                default                           => 'partial',
            };

            $deliveryStatus = null;
            if ($deliveryType && $deliveryType !== 'store_pickup') {
                $deliveryStatus = $data['delivery_status'] ?? 'pending';
            }

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
                    'payment_status_manual'  => 'verified',
                    'transaction_id'         => $data['transaction_id'] ?? null,
                    'verified_by'            => Auth::id(),
                    'verified_at'            => now(),
                    'created_by'             => Auth::id(),
                ]);

                $sale->recalculatePaymentStatus();
            }

            SaleStatusHistory::create([
                'sale_id'    => $sale->id,
                'status'     => 'processing',
                'note'       => 'Sale created.',
                'changed_by' => Auth::id(),
            ]);

            $sale->load('items');
            $this->stockService->applyStock($sale);

            ActivityLogService::log(
                'sales', 'create',
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

        // Send order confirmation email outside transaction —
        // mail failure must never roll back a completed sale.
        if (
            $sale &&
            ($data['send_email_confirmation'] ?? false) &&
            $sale->customer?->email
        ) {
            $this->sendOrderConfirmationEmail($sale);
        }

        return response()->json([
            'id'           => $sale?->id,
            'reference_no' => $sale?->reference_no,
        ]);
    }

    // ─── Sales History List ────────────────────────────────────────────────────

    public function salesList(): Response
    {
        $this->authorize('viewAny', Sale::class);

        $filters = request()->only([
            'search', 'status', 'order_status', 'payment_type',
            'delivery_type', 'delivery_status', 'trashed',
            'date_from', 'date_to', 'courier_status',
        ]);

        $query = Sale::with([
            'customer',
            'paymentMethod',
            'creator',
            'salePayments.paymentMethod',
            'salePayments.paymentMethodBank',
            'salePayments.verifiedBy',
        ])
        ->withCount('items');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if (! empty($filters['status']))          $query->where('payment_status', $filters['status']);
        if (! empty($filters['order_status']))    $query->where('order_status', $filters['order_status']);
        if (! empty($filters['payment_type']))    $query->where('payment_type', $filters['payment_type']);
        if (! empty($filters['delivery_type']))   $query->where('delivery_type', $filters['delivery_type']);
        if (! empty($filters['delivery_status'])) $query->where('delivery_status', $filters['delivery_status']);
        if (! empty($filters['courier_status']))  $query->where('courier_status', $filters['courier_status']);
        if (! empty($filters['date_from']))       $query->whereDate('sale_date', '>=', $filters['date_from']);
        if (! empty($filters['date_to']))         $query->whereDate('sale_date', '<=', $filters['date_to']);
        if (! empty($filters['trashed']))         $query->onlyTrashed();

        $sales = $query->orderByDesc('created_at')->paginate(15)->withQueryString();

        $stats = [
            'total'         => Sale::count(),
            'today'         => Sale::whereDate('sale_date', today())->count(),
            'total_revenue' => (float) Sale::sum('grand_total'),
            'due_amount'    => (float) Sale::where('payment_status', '!=', 'paid')->sum('due_amount'),
        ];

        return Inertia::render('Backend/POS/Sales/Index', [
            'sales'          => $sales,
            'stats'          => $stats,
            'filters'        => $filters,
            'paymentMethods' => $this->mapPaymentMethods(),
            'can'            => [
                'view'    => Gate::allows('viewAny', Sale::class),
                'create'  => Gate::allows('create', Sale::class),
                'delete'  => Gate::allows('delete', Sale::class),
                'restore' => Gate::allows('restore', Sale::class),
            ],
        ]);
    }

    // ─── Sale Detail ───────────────────────────────────────────────────────────

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
            'statusHistories.changedBy',
        ]);

        return Inertia::render('Backend/POS/Sales/Show', [
            'sale' => $sale,
            'can'  => [
                'delete'       => Gate::allows('delete', Sale::class),
                'restore'      => Gate::allows('restore', Sale::class),
                'updateStatus' => Gate::allows('create', Sale::class),
            ],
        ]);
    }

    // ─── Void Sale ─────────────────────────────────────────────────────────────

    public function destroy(Sale $sale): RedirectResponse
    {
        $this->authorize('delete', Sale::class);

        DB::transaction(function () use ($sale) {
            $sale->load('items');
            $this->stockService->reverseStock($sale);
            $sale->delete();

            ActivityLogService::log(
                'sales', 'delete',
                'Sale voided: ' . $sale->reference_no,
                $sale,
                ['grand_total' => $sale->grand_total]
            );
        });

        return redirect()->route('backend.pos.sales.index')
            ->with('success', 'Sale voided successfully.');
    }

    // ─── Restore Voided Sale ───────────────────────────────────────────────────

    public function restore(int $id): RedirectResponse
    {
        $this->authorize('restore', Sale::class);

        $sale = Sale::onlyTrashed()->findOrFail($id);

        DB::transaction(function () use ($sale) {
            $sale->restore();
            $sale->load('items');
            $this->stockService->reApplyStock($sale);

            ActivityLogService::log(
                'sales', 'restore',
                'Sale restored: ' . $sale->reference_no,
                $sale,
                ['grand_total' => $sale->grand_total]
            );
        });

        return redirect()->route('backend.pos.sales.index')
            ->with('success', 'Sale restored successfully.');
    }

    // ─── COD Payment Collection ────────────────────────────────────────────────

    public function collectCodPayment(Request $request, Sale $sale): RedirectResponse
    {
        $this->authorize('create', Sale::class);

        if ($sale->payment_type !== 'cash_on_delivery') {
            return back()->withErrors(['error' => 'This sale is not a COD order.']);
        }

        if ($sale->delivery_status === 'delivered') {
            return back()->withErrors(['error' => 'Payment already collected for this order.']);
        }

        $request->validate([
            'amount'                 => ['required', 'numeric', 'min:0.01'],
            'payment_method_id'      => ['required', 'exists:payment_methods,id'],
            'payment_method_bank_id' => ['nullable', 'exists:payment_method_banks,id'],
            'payment_charge'         => ['nullable', 'numeric', 'min:0'],
            'transaction_id'         => ['nullable', 'string', 'max:100'],
            'payment_reference'      => ['nullable', 'string', 'max:100'],
            'collection_date'        => ['required', 'date'],
            'note'                   => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($request, $sale) {
            SalePayment::create([
                'sale_id'                => $sale->id,
                'payment_method_id'      => $request->payment_method_id,
                'payment_method_bank_id' => $request->payment_method_bank_id,
                'amount'                 => $request->amount,
                'payment_charge'         => (float) ($request->payment_charge ?? 0),
                'payment_date'           => $request->collection_date,
                'reference'              => $request->payment_reference ?? null,
                'transaction_id'         => $request->transaction_id ?? null,
                'note'                   => $request->note ?? null,
                'payment_proof_image'    => null,
                'payment_status_manual'  => 'verified',
                'verified_by'            => Auth::id(),
                'verified_at'            => now(),
                'created_by'             => Auth::id(),
            ]);

            $sale->forceFill([
                'delivery_status' => 'delivered',
                'order_status'    => 'delivered',
            ])->save();

            $sale->recalculatePaymentStatus();

            SaleStatusHistory::create([
                'sale_id'    => $sale->id,
                'status'     => 'delivered',
                'note'       => 'COD payment collected. Marked as delivered.',
                'changed_by' => Auth::id(),
            ]);

            ActivityLogService::log(
                'sales', 'cod_payment_collected',
                'COD payment collected: ' . $sale->reference_no,
                $sale,
                [
                    'amount'          => $request->amount,
                    'collection_date' => $request->collection_date,
                    'delivery_status' => 'delivered',
                    'order_status'    => 'delivered',
                ]
            );
        });

        return back()->with('success', 'Payment collected and order marked as delivered.');
    }

    // ─── Add Additional Payment ────────────────────────────────────────────────

    /**
     * Add an additional payment entry to any existing sale.
     * Used by PaymentHistoryModal for Half Paid / partial due collection.
     * Always creates as verified immediately (POS / admin action).
     */
    public function addPayment(StoreAdditionalPaymentRequest $request, Sale $sale): RedirectResponse
    {
        $this->authorize('create', Sale::class);

        if ($sale->trashed()) {
            return back()->withErrors(['error' => 'Cannot add payment to a voided sale.']);
        }

        $data = $request->validated();

        DB::transaction(function () use ($data, $sale) {
            SalePayment::create([
                'sale_id'                => $sale->id,
                'payment_method_id'      => $data['payment_method_id'],
                'payment_method_bank_id' => $data['payment_method_bank_id'] ?? null,
                'amount'                 => $data['amount'],
                'payment_charge'         => (float) ($data['payment_charge'] ?? 0),
                'payment_date'           => $data['payment_date'],
                'reference'              => $data['payment_reference'] ?? null,
                'transaction_id'         => $data['transaction_id'] ?? null,
                'note'                   => $data['note'] ?? null,
                'payment_proof_image'    => null,
                'payment_status_manual'  => 'verified',
                'verified_by'            => Auth::id(),
                'verified_at'            => now(),
                'created_by'             => Auth::id(),
            ]);

            $sale->recalculatePaymentStatus();

            ActivityLogService::log(
                'sales', 'payment_added',
                'Additional payment added: ' . $sale->reference_no,
                $sale,
                [
                    'amount'       => $data['amount'],
                    'payment_date' => $data['payment_date'],
                ]
            );
        });

        return back()->with('success', 'Payment recorded successfully.');
    }

    // ─── Bulk Status Update ────────────────────────────────────────────────────

    /**
     * Bulk update order_status for selected sales.
     * Only safe statuses allowed in bulk: confirmed, out_for_delivery.
     * cancelled / returned / delivered require individual action (stock reverse, audit).
     */
    public function bulkStatusUpdate(Request $request): RedirectResponse
    {
        $this->authorize('create', Sale::class);

        $request->validate([
            'ids'    => ['required', 'array', 'min:1'],
            'ids.*'  => ['integer', 'exists:sales,id'],
            'status' => ['required', 'in:confirmed,out_for_delivery'],
        ]);

        $ids    = $request->ids;
        $status = $request->status;

        $sales = Sale::whereIn('id', $ids)
            ->whereNull('deleted_at')
            ->get();

        if ($sales->isEmpty()) {
            return back()->withErrors(['error' => 'No valid sales found for bulk update.']);
        }

        DB::transaction(function () use ($sales, $status) {
            foreach ($sales as $sale) {
                $previousStatus = $sale->order_status;

                $sale->forceFill(['order_status' => $status])->save();

                SaleStatusHistory::create([
                    'sale_id'    => $sale->id,
                    'status'     => $status,
                    'note'       => "Bulk status update from {$previousStatus}.",
                    'changed_by' => Auth::id(),
                ]);
            }

            ActivityLogService::log(
                'sales', 'bulk_status_update',
                "Bulk order status updated to {$status} for " . $sales->count() . ' sales.',
                null,
                ['ids' => $sales->pluck('id'), 'status' => $status]
            );
        });

        $label = $status === 'confirmed' ? 'Confirmed' : 'Out for Delivery';

        return back()->with('success', $sales->count() . " sale(s) marked as {$label}.");
    }

    // ─── Courier Info Update ───────────────────────────────────────────────────

    public function updateCourier(UpdateCourierRequest $request, Sale $sale): RedirectResponse
    {
        abort_unless(Gate::allows('create', Sale::class), 403);

        if ($sale->trashed()) {
            return back()->withErrors(['error' => 'Cannot update courier info for a voided sale.']);
        }

        $data = $request->validated();

        $sale->forceFill([
            'courier_provider'    => $data['courier_provider'] ?? null,
            'courier_tracking_id' => $data['courier_tracking_id'] ?? null,
            'courier_status'      => $data['courier_status'] ?? null,
            'courier_note'        => $data['courier_note'] ?? null,
        ])->save();

        ActivityLogService::log(
            'sales', 'courier_updated',
            'Courier info updated: ' . $sale->reference_no,
            $sale,
            [
                'courier_provider'    => $sale->courier_provider,
                'courier_tracking_id' => $sale->courier_tracking_id,
                'courier_status'      => $sale->courier_status,
            ]
        );

        return back()->with('success', 'Courier info updated successfully.');
    }

    // ─── Delivery Slip PDF ─────────────────────────────────────────────────────

    /**
     * Generate a courier-friendly delivery slip PDF.
     * Shows: customer name/phone/address, items (name + qty only), courier info.
     * Does NOT show financial details (unit cost, grand total breakdown).
     */
    public function deliverySlip(Sale $sale)
    {
        abort_unless(Gate::allows('viewAny', Sale::class), 403);

        if ($sale->trashed()) {
            abort(404);
        }

        $sale->load([
            'customer:id,name,phone,address,city',
            'items.product:id,name,sku',
            'items.variant:id,attributes',
        ]);

        $pdf = Pdf::loadView('pdf.delivery-slip', [
            'sale'     => $sale,
            'business' => $this->resolveBusinessProfile(),
        ])->setPaper('a5', 'portrait');

        $filename = 'DeliverySlip-' . $sale->reference_no . '.pdf';

        return $pdf->download($filename);
    }

    // ─── Update Order Status (Item 4.8) ───────────────────────────────────────

    /**
     * Individual order status update with mandatory reason.
     * Writes a SaleStatusHistory row on every change.
     */
    public function updateOrderStatus(
        BackendUpdateOrderStatusRequest $request,
        Sale $sale
    ): RedirectResponse {
        abort_unless(Gate::allows('create', Sale::class), 403);

        if ($sale->trashed()) {
            return back()->withErrors(['error' => 'Cannot update status of a voided sale.']);
        }

        $previousStatus = $sale->order_status;
        $newStatus      = $request->validated()['order_status'];
        $note           = $request->validated()['note'];

        if ($previousStatus === $newStatus) {
            return back()->withErrors(['error' => 'Sale is already in this status.']);
        }

        DB::transaction(function () use ($sale, $newStatus, $note, $previousStatus) {
            $sale->forceFill(['order_status' => $newStatus])->save();

            SaleStatusHistory::create([
                'sale_id'    => $sale->id,
                'status'     => $newStatus,
                'note'       => $note,
                'changed_by' => Auth::id(),
            ]);

            ActivityLogService::log(
                'sales', 'status_updated',
                "Order status changed: {$previousStatus} → {$newStatus} ({$sale->reference_no})",
                $sale,
                [
                    'previous_status' => $previousStatus,
                    'new_status'      => $newStatus,
                    'note'            => $note,
                ]
            );
        });

        return back()->with('success', 'Order status updated successfully.');
    }

    // ─── Private Helpers ───────────────────────────────────────────────────────

    /**
     * Map payment methods with all charge fields + active banks.
     * Used in index() and salesList() — DRY via private helper (Item 4.7).
     */
    private function mapPaymentMethods(): array
    {
        return PaymentMethod::with('banks')
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
                        'account_number' => $b->account_number ?? null,
                        'account_name'   => $b->account_name ?? null,
                        'charge_type'    => $b->charge_type,
                        'charge_value'   => (float) $b->charge_value,
                        'charge_enabled' => (bool) $b->charge_enabled,
                        'charge_label'   => $b->charge_label,
                        'is_active'      => (bool) $b->is_active,
                    ])
                    ->values(),
            ])
            ->toArray();
    }

    /**
     * Build business profile from SettingsService for PDF templates.
     * Used in deliverySlip() and sendOrderConfirmationEmail() — DRY (Item 4.7).
     */
    private function resolveBusinessProfile(): array
    {
        $all = SettingsService::all();

        return [
            'business_name'     => $all['business_name']    ?? config('app.name'),
            'email'             => $all['business_email']   ?? null,
            'phone'             => $all['business_phone']   ?? null,
            'address'           => $all['business_address'] ?? null,
            'logo'              => $all['business_logo']    ?? null,
            'currency_symbol'   => $all['currency_symbol']  ?? '৳',
            'currency_position' => $all['currency_position'] ?? 'before',
            'decimal_places'    => (int) ($all['decimal_places'] ?? 2),
        ];
    }

    /**
     * Send order confirmation email to the customer.
     * Called after DB transaction completes — never inside transaction.
     * Updates email_sent_at on success.
     */
    private function sendOrderConfirmationEmail(Sale $sale): void
    {
        $sale->loadMissing([
            'customer',
            'paymentMethod',
            'items.product',
            'items.variant',
        ]);

        try {
            Mail::to($sale->customer->email)
                ->send(new OrderConfirmationMail($sale, $this->resolveBusinessProfile()));

            $sale->update(['email_sent_at' => now()]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning(
                'Order confirmation email failed for sale ' . $sale->reference_no,
                ['error' => $e->getMessage()]
            );
        }
    }
}
