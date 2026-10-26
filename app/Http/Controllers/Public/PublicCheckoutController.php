<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleStatusHistory;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\CouponService;
use App\Services\SaleStockService;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PublicCheckoutController extends Controller
{
    public function __construct(
        private SaleStockService $stockService
    ) {}

    /**
     * Display checkout page
     */
    public function index(): Response
    {
        $settings = SettingsService::all();

        $paymentMethods = PaymentMethod::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'type']);

        $deliveryChargeInsideDhaka = (float) ($settings['delivery_charge_inside_dhaka'] ?? 60);
        $deliveryChargeOutsideDhaka = (float) ($settings['delivery_charge_outside_dhaka'] ?? 120);

        return Inertia::render('Public/Checkout', [
            'paymentMethods' => $paymentMethods,
            'deliveryCharges' => [
                'inside_dhaka'  => $deliveryChargeInsideDhaka,
                'outside_dhaka' => $deliveryChargeOutsideDhaka,
                'store_pickup'  => 0,
            ],
            'settings' => [
                'business_name'   => $settings['business_name'] ?? 'Master POS',
                'currency_symbol' => $settings['currency_symbol'] ?? '৳',
            ],
        ]);
    }

    /**
     * Place online guest order
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_name'     => ['required', 'string', 'max:150'],
            'customer_phone'    => ['required', 'string', 'max:30'],
            'customer_email'    => ['nullable', 'email', 'max:150'],
            'coupon_code'       => ['nullable', 'string', 'max:50'],
            'delivery_type'     => ['required', 'in:inside_dhaka,outside_dhaka,store_pickup'],
            'delivery_address'  => ['required_unless:delivery_type,store_pickup', 'nullable', 'string', 'max:500'],
            'payment_type'      => ['required', 'in:cash_on_delivery,full_paid'],
            'payment_method_id' => ['nullable', 'exists:payment_methods,id'],
            'note'              => ['nullable', 'string', 'max:500'],
            'items'             => ['required', 'array', 'min:1'],
            'items.*.id'        => ['required', 'integer', 'exists:products,id'],
            'items.*.qty'       => ['required', 'integer', 'min:1'],
            'items.*.variantId' => ['nullable', 'integer', 'exists:product_variants,id'],
        ]);

        $settings = SettingsService::all();
        $adminUser = User::role('Admin')->first() ?? User::first();
        $adminId = $adminUser?->id ?? 1;

        $sale = DB::transaction(function () use ($validated, $settings, $adminId) {
            $subtotal = 0;
            $itemsToCreate = [];

            // 1. Verify stocks and compute verified prices
            foreach ($validated['items'] as $cartItem) {
                $product = Product::lockForUpdate()->find($cartItem['id']);
                if (! $product) {
                    throw ValidationException::withMessages([
                        'items' => 'One or more items in your cart could not be found.',
                    ]);
                }

                $variant = null;
                $availableStock = (int) $product->stock_qty;
                $unitPrice = (float) $product->sale_price;

                if (! empty($cartItem['variantId'])) {
                    $variant = ProductVariant::lockForUpdate()->find($cartItem['variantId']);
                    if ($variant) {
                        $availableStock = (int) $variant->stock_qty;
                        if ($variant->price_override !== null) {
                            $unitPrice = (float) $variant->price_override;
                        }
                    }
                }

                if ($availableStock < $cartItem['qty']) {
                    throw ValidationException::withMessages([
                        'items' => "Insufficient stock for '{$product->name}'. Only {$availableStock} available.",
                    ]);
                }

                // Calculate product discount if applicable
                $discountAmount = 0.0;
                if ($product->discount_type === 'flat' && $product->discount_value !== null) {
                    $discountAmount = (float) $product->discount_value;
                } elseif ($product->discount_type === 'percentage' && $product->discount_value !== null) {
                    $discountAmount = ($unitPrice * (float) $product->discount_value) / 100;
                }

                $effectiveUnitPrice = max(0, $unitPrice - $discountAmount);
                $lineSubtotal = $effectiveUnitPrice * $cartItem['qty'];
                $subtotal += $lineSubtotal;

                $itemsToCreate[] = [
                    'product_id' => $product->id,
                    'variant_id' => $variant?->id,
                    'quantity'   => $cartItem['qty'],
                    'unit_price' => $effectiveUnitPrice,
                    'discount'   => $discountAmount * $cartItem['qty'],
                    'subtotal'   => $lineSubtotal,
                ];
            }

            // 2. Delivery charge
            $deliveryType = $validated['delivery_type'];
            $deliveryCharge = match ($deliveryType) {
                'inside_dhaka'  => (float) ($settings['delivery_charge_inside_dhaka'] ?? 60),
                'outside_dhaka' => (float) ($settings['delivery_charge_outside_dhaka'] ?? 120),
                default         => 0.0,
            };

            // 3. Find or create Customer record
            if (Auth::guard('customer')->check()) {
                /** @var Customer $customer */
                $customer = Auth::guard('customer')->user();
                if (empty($customer->address) && ! empty($validated['delivery_address'])) {
                    $customer->update(['address' => $validated['delivery_address']]);
                }
            } else {
                $customer = Customer::firstOrCreate(
                    ['phone' => $validated['customer_phone']],
                    [
                        'name'    => $validated['customer_name'],
                        'email'   => $validated['customer_email'] ?? null,
                        'address' => $validated['delivery_address'] ?? null,
                    ]
                );

                // Update customer name/address if previously blank
                if (empty($customer->name) || $customer->name === 'Walk-in Customer') {
                    $customer->update(['name' => $validated['customer_name']]);
                }
                if (! empty($validated['delivery_address']) && empty($customer->address)) {
                    $customer->update(['address' => $validated['delivery_address']]);
                }
            }

            // 4. Validate & calculate coupon discount
            $couponId       = null;
            $couponCode     = null;
            $couponDiscount = 0.0;
            $appliedCoupon  = null;

            if (! empty($validated['coupon_code'])) {
                $couponService = app(CouponService::class);
                $cartItemsFormatted = collect($itemsToCreate)->map(fn ($item) => [
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                ])->all();

                $validation = $couponService->validate(
                    $validated['coupon_code'],
                    $subtotal,
                    $customer->id,
                    $validated['customer_phone'],
                    $cartItemsFormatted
                );

                if (! $validation['valid']) {
                    throw ValidationException::withMessages([
                        'coupon_code' => $validation['message'],
                    ]);
                }

                $appliedCoupon  = Coupon::find($validation['coupon_id']);
                $couponId       = $appliedCoupon?->id;
                $couponCode     = $appliedCoupon?->code;
                $couponDiscount = (float) $validation['discount_amount'];
            }

            $grandTotal = max(0, $subtotal - $couponDiscount + $deliveryCharge);
            $isCOD = $validated['payment_type'] === 'cash_on_delivery';

            // 5. Create Sale
            $sale = Sale::create([
                'reference_no'           => Sale::generateReference(),
                'customer_id'            => $customer->id,
                'sale_date'              => today(),
                'subtotal'               => $subtotal,
                'discount'               => 0,
                'coupon_id'              => $couponId,
                'coupon_code'            => $couponCode,
                'coupon_discount'        => $couponDiscount,
                'tax'                    => 0,
                'grand_total'            => $grandTotal,
                'paid_amount'            => $isCOD ? 0 : $grandTotal,
                'due_amount'             => $isCOD ? $grandTotal : 0,
                'payment_status'         => $isCOD ? 'due' : 'paid',
                'payment_method_id'      => $isCOD ? null : ($validated['payment_method_id'] ?? null),
                'order_status'           => 'processing',
                'payment_type'           => $validated['payment_type'],
                'delivery_type'          => $deliveryType,
                'delivery_charge'        => $deliveryCharge,
                'delivery_charge_free'   => false,
                'delivery_address'       => $validated['delivery_address'] ?? null,
                'delivery_contact_phone' => $validated['customer_phone'],
                'delivery_status'        => 'pending',
                'note'                   => $validated['note'] ?? null,
                'created_by'             => $adminId,
            ]);

            if ($appliedCoupon && $couponDiscount > 0) {
                app(CouponService::class)->recordUsage(
                    $appliedCoupon,
                    $sale,
                    $couponDiscount,
                    $customer->id,
                    $validated['customer_phone']
                );
            }

            // 5. Create SaleItems
            foreach ($itemsToCreate as $itemData) {
                $itemData['sale_id'] = $sale->id;
                SaleItem::create($itemData);
            }

            // 6. Record status history
            SaleStatusHistory::create([
                'sale_id'    => $sale->id,
                'status'     => 'processing',
                'note'       => 'Order placed online by customer (' . $validated['customer_name'] . ').',
                'changed_by' => $adminId,
            ]);

            // 7. Apply stock deductions
            $sale->load('items');
            $this->stockService->applyStock($sale);

            // 8. Log activity
            ActivityLogService::log(
                'sales',
                'online_order',
                'Online order placed: ' . $sale->reference_no,
                $sale,
                [
                    'grand_total'   => $sale->grand_total,
                    'customer_name' => $customer->name,
                    'customer_phone'=> $customer->phone,
                    'delivery_type' => $sale->delivery_type,
                ]
            );

            return $sale;
        });

        return redirect()
            ->route('public.order-confirmed', ['reference' => $sale->reference_no])
            ->with('success', 'Order placed successfully! Reference: ' . $sale->reference_no);
    }

    /**
     * Display order confirmation page
     */
    public function confirmed(string $reference): Response
    {
        $sale = Sale::with(['items.product', 'items.variant', 'customer', 'paymentMethod'])
            ->where('reference_no', $reference)
            ->firstOrFail();

        $settings = SettingsService::all();

        return Inertia::render('Public/OrderConfirmed', [
            'sale' => [
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
                'note'                   => $sale->note,
                'customer'               => $sale->customer ? [
                    'name'  => $sale->customer->name,
                    'phone' => $sale->customer->phone,
                    'email' => $sale->customer->email,
                ] : null,
                'payment_method'         => $sale->paymentMethod?->name ?? 'Cash on Delivery',
                'items'                  => $sale->items->map(fn($item) => [
                    'id'            => $item->id,
                    'name'          => $item->product?->name ?? 'Product',
                    'quantity'      => (int) $item->quantity,
                    'unit_price'    => (float) $item->unit_price,
                    'subtotal'      => (float) $item->subtotal,
                    'variant_label' => $item->variant ? implode(' / ', $item->variant->attributes ?? []) : null,
                ]),
            ],
            'settings' => [
                'business_name'   => $settings['business_name'] ?? 'Master POS',
                'currency_symbol' => $settings['currency_symbol'] ?? '৳',
            ],
        ]);
    }

    /**
     * Live AJAX validation endpoint for storefront checkout promo codes.
     */
    public function validateCoupon(Request $request, CouponService $couponService): JsonResponse
    {
        $validated = $request->validate([
            'code'           => ['required', 'string'],
            'subtotal'       => ['required', 'numeric', 'min:0'],
            'customer_phone' => ['nullable', 'string'],
            'items'          => ['nullable', 'array'],
        ]);

        $result = $couponService->validate(
            $validated['code'],
            (float) $validated['subtotal'],
            null,
            $validated['customer_phone'] ?? null,
            $validated['items'] ?? []
        );

        return response()->json($result, $result['valid'] ? 200 : 422);
    }
}
