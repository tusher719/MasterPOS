<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Services\SettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicOrderTrackingController extends Controller
{
    /**
     * Display order tracking search page
     */
    public function index(Request $request): Response
    {
        $settings = SettingsService::all();
        $query = trim($request->input('q', ''));
        $orders = collect();
        $searched = false;

        if ($query !== '') {
            $searched = true;

            $orders = Sale::with(['items.product', 'items.variant', 'customer', 'statusHistories'])
                ->where(function ($q) use ($query) {
                    $q->where('reference_no', $query)
                      ->orWhere('delivery_contact_phone', $query)
                      ->orWhereHas('customer', function ($cq) use ($query) {
                          $cq->where('phone', $query);
                      });
                })
                ->latest('id')
                ->take(5)
                ->get()
                ->map(fn($sale) => $this->transformSale($sale));
        }

        return Inertia::render('Public/TrackOrder', [
            'initialQuery' => $query,
            'searched'     => $searched,
            'orders'       => $orders,
            'settings'     => [
                'business_name'   => $settings['business_name'] ?? 'Master POS',
                'currency_symbol' => $settings['currency_symbol'] ?? '৳',
                'contact_phone'   => $settings['contact_phone'] ?? $settings['phone'] ?? null,
                'contact_email'   => $settings['contact_email'] ?? $settings['email'] ?? null,
            ],
        ]);
    }

    /**
     * Transform sale into public tracking format
     */
    private function transformSale(Sale $sale): array
    {
        // Compute timeline steps
        $statuses = ['processing', 'confirmed', 'out_for_delivery', 'delivered'];
        $currentStatus = $sale->order_status;
        $currentIndex = array_search($currentStatus, $statuses);
        if ($currentIndex === false) {
            $currentIndex = 0;
        }

        $timeline = [
            [
                'title'       => 'Order Placed',
                'description' => 'We received your order and are processing it.',
                'completed'   => true,
                'current'     => $currentStatus === 'processing',
                'date'        => $sale->created_at?->format('d M Y, h:i A'),
            ],
            [
                'title'       => 'Order Confirmed',
                'description' => 'Items packed and prepared for dispatch.',
                'completed'   => in_array($currentStatus, ['confirmed', 'out_for_delivery', 'delivered']),
                'current'     => $currentStatus === 'confirmed',
                'date'        => null,
            ],
            [
                'title'       => 'Out for Delivery',
                'description' => $sale->courier_provider
                    ? "Handed over to {$sale->courier_provider}" . ($sale->courier_tracking_id ? " (Tracking: {$sale->courier_tracking_id})" : "")
                    : 'Dispatched to delivery courier.',
                'completed'   => in_array($currentStatus, ['out_for_delivery', 'delivered']),
                'current'     => $currentStatus === 'out_for_delivery',
                'date'        => null,
            ],
            [
                'title'       => 'Delivered',
                'description' => 'Package delivered to recipient.',
                'completed'   => $currentStatus === 'delivered',
                'current'     => $currentStatus === 'delivered',
                'date'        => null,
            ],
        ];

        return [
            'id'                     => $sale->id,
            'reference_no'           => $sale->reference_no,
            'sale_date'              => $sale->sale_date?->format('d M Y'),
            'subtotal'               => (float) $sale->subtotal,
            'delivery_charge'        => (float) $sale->delivery_charge,
            'grand_total'            => (float) $sale->grand_total,
            'payment_status'         => $sale->payment_status,
            'order_status'           => $sale->order_status,
            'payment_type'           => $sale->payment_type,
            'delivery_type'          => $sale->delivery_type,
            'delivery_address'       => $sale->delivery_address,
            'delivery_contact_phone' => $sale->delivery_contact_phone,
            'courier_provider'       => $sale->courier_provider,
            'courier_tracking_id'    => $sale->courier_tracking_id,
            'courier_status'         => $sale->courier_status,
            'timeline'               => $timeline,
            'is_cancelled'           => $currentStatus === 'cancelled',
            'is_returned'            => $currentStatus === 'returned',
            'customer_name'          => $sale->customer?->name ?? 'Valued Customer',
            'items'                  => $sale->items->map(fn($item) => [
                'id'            => $item->id,
                'name'          => $item->product?->name ?? 'Product',
                'quantity'      => (int) $item->quantity,
                'unit_price'    => (float) $item->unit_price,
                'subtotal'      => (float) $item->subtotal,
                'variant_label' => $item->variant ? implode(' / ', $item->variant->attributes ?? []) : null,
            ]),
        ];
    }
}
