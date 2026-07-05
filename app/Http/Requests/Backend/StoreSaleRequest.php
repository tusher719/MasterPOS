<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // ─── Sale Fields ──────────────────────────────────────
            'customer_id'       => ['nullable', 'integer', 'exists:customers,id'],
            'sale_date'         => ['required', 'date'],
            'payment_method_id' => ['nullable', 'integer', 'exists:payment_methods,id'],
            'discount'          => ['nullable', 'numeric', 'min:0'],
            'tax'               => ['nullable', 'numeric', 'min:0'],
            'paid_amount'       => ['required', 'numeric', 'min:0'],
            'note'              => ['nullable', 'string', 'max:1000'],

            // ─── Cart Items ───────────────────────────────────────
            'items'                  => ['required', 'array', 'min:1'],
            'items.*.product_id'     => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity'       => ['required', 'integer', 'min:1'],
            'items.*.unit_price'     => ['required', 'numeric', 'min:0'],
            'items.*.discount'       => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'              => 'Cart is empty. Add at least one product.',
            'items.min'                   => 'Cart is empty. Add at least one product.',
            'items.*.product_id.required' => 'Each item must have a product.',
            'items.*.product_id.exists'   => 'One or more products are invalid.',
            'items.*.quantity.required'   => 'Each item must have a quantity.',
            'items.*.quantity.min'        => 'Quantity must be at least 1.',
            'items.*.unit_price.required' => 'Each item must have a unit price.',
            'paid_amount.required'        => 'Paid amount is required.',
            'paid_amount.min'             => 'Paid amount cannot be negative.',
            'sale_date.required'          => 'Sale date is required.',
        ];
    }
}
