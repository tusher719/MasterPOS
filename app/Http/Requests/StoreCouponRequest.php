<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper(trim((string) $this->input('code'))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'code'                     => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'description'              => ['nullable', 'string', 'max:500'],
            'type'                     => ['required', 'in:percent,fixed'],
            'value'                    => ['required', 'numeric', 'min:0.01'],
            'min_order_amount'         => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount'      => ['nullable', 'numeric', 'min:0'],
            'usage_limit'              => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_customer' => ['nullable', 'integer', 'min:1'],
            'applicable_to'            => ['required', 'in:all,category,product'],
            'applicable_category_ids'  => ['nullable', 'array'],
            'applicable_product_ids'   => ['nullable', 'array'],
            'starts_at'                => ['nullable', 'date'],
            'expires_at'               => ['nullable', 'date', 'after_or_equal:starts_at'],
            'coupon_stackable'         => ['boolean'],
            'is_active'                => ['boolean'],
        ];
    }
}
