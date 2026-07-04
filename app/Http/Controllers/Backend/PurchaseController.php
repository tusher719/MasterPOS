<?php

// app/Http/Controllers/Backend/PurchaseController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StorePurchaseRequest;
use App\Http\Requests\Backend\UpdatePurchaseRequest;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\PaymentMethod;
use App\Services\ActivityLogService;
use App\Services\PurchaseStockService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

class PurchaseController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private PurchaseStockService $stockService) {}

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Purchase::class);

        $query = Purchase::with(['supplier:id,name', 'createdBy:id,name'])
            ->withTrashed($request->boolean('trashed'));

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                  ->orWhereHas('supplier', fn($s) => $s->where('name', 'like', "%{$search}%"));
            });
        }

        // Filters
        if ($supplierId = $request->input('supplier_id')) {
            $query->where('supplier_id', $supplierId);
        }

        if ($purchaseStatus = $request->input('purchase_status')) {
            $query->where('purchase_status', $purchaseStatus);
        }

        if ($paymentStatus = $request->input('payment_status')) {
            $query->where('payment_status', $paymentStatus);
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('purchase_date', '>=', $dateFrom);
        }

        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('purchase_date', '<=', $dateTo);
        }

        $purchases = $query->latest('purchase_date')
            ->paginate(15)
            ->withQueryString();

        // Stats
        $stats = [
            'total_purchases' => Purchase::count(),
            'total_amount'    => Purchase::sum('grand_total'),
            'total_paid'      => Purchase::sum('paid_amount'),
            'total_due'       => Purchase::sum('due_amount'),
        ];

        return Inertia::render('Backend/Purchases/Index', [
            'purchases'      => $purchases,
            'suppliers'      => Supplier::active()->select('id', 'name')->get(),
            'paymentMethods' => PaymentMethod::active()->select('id', 'name')->get(),
            'stats'          => $stats,
            'filters'        => $request->only([
                'search', 'supplier_id', 'purchase_status',
                'payment_status', 'date_from', 'date_to', 'trashed',
            ]),
            'can' => [
                'create'  => $request->user()->can('create', Purchase::class),
                'edit'    => $request->user()->hasPermissionTo('purchase.edit'),
                'delete'  => $request->user()->hasPermissionTo('purchase.delete'),
                'restore' => $request->user()->hasPermissionTo('purchase.restore'),
                'payment' => $request->user()->hasPermissionTo('purchase.payment'),
                'export'  => $request->user()->hasPermissionTo('purchase.view'),
            ],
        ]);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function create(): Response
    {
        $this->authorize('create', Purchase::class);

        return Inertia::render('Backend/Purchases/Create', [
            'suppliers'        => Supplier::active()->select('id', 'name', 'company')->get(),
            'products'         => Product::active()
                ->select('id', 'name', 'sku', 'cost_price', 'stock_qty')
                ->get(),
            'paymentMethods'   => PaymentMethod::active()->select('id', 'name')->get(),
            'referenceNo'      => Purchase::generateReferenceNo(),
            'purchaseStatuses' => Purchase::PURCHASE_STATUSES,
            'paymentStatuses'  => Purchase::PAYMENT_STATUSES,
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(StorePurchaseRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $validated = $request->validated();

            // Calculate totals
            $subtotal   = collect($validated['items'])->sum(
                fn($i) => $i['quantity'] * $i['unit_cost']
            );
            $grandTotal = $subtotal
                - $validated['discount']
                + $validated['tax']
                + $validated['shipping_cost'];

            $paidAmount = min($validated['paid_amount'], $grandTotal);
            $dueAmount  = max(0, $grandTotal - $paidAmount);

            // Create purchase
            $purchase = Purchase::create([
                'supplier_id'     => $validated['supplier_id'],
                'reference_no'    => Purchase::generateReferenceNo(),
                'purchase_date'   => $validated['purchase_date'],
                'purchase_status' => $validated['purchase_status'],
                'subtotal'        => $subtotal,
                'discount'        => $validated['discount'],
                'tax'             => $validated['tax'],
                'shipping_cost'   => $validated['shipping_cost'],
                'grand_total'     => $grandTotal,
                'paid_amount'     => $paidAmount,
                'due_amount'      => $dueAmount,
                'payment_status'  => $dueAmount <= 0 ? 'paid' : ($paidAmount > 0 ? 'partial' : 'due'),
                'note'            => $validated['note'] ?? null,
                'created_by'      => Auth::id(),
            ]);

            // Create purchase items
            foreach ($validated['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id'  => $item['product_id'],
                    'quantity'    => $item['quantity'],
                    'unit_cost'   => $item['unit_cost'],
                    'subtotal'    => $item['quantity'] * $item['unit_cost'],
                ]);
            }

            // Apply stock if status triggers it
            if ($purchase->triggersStock()) {
                $purchase->load('items');
                $this->stockService->applyStock($purchase);
            }

            // Record initial payment if paid_amount > 0
            if ($paidAmount > 0 && !empty($validated['payment_method_id'])) {
                $purchase->payments()->create([
                    'payment_method_id' => $validated['payment_method_id'],
                    'amount'            => $paidAmount,
                    'payment_date'      => $validated['purchase_date'],
                    'note'              => 'Initial payment on purchase creation.',
                    'created_by'        => Auth::id(),
                ]);
            }

            ActivityLogService::log(
                'purchase',
                'created',
                "Purchase {$purchase->reference_no} created.",
                $purchase,
                ['grand_total' => $purchase->grand_total, 'status' => $purchase->purchase_status]
            );
        });

        return redirect()->route('backend.purchases.index')
            ->with('success', 'Purchase created successfully.');
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(Purchase $purchase): Response
    {
        $this->authorize('view', $purchase);

        $purchase->load([
            'supplier',
            'items.product:id,name,sku',
            'payments.paymentMethod:id,name',
            'payments.createdBy:id,name',
            'createdBy:id,name',
            'updatedBy:id,name',
        ]);

        /** @var User $user */
        $user = Auth::user();

        return Inertia::render('Backend/Purchases/Show', [
            'purchase'         => $purchase,
            'purchaseStatuses' => Purchase::PURCHASE_STATUSES,
            'paymentStatuses'  => Purchase::PAYMENT_STATUSES,
            'paymentMethods'   => PaymentMethod::active()->select('id', 'name')->get(),
            'can' => [
                'edit'    => $user->can('update', $purchase),
                'delete'  => $user->can('delete', $purchase),
                'payment' => $user->can('managePayment', $purchase),
            ],
        ]);
    }

    // ─── Edit ─────────────────────────────────────────────────────────────────

    public function edit(Purchase $purchase): Response
    {
        $this->authorize('update', $purchase);

        $purchase->load([
            'items.product:id,name,sku',
            'payments' => fn($q) => $q->latest('payment_date')->latest('id'),
        ]);

        return Inertia::render('Backend/Purchases/Edit', [
            'purchase'              => $purchase,
            'suppliers'             => Supplier::active()->select('id', 'name', 'company')->get(),
            'products'              => Product::active()
                ->select('id', 'name', 'sku', 'cost_price', 'stock_qty')
                ->get(),
            'paymentMethods'        => PaymentMethod::active()->select('id', 'name')->get(),
            'purchaseStatuses'      => Purchase::PURCHASE_STATUSES,
            'paymentStatuses'       => Purchase::PAYMENT_STATUSES,
            'latestPaymentMethodId' => $purchase->payments->first()?->payment_method_id,
        ]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(UpdatePurchaseRequest $request, Purchase $purchase): RedirectResponse
    {
        DB::transaction(function () use ($request, $purchase) {
            $validated     = $request->validated();
            $oldStatus     = $purchase->purchase_status;
            $newStatus     = $validated['purchase_status'];
            $oldPaidAmount = (float) $purchase->paid_amount;

            // Snapshot old items before deletion
            $oldItems = $purchase->items()->get();

            // Recalculate totals
            $subtotal   = collect($validated['items'])->sum(
                fn($i) => $i['quantity'] * $i['unit_cost']
            );
            $grandTotal = $subtotal
                - $validated['discount']
                + $validated['tax']
                + $validated['shipping_cost'];

            $paidAmount = min($validated['paid_amount'], $grandTotal);
            $dueAmount  = max(0, $grandTotal - $paidAmount);

            // Sync stock diff before items are replaced
            $this->stockService->syncStock(
                $purchase,
                $oldItems,
                $validated['items'],
                $oldStatus,
                $newStatus
            );

            // Delete old items and recreate
            $purchase->items()->delete();

            foreach ($validated['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id'  => $item['product_id'],
                    'quantity'    => $item['quantity'],
                    'unit_cost'   => $item['unit_cost'],
                    'subtotal'    => $item['quantity'] * $item['unit_cost'],
                ]);
            }

            // If status just changed into stock-trigger — apply fresh stock
            if (
                !in_array($oldStatus, Purchase::STOCK_TRIGGER_STATUSES) &&
                in_array($newStatus, Purchase::STOCK_TRIGGER_STATUSES)
            ) {
                $purchase->load('items');
                $this->stockService->applyStock($purchase);
            }

            $purchase->update([
                'supplier_id'     => $validated['supplier_id'],
                'purchase_date'   => $validated['purchase_date'],
                'purchase_status' => $newStatus,
                'subtotal'        => $subtotal,
                'discount'        => $validated['discount'],
                'tax'             => $validated['tax'],
                'shipping_cost'   => $validated['shipping_cost'],
                'grand_total'     => $grandTotal,
                'paid_amount'     => $paidAmount,
                'due_amount'      => $dueAmount,
                'payment_status'  => $dueAmount <= 0 ? 'paid' : ($paidAmount > 0 ? 'partial' : 'due'),
                'note'            => $validated['note'] ?? null,
                'updated_by'      => Auth::id(),
            ]);

            // Record payment for any increase in paid_amount
            $paidDelta = round($paidAmount - $oldPaidAmount, 2);

            if ($paidDelta > 0 && !empty($validated['payment_method_id'])) {
                $purchase->payments()->create([
                    'payment_method_id' => $validated['payment_method_id'],
                    'amount'            => $paidDelta,
                    'payment_date'      => $validated['purchase_date'],
                    'note'              => 'Additional payment recorded on purchase update.',
                    'created_by'        => Auth::id(),
                ]);
            }

            ActivityLogService::log(
                'purchase',
                'updated',
                "Purchase {$purchase->reference_no} updated.",
                $purchase,
                ['old_status' => $oldStatus, 'new_status' => $newStatus]
            );
        });

        return redirect()->route('backend.purchases.index')
            ->with('success', 'Purchase updated successfully.');
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(Purchase $purchase): RedirectResponse
    {
        $this->authorize('delete', $purchase);

        DB::transaction(function () use ($purchase) {
            if ($purchase->triggersStock()) {
                $purchase->load('items');
                $this->stockService->reverseStock($purchase);
            }

            $purchase->update(['updated_by' => Auth::id()]);
            $purchase->delete();

            ActivityLogService::log(
                'purchase',
                'deleted',
                "Purchase {$purchase->reference_no} deleted.",
                $purchase
            );
        });

        return back()->with('success', 'Purchase deleted successfully.');
    }

    // ─── Restore ──────────────────────────────────────────────────────────────

    public function restore(int $id): RedirectResponse
    {
        $purchase = Purchase::onlyTrashed()->findOrFail($id);

        $this->authorize('restore', $purchase);

        DB::transaction(function () use ($purchase) {
            $purchase->restore();

            if ($purchase->triggersStock()) {
                $purchase->load('items');
                $this->stockService->applyStock($purchase);
            }

            $purchase->update(['updated_by' => Auth::id()]);

            ActivityLogService::log(
                'purchase',
                'restored',
                "Purchase {$purchase->reference_no} restored.",
                $purchase
            );
        });

        return back()->with('success', 'Purchase restored successfully.');
    }

    // ─── Duplicate ────────────────────────────────────────────────────────────

    public function duplicate(Purchase $purchase): RedirectResponse
    {
        $this->authorize('duplicate', $purchase);

        DB::transaction(function () use ($purchase) {
            $purchase->load('items');

            $newPurchase = Purchase::create([
                'supplier_id'     => $purchase->supplier_id,
                'reference_no'    => Purchase::generateReferenceNo(),
                'purchase_date'   => now()->toDateString(),
                'purchase_status' => 'draft',
                'subtotal'        => $purchase->subtotal,
                'discount'        => $purchase->discount,
                'tax'             => $purchase->tax,
                'shipping_cost'   => $purchase->shipping_cost,
                'grand_total'     => $purchase->grand_total,
                'paid_amount'     => 0,
                'due_amount'      => $purchase->grand_total,
                'payment_status'  => 'due',
                'note'            => $purchase->note,
                'created_by'      => Auth::id(),
            ]);

            foreach ($purchase->items as $item) {
                PurchaseItem::create([
                    'purchase_id' => $newPurchase->id,
                    'product_id'  => $item->product_id,
                    'quantity'    => $item->quantity,
                    'unit_cost'   => $item->unit_cost,
                    'subtotal'    => $item->subtotal,
                ]);
            }

            ActivityLogService::log(
                'purchase',
                'duplicated',
                "Purchase {$purchase->reference_no} duplicated as {$newPurchase->reference_no}.",
                $newPurchase
            );
        });

        return back()->with('success', 'Purchase duplicated successfully.');
    }

    // ─── Bulk Action ──────────────────────────────────────────────────────────

    public function bulkAction(Request $request): RedirectResponse
    {
        $request->validate([
            'action' => ['required', 'string', 'in:delete,restore,change_purchase_status,change_payment_status'],
            'ids'    => ['required', 'array', 'min:1'],
            'ids.*'  => ['integer'],
            'value'  => ['nullable', 'string'],
        ]);

        $action = $request->input('action');
        $ids    = $request->input('ids');
        $value  = $request->input('value');

        // Authorize upfront using Gate — before entering transaction
        $abilityMap = [
            'delete'                 => 'bulkDelete',
            'restore'                => 'bulkRestore',
            'change_purchase_status' => 'bulkStatusChange',
            'change_payment_status'  => 'bulkStatusChange',
        ];

        if (Gate::denies($abilityMap[$action], Purchase::class)) {
            abort(403, 'You do not have permission to perform this action.');
        }

        DB::transaction(function () use ($action, $ids, $value) {
            match ($action) {
                'delete'                 => $this->bulkDelete($ids),
                'restore'                => $this->bulkRestore($ids),
                'change_purchase_status' => $this->bulkChangePurchaseStatus($ids, $value),
                'change_payment_status'  => $this->bulkChangePaymentStatus($ids, $value),
            };
        });

        return back()->with('success', 'Bulk action completed successfully.');
    }

    // ─── Private Bulk Helpers ─────────────────────────────────────────────────

    private function bulkDelete(array $ids): void
    {
        $purchases = Purchase::whereIn('id', $ids)->get();

        foreach ($purchases as $purchase) {
            if ($purchase->triggersStock()) {
                $purchase->load('items');
                $this->stockService->reverseStock($purchase);
            }
            $purchase->delete();
        }

        ActivityLogService::log(
            'purchase', 'bulk_deleted',
            'Bulk deleted ' . count($ids) . ' purchases.',
            null, ['ids' => $ids]
        );
    }

    private function bulkRestore(array $ids): void
    {
        $purchases = Purchase::onlyTrashed()->whereIn('id', $ids)->get();

        foreach ($purchases as $purchase) {
            $purchase->restore();
            if ($purchase->triggersStock()) {
                $purchase->load('items');
                $this->stockService->applyStock($purchase);
            }
        }

        ActivityLogService::log(
            'purchase', 'bulk_restored',
            'Bulk restored ' . count($ids) . ' purchases.',
            null, ['ids' => $ids]
        );
    }

    private function bulkChangePurchaseStatus(array $ids, ?string $status): void
    {
        if (!$status || !array_key_exists($status, Purchase::PURCHASE_STATUSES)) {
            abort(422, 'Invalid purchase status.');
        }

        $purchases = Purchase::whereIn('id', $ids)->get();

        foreach ($purchases as $purchase) {
            $oldStatus = $purchase->purchase_status;

            $this->stockService->syncStock(
                $purchase,
                $purchase->items,
                $purchase->items->map(fn($i) => [
                    'product_id' => $i->product_id,
                    'quantity'   => $i->quantity,
                    'unit_cost'  => $i->unit_cost,
                ])->toArray(),
                $oldStatus,
                $status
            );

            $purchase->update([
                'purchase_status' => $status,
                'updated_by'      => Auth::id(),
            ]);
        }

        ActivityLogService::log(
            'purchase', 'bulk_status_changed',
            "Bulk changed purchase status to {$status} for " . count($ids) . ' purchases.',
            null, ['ids' => $ids, 'status' => $status]
        );
    }

    private function bulkChangePaymentStatus(array $ids, ?string $status): void
    {
        if (!$status || !array_key_exists($status, Purchase::PAYMENT_STATUSES)) {
            abort(422, 'Invalid payment status.');
        }

        $purchases = Purchase::whereIn('id', $ids)->get();

        foreach ($purchases as $purchase) {
            // Cannot force "paid" while due_amount > 0
            if ($status === 'paid' && (float) $purchase->due_amount > 0) {
                continue;
            }

            // Cannot force "due" while paid_amount > 0
            if ($status === 'due' && (float) $purchase->paid_amount > 0) {
                continue;
            }

            $purchase->update([
                'payment_status' => $status,
                'updated_by'     => Auth::id(),
            ]);
        }

        ActivityLogService::log(
            'purchase', 'bulk_status_changed',
            "Bulk changed payment status to {$status} for " . count($ids) . ' purchases.',
            null, ['ids' => $ids, 'status' => $status]
        );
    }

    public function payments(Purchase $purchase)
    {
        $payments = $purchase->payments()
            ->with(['paymentMethod', 'createdBy']) // তোমার actual relation নাম বসাও
            ->latest()
            ->get();

        if (request()->ajax() || request()->wantsJson()) {
            return response()->json(['payments' => $payments]);
        }

        // fallback (direct browser visit হলে)
        return Inertia::render('Backend/Purchases/Payments', [
            'purchase' => $purchase,
            'payments' => $payments,
        ]);
    }
}
