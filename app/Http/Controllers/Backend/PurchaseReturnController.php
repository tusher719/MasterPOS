<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StorePurchaseReturnRequest;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\StockMovement;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PurchaseReturnController extends Controller
{
    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): \Inertia\Response
    {
        abort_unless(Gate::allows('purchase_return.view'), 403);

        $query = PurchaseReturn::with([
            'purchase:id,reference_no,supplier_id',
            'purchase.supplier:id,name',
            'createdBy:id,name',
            'confirmedBy:id,name',
        ])->withCount('items');

        // Search by purchase reference number
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('purchase', fn($q) =>
                $q->where('reference_no', 'like', "%{$search}%")
            );
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->byStatus($request->status);
        }

        // Filter by return type
        if ($request->filled('return_type')) {
            $query->byType($request->return_type);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('return_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('return_date', '<=', $request->date_to);
        }

        // Trashed toggle — show soft-deleted records
        if ($request->filled('trashed') && $request->trashed === 'true') {
            $query->onlyTrashed();
        }

        $returns = $query->latest('return_date')->paginate(20)->withQueryString();

        // Summary stats for the stats cards
        $stats = [
            'total'            => PurchaseReturn::count(),
            'draft'            => PurchaseReturn::where('status', 'draft')->count(),
            'confirmed'        => PurchaseReturn::where('status', 'confirmed')->count(),
            'supplier_returns' => PurchaseReturn::where('return_type', 'supplier_return')->count(),
            'damage_wastage'   => PurchaseReturn::where('return_type', 'damage_wastage')->count(),
        ];

        return Inertia::render('Backend/PurchaseReturns/Index', [
            'returns'  => $returns,
            'stats'    => $stats,
            'filters'  => $request->only(['search', 'status', 'return_type', 'date_from', 'date_to', 'trashed']),
            'can'      => [
                'create'  => Gate::allows('purchase_return.create'),
                'confirm' => Gate::allows('purchase_return.confirm'),
                'delete'  => Gate::allows('purchase_return.delete'),
            ],
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────
    // Creates a draft return with its items.
    // Stock is NOT deducted here — only on confirm().

    public function store(StorePurchaseReturnRequest $request): \Illuminate\Http\RedirectResponse
    {
        abort_unless(Gate::allows('purchase_return.create'), 403);

        // Validate return quantities do not exceed what was originally purchased
        $purchase = Purchase::with('items.product')->findOrFail($request->purchase_id);

        $validationError = $this->validateReturnQuantities($purchase, $request->items);
        if ($validationError) {
            return back()->withErrors(['items' => $validationError])->withInput();
        }

        DB::transaction(function () use ($request, $purchase) {
            // Calculate total return value from items
            $totalValue = collect($request->items)->sum(function ($item) {
                return $item['quantity'] * $item['unit_cost'];
            });

            $return = PurchaseReturn::create([
                'purchase_id'        => $request->purchase_id,
                'return_date'        => $request->return_date,
                'return_type'        => $request->return_type,
                'reason'             => $request->reason,
                'note'               => $request->note,
                'total_return_value' => $totalValue,
                'created_by'         => Auth::id(),
            ]);

            // status defaults to 'draft' via DB default — no forceFill needed here

            // Create return items
            foreach ($request->items as $item) {
                PurchaseReturnItem::create([
                    'purchase_return_id' => $return->id,
                    'product_id'         => $item['product_id'],
                    'variant_id'         => $item['variant_id'] ?? null,
                    'quantity'           => $item['quantity'],
                    'unit_cost'          => $item['unit_cost'],
                    'subtotal'           => $item['quantity'] * $item['unit_cost'],
                    'reason_note'        => $item['reason_note'] ?? null,
                ]);
            }

            ActivityLogService::log(
                'purchase_returns',
                'create',
                "Purchase return draft created for purchase #{$purchase->reference_no}",
                $return,
                ['return_type' => $return->return_type, 'total_value' => $totalValue]
            );
        });

        return back()->with('success', 'Return draft created successfully.');
    }

    // ─── Confirm ──────────────────────────────────────────────────────────────
    // Confirms a draft return:
    //   1. Deducts stock for each item
    //   2. Records stock movements (type: return)
    //   3. Sets status to confirmed

    public function confirm(PurchaseReturn $purchaseReturn): RedirectResponse
    {
        abort_unless(Gate::allows('purchase_return.confirm'), 403);

        // Guard — only draft returns can be confirmed
        if ($purchaseReturn->isConfirmed()) {
            return back()->withErrors(['confirm' => 'This return has already been confirmed.']);
        }

        // Guard — soft-deleted returns cannot be confirmed
        if ($purchaseReturn->trashed()) {
            return back()->withErrors(['confirm' => 'Cannot confirm a deleted return.']);
        }

        DB::transaction(function () use ($purchaseReturn) {
            $purchaseReturn->load('items.product', 'items.variant');

            foreach ($purchaseReturn->items as $item) {
                $product = $item->product;

                if (!$product) {
                    continue;
                }

                if ($item->variant_id && $item->variant) {
                    // Variant stock deduction
                    $before = $item->variant->stock_qty;
                    $item->variant->decrement('stock_qty', $item->quantity);
                    $after = $item->variant->fresh()->stock_qty;
                } else {
                    // Main product stock deduction
                    $before = $product->stock_qty;
                    $product->decrement('stock_qty', $item->quantity);
                    $after = $product->fresh()->stock_qty;
                }

                // Record stock movement — type 'return' as per existing enum
                StockMovement::create([
                    'product_id'      => $item->product_id,
                    'variant_id'      => $item->variant_id,
                    'reference_type'  => 'purchase_return',
                    'reference_id'    => $purchaseReturn->id,
                    'type'            => 'return',
                    'quantity'        => -$item->quantity, // negative = stock going out
                    'before_quantity' => $before,
                    'after_quantity'  => $after,
                    'unit_cost'       => $item->unit_cost,
                    'note'            => ucfirst(str_replace('_', ' ', $purchaseReturn->return_type)),
                    'created_by'      => Auth::id(),
                ]);
            }

            // Mark confirmed — uses forceFill via model method (Rule 66)
            $purchaseReturn->confirm(Auth::id());

            ActivityLogService::log(
                'purchase_returns',
                'confirm',
                "Purchase return #{$purchaseReturn->id} confirmed — stock deducted",
                $purchaseReturn,
                ['return_type' => $purchaseReturn->return_type, 'total_value' => $purchaseReturn->total_return_value]
            );
        });

        return back()->with('success', 'Return confirmed and stock updated successfully.');
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────
    // Soft delete — confirmed returns cannot be deleted.

    public function destroy(PurchaseReturn $purchaseReturn): RedirectResponse
    {
        abort_unless(Gate::allows('purchase_return.delete'), 403);

        if ($purchaseReturn->isConfirmed()) {
            return back()->withErrors(['delete' => 'Confirmed returns cannot be deleted.']);
        }

        $purchaseReturn->delete();

        ActivityLogService::log(
            'purchase_returns',
            'delete',
            "Purchase return draft #{$purchaseReturn->id} deleted",
            $purchaseReturn
        );

        return back()->with('success', 'Return deleted successfully.');
    }

    // ─── Restore ──────────────────────────────────────────────────────────────

    public function restore(int $id): RedirectResponse
    {
        abort_unless(Gate::allows('purchase_return.delete'), 403);

        // Rule 2 — always use onlyTrashed()->findOrFail() for restore
        $purchaseReturn = PurchaseReturn::onlyTrashed()->findOrFail($id);
        $purchaseReturn->restore();

        ActivityLogService::log(
            'purchase_returns',
            'restore',
            "Purchase return #{$purchaseReturn->id} restored",
            $purchaseReturn
        );

        return back()->with('success', 'Return restored successfully.');
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Validate that return quantities do not exceed the originally purchased quantities.
     * Also accounts for quantities already returned in prior confirmed returns.
     */
    private function validateReturnQuantities(Purchase $purchase, array $items): ?string
    {
        // Build a map of product_id (and variant_id) => originally purchased qty
        $purchasedQty = [];
        foreach ($purchase->items as $pi) {
            $key = $pi->product_id . '-' . ($pi->variant_id ?? 0);
            $purchasedQty[$key] = ($purchasedQty[$key] ?? 0) + $pi->quantity;
        }

        // Build a map of already-confirmed returned quantities for this purchase
        $alreadyReturned = [];
        $confirmedReturns = PurchaseReturn::where('purchase_id', $purchase->id)
            ->where('status', 'confirmed')
            ->with('items')
            ->get();

        foreach ($confirmedReturns as $cr) {
            foreach ($cr->items as $ri) {
                $key = $ri->product_id . '-' . ($ri->variant_id ?? 0);
                $alreadyReturned[$key] = ($alreadyReturned[$key] ?? 0) + $ri->quantity;
            }
        }

        // Check each requested item against available qty
        foreach ($items as $item) {
            $key = $item['product_id'] . '-' . ($item['variant_id'] ?? 0);
            $purchased = $purchasedQty[$key] ?? 0;
            $returned  = $alreadyReturned[$key] ?? 0;
            $available = $purchased - $returned;

            if ($item['quantity'] > $available) {
                return "Return quantity ({$item['quantity']}) exceeds available quantity ({$available}) for one or more items.";
            }
        }

        return null;
    }
}
