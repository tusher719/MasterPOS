<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Sale;
use Illuminate\Support\Str;

class CouponService
{
    /**
     * Validate coupon eligibility and compute the applicable discount.
     *
     * @param string $code
     * @param float $subtotal
     * @param int|null $customerId
     * @param string|null $customerPhone
     * @param array $cartItems
     * @return array
     */
    public function validate(
        string $code,
        float $subtotal,
        ?int $customerId = null,
        ?string $customerPhone = null,
        array $cartItems = []
    ): array {
        $cleanCode = strtoupper(trim($code));

        if (empty($cleanCode)) {
            return [
                'valid'   => false,
                'message' => 'Please provide a coupon code.',
            ];
        }

        $coupon = Coupon::where('code', $cleanCode)->first();

        if (! $coupon) {
            return [
                'valid'   => false,
                'message' => 'Coupon code "' . $cleanCode . '" is invalid or does not exist.',
            ];
        }

        if (! $coupon->is_active) {
            return [
                'valid'   => false,
                'message' => 'Coupon "' . $cleanCode . '" is currently inactive.',
            ];
        }

        $now = now();

        if ($coupon->starts_at && $now->lt($coupon->starts_at)) {
            return [
                'valid'   => false,
                'message' => 'Coupon "' . $cleanCode . '" will become active on ' . $coupon->starts_at->format('d M, Y H:i') . '.',
            ];
        }

        if ($coupon->expires_at && $now->gt($coupon->expires_at)) {
            return [
                'valid'   => false,
                'message' => 'Coupon "' . $cleanCode . '" expired on ' . $coupon->expires_at->format('d M, Y H:i') . '.',
            ];
        }

        // Global usage limit check
        if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
            return [
                'valid'   => false,
                'message' => 'This coupon has reached its maximum overall redemption limit.',
            ];
        }

        // Per-customer usage limit check
        if ($coupon->usage_limit_per_customer !== null) {
            $customerUsagesCount = CouponUsage::where('coupon_id', $coupon->id)
                ->where(function ($query) use ($customerId, $customerPhone) {
                    if ($customerId) {
                        $query->where('customer_id', $customerId);
                    }
                    if ($customerPhone) {
                        $query->orWhere('customer_phone', $customerPhone);
                    }
                })
                ->count();

            if ($customerUsagesCount >= $coupon->usage_limit_per_customer) {
                return [
                    'valid'   => false,
                    'message' => 'You have already reached the redemption limit (' . $coupon->usage_limit_per_customer . ' time' . ($coupon->usage_limit_per_customer > 1 ? 's' : '') . ') for this coupon.',
                ];
            }
        }

        // Minimum order amount requirement
        if ($coupon->min_order_amount !== null && $subtotal < (float) $coupon->min_order_amount) {
            return [
                'valid'   => false,
                'message' => 'Minimum order subtotal of ৳' . number_format($coupon->min_order_amount, 2) . ' is required to use this coupon.',
            ];
        }

        // Product / Category scoping check (if cartItems are supplied)
        if (! empty($cartItems)) {
            if ($coupon->applicable_to === 'product' && ! empty($coupon->applicable_product_ids)) {
                $productIdsInCart = collect($cartItems)->pluck('product_id')->filter()->all();
                $hasMatchingProduct = count(array_intersect($productIdsInCart, (array) $coupon->applicable_product_ids)) > 0;

                if (! $hasMatchingProduct) {
                    return [
                        'valid'   => false,
                        'message' => 'This coupon is only applicable to selected products.',
                    ];
                }
            } elseif ($coupon->applicable_to === 'category' && ! empty($coupon->applicable_category_ids)) {
                $categoryIdsInCart = collect($cartItems)->pluck('category_id')->filter()->all();
                $hasMatchingCategory = count(array_intersect($categoryIdsInCart, (array) $coupon->applicable_category_ids)) > 0;

                if (! $hasMatchingCategory) {
                    return [
                        'valid'   => false,
                        'message' => 'This coupon is only applicable to selected product categories.',
                    ];
                }
            }
        }

        $discountAmount = $coupon->calculateDiscount($subtotal);

        return [
            'valid'               => true,
            'coupon_id'           => $coupon->id,
            'coupon_code'         => $coupon->code,
            'type'                => $coupon->type,
            'value'               => (float) $coupon->value,
            'discount_amount'     => $discountAmount,
            'min_order_amount'    => $coupon->min_order_amount ? (float) $coupon->min_order_amount : null,
            'max_discount_amount' => $coupon->max_discount_amount ? (float) $coupon->max_discount_amount : null,
            'message'             => 'Coupon "' . $coupon->code . '" applied successfully!',
        ];
    }

    /**
     * Record usage after order completion inside DB transaction.
     */
    public function recordUsage(
        Coupon $coupon,
        Sale $sale,
        float $discountAmount,
        ?int $customerId = null,
        ?string $customerPhone = null
    ): CouponUsage {
        $usage = CouponUsage::create([
            'coupon_id'       => $coupon->id,
            'customer_id'     => $customerId,
            'sale_id'         => $sale->id,
            'customer_phone'  => $customerPhone,
            'discount_amount' => $discountAmount,
        ]);

        $coupon->increment('used_count');

        return $usage;
    }
}
