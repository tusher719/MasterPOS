<?php

// app/Http/Requests/Backend/StorePurchaseRequest.php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('purchase.create');
    }

    public function rules(): array
    {
        return [
            // Header
            'supplier_id'      => ['required', 'integer', 'exists:suppliers,id'],
            'purchase_date'    => ['required', 'date'],
            'purchase_status'  => ['required', Rule::in(['draft', 'ordered', 'received', 'partial_received', 'cancelled'])],
            'note'             => ['nullable', 'string', 'max:1000'],

            // Financials
            'discount'         => ['nullable', 'numeric', 'min:0'],
            'tax'              => ['nullable', 'numeric', 'min:0'],
            'shipping_cost'    => ['nullable', 'numeric', 'min:0'],

            // Payment
            'paid_amount'        => ['nullable', 'numeric', 'min:0'],
            'payment_method_id'  => [
                'nullable',
                'integer',
                'exists:payment_methods,id',
                function ($attribute, $value, $fail) {
                    if ((float) $this->input('paid_amount', 0) > 0 && empty($value)) {
                        $fail('Payment method is required when a paid amount is entered.');
                    }
                },
            ],

            // Items — must have at least one
            'items'                  => ['required', 'array', 'min:1'],
            'items.*.product_id'     => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity'       => ['required', 'integer', 'min:1'],
            'items.*.unit_cost'      => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'supplier_id.required'         => 'Please select a supplier.',
            'supplier_id.exists'           => 'Selected supplier does not exist.',
            'purchase_date.required'       => 'Purchase date is required.',
            'purchase_status.required'     => 'Purchase status is required.',
            'purchase_status.in'           => 'Invalid purchase status selected.',
            'payment_method_id.exists'     => 'Selected payment method does not exist.',
            'items.required'               => 'At least one item is required.',
            'items.min'                    => 'At least one item is required.',
            'items.*.product_id.required'  => 'Product is required for each item.',
            'items.*.product_id.exists'    => 'Selected product does not exist.',
            'items.*.quantity.required'    => 'Quantity is required for each item.',
            'items.*.quantity.min'         => 'Quantity must be at least 1.',
            'items.*.unit_cost.required'   => 'Unit cost is required for each item.',
            'items.*.unit_cost.min'        => 'Unit cost cannot be negative.',
        ];
    }

    // Clean up nullables before validation
    protected function prepareForValidation(): void
    {
        $this->merge([
            'discount'          => $this->discount ?? 0,
            'tax'               => $this->tax ?? 0,
            'shipping_cost'     => $this->shipping_cost ?? 0,
            'paid_amount'       => $this->paid_amount ?? 0,
            'payment_method_id' => $this->payment_method_id ?: null,
        ]);
    }
}
