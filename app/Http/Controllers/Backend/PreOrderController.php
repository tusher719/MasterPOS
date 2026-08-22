<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StorePreOrderRequest;
use App\Http\Requests\Backend\UpdatePreOrderRequest;
use App\Models\Customer;
use App\Models\PreOrder;
use App\Models\Product;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PreOrderController extends Controller
{
    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        abort_unless(Gate::allows('viewAny', PreOrder::class), 403);

        $query = PreOrder::query()
            ->with([
                'customer:id,name,phone',
                'product:id,name',
                'createdBy:id,name',
                'linkedSale:id,reference_no',
            ])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->search;
                $q->where(function ($inner) use ($search) {
                    $inner->where('customer_name_snapshot', 'like', "%{$search}%")
                        ->orWhere('customer_phone_snapshot', 'like', "%{$search}%")
                        ->orWhere('product_name_snapshot', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->when($request->filled('date_from'), fn($q) => $q->whereDate('booking_date', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn($q) => $q->whereDate('booking_date', '<=', $request->date_to))
            ->when($request->filled('trashed') && $request->trashed === 'only', fn($q) => $q->onlyTrashed())
            ->orderBy('booking_date', 'desc')
            ->orderBy('id', 'desc');

        $preOrders = $query->paginate(20)->withQueryString();

        // ── Summary stats ─────────────────────────────────────────────────────
        $stats = [
            'total'     => PreOrder::count(),
            'pending'   => PreOrder::where('status', 'pending')->count(),
            'confirmed' => PreOrder::where('status', 'confirmed')->count(),
            'ready'     => PreOrder::where('status', 'ready')->count(),
            'delivered' => PreOrder::where('status', 'delivered')->count(),
            'cancelled' => PreOrder::where('status', 'cancelled')->count(),
            'overdue'   => PreOrder::overdue()->count(),
        ];

        return Inertia::render('Backend/PreOrders/Index', [
            'preOrders' => $preOrders,
            'stats'     => $stats,
            'filters'   => $request->only(['search', 'status', 'date_from', 'date_to', 'trashed']),
            'can'       => [
                'create' => Gate::allows('create', PreOrder::class),
                'manage' => Gate::allows('manage', PreOrder::class),
            ],
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(StorePreOrderRequest $request)
    {
        abort_unless(Gate::allows('create', PreOrder::class), 403);

        $data = $request->validated();

        // Handle advance payment proof upload
        if ($request->hasFile('advance_payment_proof')) {
            $data['advance_payment_proof'] = $request->file('advance_payment_proof')
                ->store('pre-orders/proofs', 'public');
        }

        // Auto-calculate due amount
        $data['due_amount']  = max(0, (float) $data['total_amount'] - (float) $data['advance_amount']);
        $data['created_by']  = Auth::id();
        $data['updated_by']  = Auth::id();

        $preOrder = PreOrder::create($data);

        // Set initial status via forceFill (excluded from $fillable)
        $preOrder->forceFill(['status' => 'pending'])->save();

        ActivityLogService::log(
            'pre_orders',
            'create',
            "Pre-order created for {$preOrder->customer_name_snapshot}",
            $preOrder,
            ['total_amount' => $preOrder->total_amount, 'advance_amount' => $preOrder->advance_amount]
        );

        return redirect()->back()->with('success', 'Pre-order created successfully.');
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(UpdatePreOrderRequest $request, PreOrder $preOrder)
    {
        abort_unless(Gate::allows('manage', PreOrder::class), 403);

        $data = $request->validated();

        // Handle new proof upload — delete old file if replaced
        if ($request->hasFile('advance_payment_proof')) {
            if ($preOrder->advance_payment_proof) {
                Storage::disk('public')->delete($preOrder->advance_payment_proof);
            }
            $data['advance_payment_proof'] = $request->file('advance_payment_proof')
                ->store('pre-orders/proofs', 'public');
        }

        // Recalculate due amount
        $data['due_amount'] = max(0, (float) $data['total_amount'] - (float) $data['advance_amount']);
        $data['updated_by'] = Auth::id();

        $preOrder->update($data);

        ActivityLogService::log(
            'pre_orders',
            'update',
            "Pre-order updated for {$preOrder->customer_name_snapshot}",
            $preOrder,
            ['total_amount' => $preOrder->total_amount]
        );

        return redirect()->back()->with('success', 'Pre-order updated successfully.');
    }

    // ─── Update Status ────────────────────────────────────────────────────────

    public function updateStatus(Request $request, PreOrder $preOrder)
    {
        abort_unless(Gate::allows('manage', PreOrder::class), 403);

        $request->validate([
            'status' => ['required', 'in:pending,confirmed,ready,delivered,cancelled'],
            'note'   => ['nullable', 'string', 'max:500'],
        ]);

        // Block if already terminal
        if ($preOrder->isTerminal()) {
            return redirect()->back()->withErrors([
                'status' => 'Cannot change status of a delivered or cancelled pre-order.',
            ]);
        }

        // Block same-status update
        if ($preOrder->status === $request->status) {
            return redirect()->back()->withErrors([
                'status' => 'Pre-order is already in this status.',
            ]);
        }

        $oldStatus = $preOrder->status;

        $preOrder->forceFill([
            'status'     => $request->status,
            'updated_by' => Auth::id(),
        ])->save();

        // Append note if provided
        if ($request->filled('note')) {
            $preOrder->update(['note' => trim($preOrder->note . "\n" . $request->note)]);
        }

        ActivityLogService::log(
            'pre_orders',
            'status_update',
            "Pre-order status changed from {$oldStatus} to {$request->status}",
            $preOrder,
            ['old_status' => $oldStatus, 'new_status' => $request->status]
        );

        return redirect()->back()->with('success', 'Pre-order status updated successfully.');
    }

    // ─── Convert to Sale ──────────────────────────────────────────────────────

    public function convertToSale(Request $request, PreOrder $preOrder)
    {
        abort_unless(Gate::allows('manage', PreOrder::class), 403);

        $request->validate([
            'sale_id' => ['required', 'exists:sales,id'],
        ]);

        // Block if already converted
        if ($preOrder->isConverted()) {
            return redirect()->back()->withErrors([
                'sale_id' => 'This pre-order is already linked to a sale.',
            ]);
        }

        // Block if cancelled
        if ($preOrder->isCancelled()) {
            return redirect()->back()->withErrors([
                'sale_id' => 'Cannot convert a cancelled pre-order.',
            ]);
        }

        $preOrder->forceFill([
            'linked_sale_id' => $request->sale_id,
            'status'         => 'delivered',
            'updated_by'     => Auth::id(),
        ])->save();

        ActivityLogService::log(
            'pre_orders',
            'convert',
            "Pre-order converted to sale #{$request->sale_id}",
            $preOrder,
            ['sale_id' => $request->sale_id]
        );

        return redirect()->back()->with('success', 'Pre-order linked to sale and marked as delivered.');
    }

    // ─── Destroy (soft delete) ────────────────────────────────────────────────

    public function destroy(PreOrder $preOrder)
    {
        abort_unless(Gate::allows('delete', PreOrder::class), 403);

        $preOrder->update(['updated_by' => Auth::id()]);
        $preOrder->delete();

        ActivityLogService::log(
            'pre_orders',
            'delete',
            "Pre-order deleted for {$preOrder->customer_name_snapshot}",
            $preOrder
        );

        return redirect()->back()->with('success', 'Pre-order deleted successfully.');
    }

    // ─── Restore ──────────────────────────────────────────────────────────────

    public function restore(int $id)
    {
        abort_unless(Gate::allows('restore', PreOrder::class), 403);

        // onlyTrashed — never route model binding for restore (Rule 2)
        $preOrder = PreOrder::onlyTrashed()->findOrFail($id);
        $preOrder->restore();

        ActivityLogService::log(
            'pre_orders',
            'restore',
            "Pre-order restored for {$preOrder->customer_name_snapshot}",
            $preOrder
        );

        return redirect()->back()->with('success', 'Pre-order restored successfully.');
    }
}
