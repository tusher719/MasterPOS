<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPortalController extends Controller
{
    /**
     * Get the authenticated customer.
     */
    protected function currentCustomer(): Customer
    {
        /** @var Customer */
        return Auth::guard('customer')->user();
    }

    /**
     * Customer orders list & account overview.
     */
    public function orders(Request $request): Response
    {
        $customer = $this->currentCustomer();
        $settings = SettingsService::all();

        // Query sales associated with customer ID or phone
        $salesQuery = Sale::where(function ($q) use ($customer) {
            $q->where('customer_id', $customer->id);
            if ($customer->phone) {
                $q->orWhere('delivery_contact_phone', $customer->phone);
            }
        })
        ->withCount('items')
        ->with(['salePayments.paymentMethod'])
        ->latest('id');

        $orders = $salesQuery->paginate(10)->through(fn (Sale $sale) => [
            'id'              => $sale->id,
            'uuid'            => $sale->uuid,
            'reference_no'    => $sale->reference_no,
            'sale_date'       => $sale->sale_date?->toDateString(),
            'items_count'     => $sale->items_count,
            'subtotal'        => (float) $sale->subtotal,
            'discount'        => (float) $sale->discount,
            'coupon_code'     => $sale->coupon_code,
            'coupon_discount' => (float) $sale->coupon_discount,
            'delivery_charge' => (float) $sale->delivery_charge,
            'grand_total'     => (float) $sale->grand_total,
            'payment_status'  => $sale->payment_status,
            'order_status'    => $sale->order_status,
            'delivery_status' => $sale->delivery_status,
            'courier_name'    => $sale->courier_name,
            'tracking_id'     => $sale->tracking_id,
            'created_at'      => $sale->created_at?->diffForHumans(),
        ]);

        $stats = [
            'total_orders' => Sale::where('customer_id', $customer->id)->count(),
            'total_spent'  => (float) Sale::where('customer_id', $customer->id)->where('payment_status', 'paid')->sum('grand_total'),
            'in_progress'  => Sale::where('customer_id', $customer->id)->whereIn('order_status', ['processing', 'confirmed', 'out_for_delivery'])->count(),
            'completed'    => Sale::where('customer_id', $customer->id)->where('order_status', 'delivered')->count(),
        ];

        return Inertia::render('Customer/Orders', [
            'customer' => [
                'id'    => $customer->id,
                'name'  => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
            ],
            'orders'   => $orders,
            'stats'    => $stats,
            'settings' => [
                'business_name'   => $settings['business_name'] ?? 'Master Business Suite',
                'currency_symbol' => $settings['currency_symbol'] ?? '৳',
            ],
        ]);
    }

    /**
     * View detailed order breakdown.
     */
    public function orderDetail(string $reference): Response|RedirectResponse
    {
        $customer = $this->currentCustomer();
        $settings = SettingsService::all();

        $sale = Sale::where(function ($q) use ($customer) {
            $q->where('customer_id', $customer->id);
            if ($customer->phone) {
                $q->orWhere('delivery_contact_phone', $customer->phone);
            }
        })
        ->where(fn ($q) => $q->where('reference_no', $reference)->orWhere('uuid', $reference))
        ->with([
            'items.product.primaryImage',
            'items.variant',
            'salePayments.paymentMethod',
            'coupon',
        ])
        ->firstOrFail();

        $itemsFormatted = $sale->items->map(fn ($item) => [
            'id'           => $item->id,
            'product_id'   => $item->product_id,
            'product_name' => $item->product?->name ?? 'Product item',
            'product_slug' => $item->product?->slug,
            'image'        => $item->product?->primaryImage?->image_path,
            'variant_id'   => $item->variant_id,
            'variant_name' => $item->variant?->name,
            'quantity'     => (int) $item->quantity,
            'unit_price'   => (float) $item->unit_price,
            'discount'     => (float) $item->discount,
            'subtotal'     => (float) $item->subtotal,
            'in_stock'     => $item->variant ? ($item->variant->stock_qty >= $item->quantity) : (($item->product?->stock_qty ?? 0) >= $item->quantity),
        ]);

        return Inertia::render('Customer/OrderDetail', [
            'sale' => [
                'id'                     => $sale->id,
                'uuid'                   => $sale->uuid,
                'reference_no'           => $sale->reference_no,
                'sale_date'              => $sale->sale_date?->toDateString(),
                'subtotal'               => (float) $sale->subtotal,
                'discount'               => (float) $sale->discount,
                'coupon_code'            => $sale->coupon_code,
                'coupon_discount'        => (float) $sale->coupon_discount,
                'delivery_charge'        => (float) $sale->delivery_charge,
                'grand_total'            => (float) $sale->grand_total,
                'paid_amount'            => (float) $sale->paid_amount,
                'due_amount'             => (float) $sale->due_amount,
                'payment_status'         => $sale->payment_status,
                'order_status'           => $sale->order_status,
                'delivery_type'          => $sale->delivery_type,
                'delivery_address'       => $sale->delivery_address,
                'delivery_contact_phone' => $sale->delivery_contact_phone,
                'delivery_status'        => $sale->delivery_status,
                'courier_name'           => $sale->courier_name,
                'tracking_id'            => $sale->tracking_id,
                'note'                   => $sale->note,
                'created_at'             => $sale->created_at?->toDayDateTimeString(),
            ],
            'items'    => $itemsFormatted,
            'payments' => $sale->salePayments->map(fn ($p) => [
                'id'           => $p->id,
                'amount'       => (float) $p->amount,
                'method'       => $p->paymentMethod?->name ?? 'Cash',
                'payment_date' => $p->payment_date?->toDateString(),
            ]),
            'settings' => [
                'business_name'   => $settings['business_name'] ?? 'Master Business Suite',
                'currency_symbol' => $settings['currency_symbol'] ?? '৳',
            ],
        ]);
    }

    /**
     * 1-Click Reorder: validate items & current stock and return cart payload.
     */
    public function reorder(string $reference): JsonResponse
    {
        $customer = $this->currentCustomer();

        $sale = Sale::where(function ($q) use ($customer) {
            $q->where('customer_id', $customer->id);
            if ($customer->phone) {
                $q->orWhere('delivery_contact_phone', $customer->phone);
            }
        })
        ->where(fn ($q) => $q->where('reference_no', $reference)->orWhere('uuid', $reference))
        ->with(['items.product.primaryImage', 'items.variant'])
        ->firstOrFail();

        $cartItems = [];
        $outOfStockItems = [];

        foreach ($sale->items as $item) {
            $product = $item->product;
            if (! $product || ! $product->is_active || $product->trashed()) {
                $outOfStockItems[] = $item->product?->name ?? 'Discontinued product';
                continue;
            }

            $availableStock = (int) $product->stock_qty;
            $unitPrice      = (float) $product->sale_price;
            $variantLabel   = null;

            if ($item->variant_id && $item->variant) {
                $variant = $item->variant;
                $availableStock = (int) $variant->stock_qty;
                if ($variant->price_override !== null) {
                    $unitPrice = (float) $variant->price_override;
                }
                $variantLabel = $variant->name;
            }

            if ($availableStock <= 0) {
                $outOfStockItems[] = "{$product->name}" . ($variantLabel ? " ({$variantLabel})" : "");
                continue;
            }

            $qtyToOrder = min((int) $item->quantity, $availableStock);

            $cartItems[] = [
                'id'           => $product->id,
                'variantId'    => $item->variant_id,
                'name'         => $product->name,
                'slug'         => $product->slug,
                'price'        => $unitPrice,
                'image'        => $product->primaryImage?->image_path,
                'qty'          => $qtyToOrder,
                'stock'        => $availableStock,
                'variantLabel' => $variantLabel,
            ];
        }

        return response()->json([
            'success'            => true,
            'items'              => $cartItems,
            'out_of_stock_items' => $outOfStockItems,
        ]);
    }

    /**
     * View customer profile.
     */
    public function profile(): Response
    {
        $customer = $this->currentCustomer();
        $settings = SettingsService::all();

        return Inertia::render('Customer/Profile', [
            'customer' => [
                'id'                    => $customer->id,
                'name'                  => $customer->name,
                'phone'                 => $customer->phone,
                'email'                 => $customer->email,
                'address'               => $customer->address,
                'city'                  => $customer->city,
                'default_delivery_type' => $customer->default_delivery_type ?? 'inside_dhaka',
            ],
            'settings' => [
                'business_name'   => $settings['business_name'] ?? 'Master Business Suite',
                'currency_symbol' => $settings['currency_symbol'] ?? '৳',
            ],
        ]);
    }

    /**
     * Update customer profile & password.
     */
    public function updateProfile(Request $request): RedirectResponse
    {
        $customer = $this->currentCustomer();

        $validated = $request->validate([
            'name'                  => ['required', 'string', 'max:150'],
            'email'                 => ['nullable', 'email', 'max:150'],
            'address'               => ['nullable', 'string', 'max:500'],
            'city'                  => ['nullable', 'string', 'max:100'],
            'default_delivery_type' => ['nullable', 'in:inside_dhaka,outside_dhaka,store_pickup'],
            'current_password'      => ['nullable', 'required_with:new_password', 'string'],
            'new_password'          => ['nullable', 'confirmed', Password::min(6)],
        ]);

        if (! empty($validated['new_password'])) {
            if (! Hash::check($validated['current_password'], $customer->password)) {
                return back()->withErrors([
                    'current_password' => 'The provided current password does not match.',
                ]);
            }
            $customer->password = Hash::make($validated['new_password']);
        }

        $customer->name = $validated['name'];
        $customer->email = $validated['email'] ?? $customer->email;
        $customer->address = $validated['address'] ?? $customer->address;
        $customer->city = $validated['city'] ?? $customer->city;
        $customer->default_delivery_type = $validated['default_delivery_type'] ?? 'inside_dhaka';
        $customer->save();

        return redirect()->route('customer.profile')
            ->with('success', 'Profile updated successfully.');
    }
}
