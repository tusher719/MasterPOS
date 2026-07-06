<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreHoldOrderRequest;
use App\Http\Requests\Backend\UpdateHoldOrderRequest;
use App\Models\HoldOrder;
use App\Services\ActivityLogService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class HoldOrderController extends Controller
{
    use AuthorizesRequests;
    // ─── Index (drawer list with search + pagination) ─────────────

    public function index(Request $request): JsonResponse
    {
        $this->authorize('view', HoldOrder::class);

        $query = HoldOrder::with(['customer', 'items.product.images', 'items.product.unit'])
            ->where('created_by', Auth::id())
            ->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn($c) =>
                      $c->where('name', 'like', "%{$search}%")
                  );
            });
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $holdOrders = $query->paginate(10)->through(function ($order) {
            return [
                'id'           => $order->id,
                'reference_no' => $order->reference_no,
                'status'       => $order->status,
                'customer'     => $order->customer
                    ? ['id' => $order->customer->id, 'name' => $order->customer->name]
                    : null,
                'subtotal'     => $order->subtotal,
                'discount'     => $order->discount,
                'tax'          => $order->tax,
                'grand_total'  => $order->grand_total,
                'expires_at'   => $order->expires_at?->toDateTimeString(),
                'note'         => $order->note,
                'created_at'   => $order->created_at->toDateTimeString(),
                'items'        => $order->items->map(fn($item) => [
                    'id'         => $item->id,
                    'product_id' => $item->product_id,
                    'name'       => $item->product?->name ?? 'Deleted Product',
                    'sku'        => $item->product?->sku ?? '-',
                    'quantity'   => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'discount'   => $item->discount,
                    'subtotal'   => $item->subtotal,
                    'stock_qty'  => $item->product?->stock_qty ?? 0,
                    'unit'       => $item->product?->unit?->name ?? null,
                    'image'      => $item->product?->images->first()?->image_path ?? null,
                ]),
            ];
        });

        return response()->json($holdOrders);
    }

    // ─── Store (save cart as hold order) ──────────────────────────

    public function store(StoreHoldOrderRequest $request): JsonResponse
    {
        $this->authorize('create', HoldOrder::class);

        DB::beginTransaction();
        try {
            $holdOrder = HoldOrder::create([
                'reference_no' => HoldOrder::generateReference(),
                'customer_id'  => $request->customer_id,
                'note'         => $request->note,
                'status'       => 'active',
                'subtotal'     => $request->subtotal,
                'discount'     => $request->discount,
                'tax'          => $request->tax,
                'grand_total'  => $request->grand_total,
                'expires_at'   => $request->expires_at,
                'created_by'   => Auth::id(),
            ]);

            foreach ($request->items as $item) {
                $holdOrder->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount'   => $item['discount'],
                    'subtotal'   => $item['subtotal'],
                ]);
            }

            ActivityLogService::log(
                'hold_order',
                'create',
                "Hold order {$holdOrder->reference_no} created",
                $holdOrder,
                ['items_count' => count($request->items)]
            );

            DB::commit();

            return response()->json([
                'success'      => true,
                'message'      => "Order {$holdOrder->reference_no} held successfully.",
                'hold_order'   => [
                    'id'           => $holdOrder->id,
                    'reference_no' => $holdOrder->reference_no,
                ],
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to hold order. Please try again.',
            ], 500);
        }
    }

    // ─── Update (edit hold order — active only) ───────────────────

    public function update(UpdateHoldOrderRequest $request, int $id): JsonResponse
    {
        $holdOrder = HoldOrder::findOrFail($id);

        // NOTE: HoldOrderPolicy defines edit(), not update() — the ability
        // name passed here must match the policy method name exactly, or
        // Laravel silently denies (403) even with the correct permission.
        $this->authorize('edit', $holdOrder);

        if ($holdOrder->isProcessing()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit an order that is currently being processed.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $holdOrder->update([
                'customer_id' => $request->customer_id,
                'note'        => $request->note,
                'expires_at'  => $request->expires_at,
                'subtotal'    => $request->subtotal,
                'discount'    => $request->discount,
                'tax'         => $request->tax,
                'grand_total' => $request->grand_total,
            ]);

            // Replace all items
            $holdOrder->items()->delete();
            foreach ($request->items as $item) {
                $holdOrder->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount'   => $item['discount'],
                    'subtotal'   => $item['subtotal'],
                ]);
            }

            ActivityLogService::log(
                'hold_order',
                'update',
                "Hold order {$holdOrder->reference_no} updated",
                $holdOrder,
                ['items_count' => count($request->items)]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Hold order {$holdOrder->reference_no} updated successfully.",
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update hold order. Please try again.',
            ], 500);
        }
    }

    // ─── Resume (mark as processing, return items for cart) ───────

    public function resume(int $id): JsonResponse
    {
        $this->authorize('view', HoldOrder::class);

        $holdOrder = HoldOrder::with(['customer', 'items.product.images', 'items.product.unit'])->findOrFail($id);

        if ($holdOrder->isProcessing()) {
            return response()->json([
                'success' => false,
                'message' => 'This order is already being processed.',
            ], 422);
        }

        $holdOrder->markAsProcessing();

        ActivityLogService::log(
            'hold_order',
            'resume',
            "Hold order {$holdOrder->reference_no} resumed for checkout",
            $holdOrder
        );

        return response()->json([
            'success'    => true,
            'message'    => "Hold order {$holdOrder->reference_no} resumed.",
            'hold_order' => [
                'id'           => $holdOrder->id,
                'reference_no' => $holdOrder->reference_no,
                'customer'     => $holdOrder->customer
                    ? ['id' => $holdOrder->customer->id, 'name' => $holdOrder->customer->name]
                    : null,
                'subtotal'     => $holdOrder->subtotal,
                'discount'     => $holdOrder->discount,
                'tax'          => $holdOrder->tax,
                'grand_total'  => $holdOrder->grand_total,
                'note'         => $holdOrder->note,
                'items'        => $holdOrder->items->map(fn($item) => [
                    'product_id' => $item->product_id,
                    'name'       => $item->product?->name ?? 'Deleted Product',
                    'sku'        => $item->product?->sku ?? '-',
                    'quantity'   => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'discount'   => $item->discount,
                    'subtotal'   => $item->subtotal,
                    'stock_qty'  => $item->product?->stock_qty ?? 0,
                    'unit'       => $item->product?->unit?->name ?? null,
                    'image'      => $item->product?->images->first()?->image_path ?? null,
                ]),
            ],
        ]);
    }

    // ─── Release (revert processing → active on cancel/fail) ──────

    public function release(int $id): JsonResponse
    {
        $this->authorize('view', HoldOrder::class);

        $holdOrder = HoldOrder::findOrFail($id);

        if ($holdOrder->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Order is already active.',
            ], 422);
        }

        $holdOrder->markAsActive();

        return response()->json([
            'success' => true,
            'message' => "Hold order {$holdOrder->reference_no} released back to active.",
        ]);
    }

    // ─── Destroy (hard delete) ────────────────────────────────────

    public function destroy(int $id): JsonResponse
    {
        $holdOrder = HoldOrder::findOrFail($id);
        $this->authorize('delete', $holdOrder);

        $reference = $holdOrder->reference_no;

        ActivityLogService::log(
            'hold_order',
            'delete',
            "Hold order {$reference} deleted",
            $holdOrder
        );

        $holdOrder->delete();

        return response()->json([
            'success' => true,
            'message' => "Hold order {$reference} deleted.",
        ]);
    }
}
