<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreHoldOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id'            => ['nullable', 'integer', 'exists:customers,id'],
            'note'                   => ['nullable', 'string', 'max:1000'],
            'expires_at'             => ['nullable', 'date', 'after:now'],
            'subtotal'               => ['required', 'numeric', 'min:0'],
            'discount'               => ['required', 'numeric', 'min:0'],
            'tax'                    => ['required', 'numeric', 'min:0'],
            'grand_total'            => ['required', 'numeric', 'min:0'],
            'items'                  => ['required', 'array', 'min:1'],
            'items.*.product_id'     => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity'       => ['required', 'integer', 'min:1'],
            'items.*.unit_price'     => ['required', 'numeric', 'min:0'],
            'items.*.discount'       => ['required', 'numeric', 'min:0'],
            'items.*.subtotal'       => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'             => 'At least one item is required to hold an order.',
            'items.min'                  => 'At least one item is required to hold an order.',
            'items.*.product_id.exists'  => 'One or more selected products are invalid.',
            'items.*.quantity.min'       => 'Item quantity must be at least 1.',
            'items.*.unit_price.min'     => 'Item price cannot be negative.',
            'items.*.discount.min'       => 'Item discount cannot be negative.',
            'expires_at.after'           => 'Expiry time must be in the future.',
        ];
    }
}
