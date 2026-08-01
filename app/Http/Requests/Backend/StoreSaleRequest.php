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

            // ─── Payment Type (Item 4.1) ──────────────────────────
            'payment_type'      => ['nullable', 'string', 'in:full_paid,half_paid,cash_on_delivery'],

            // ─── Delivery Fields (Item 4.2) ───────────────────────
            'delivery_type' => [
                'nullable',
                'string',
                'in:store_pickup,inside_dhaka,outside_dhaka,parallel',
            ],
            'delivery_charge' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'delivery_charge_free' => [
                'nullable',
                'boolean',
            ],
            'delivery_address' => [
                'nullable',
                'string',
                'max:1000',
                // required when delivery_type is not store_pickup
                'required_if:delivery_type,inside_dhaka',
                'required_if:delivery_type,outside_dhaka',
                'required_if:delivery_type,parallel',
            ],
            'delivery_contact_phone' => [
                'nullable',
                'string',
                'max:20',
            ],
            'delivery_status' => [
                'nullable',
                'string',
                'in:pending,dispatched,delivered,failed',
            ],

            // ─── Cart Items ───────────────────────────────────────
            'items'                  => ['required', 'array', 'min:1'],
            'items.*.product_id'     => ['required', 'integer', 'exists:products,id'],
            'items.*.variant_id'     => ['nullable', 'integer', 'exists:product_variants,id'],
            'items.*.quantity'       => ['required', 'integer', 'min:1'],
            'items.*.unit_price'     => ['required', 'numeric', 'min:0'],
            'items.*.discount'       => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            // Cart
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

            // Delivery
            'delivery_type.in'                   => 'Invalid delivery type selected.',
            'delivery_status.in'                 => 'Invalid delivery status.',
            'delivery_charge.min'                => 'Delivery charge cannot be negative.',
            'delivery_address.required_if'       => 'Delivery address is required for this delivery type.',
            'delivery_address.max'               => 'Delivery address must not exceed 1000 characters.',
            'delivery_contact_phone.max'         => 'Contact phone must not exceed 20 characters.',
            'payment_type.in'                    => 'Invalid payment type selected.',
        ];
    }
}
