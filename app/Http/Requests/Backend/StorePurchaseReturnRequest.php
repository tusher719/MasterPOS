<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled in controller via Gate
    }

    public function rules(): array
    {
        return [
            'purchase_id'  => ['required', 'integer', 'exists:purchases,id'],
            'return_date'  => ['required', 'date'],
            'return_type'  => ['required', 'in:supplier_return,damage_wastage'],
            'reason'       => ['required', 'string', 'min:5', 'max:1000'],
            'note'         => ['nullable', 'string', 'max:1000'],

            // At least one item required
            'items'                    => ['required', 'array', 'min:1'],
            'items.*.product_id'       => ['required', 'integer', 'exists:products,id'],
            'items.*.variant_id'       => ['nullable', 'integer', 'exists:product_variants,id'],
            'items.*.quantity'         => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_cost'        => ['required', 'numeric', 'min:0'],
            'items.*.reason_note'      => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'purchase_id.required'        => 'Please select a purchase.',
            'purchase_id.exists'          => 'The selected purchase does not exist.',
            'return_date.required'        => 'Return date is required.',
            'return_type.required'        => 'Please select a return type.',
            'return_type.in'              => 'Return type must be supplier return or damage/wastage.',
            'reason.required'             => 'Please provide a reason for this return.',
            'reason.min'                  => 'Reason must be at least 5 characters.',
            'items.required'              => 'At least one item is required.',
            'items.min'                   => 'At least one item is required.',
            'items.*.product_id.required' => 'Product is required for each item.',
            'items.*.product_id.exists'   => 'One or more selected products do not exist.',
            'items.*.quantity.required'   => 'Quantity is required for each item.',
            'items.*.quantity.min'        => 'Quantity must be greater than zero.',
            'items.*.unit_cost.required'  => 'Unit cost is required for each item.',
            'items.*.unit_cost.min'       => 'Unit cost cannot be negative.',
        ];
    }
}
