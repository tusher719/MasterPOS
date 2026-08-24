<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductPlanningTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // controller handles authorization
    }

    public function rules(): array
    {
        return [
            'title'                     => ['required', 'string', 'max:255'],
            'note'                      => ['nullable', 'string', 'max:2000'],
            'due_date'                  => ['nullable', 'date'],
            'assigned_to'               => ['nullable', 'integer', 'exists:users,id'],

            // Items array — at least one item required
            'items'                     => ['required', 'array', 'min:1'],
            'items.*.product_id'        => ['required', 'integer', 'exists:products,id'],
            'items.*.variant_id'        => ['nullable', 'integer', 'exists:product_variants,id'],
            'items.*.quantity'          => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_cost'         => ['nullable', 'numeric', 'min:0'],
            'items.*.note'              => ['nullable', 'string', 'max:500'],
            'items.*.status'            => ['nullable', 'in:pending,ready,cancelled'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'                => 'Task title is required.',
            'items.required'                => 'At least one product item is required.',
            'items.min'                     => 'At least one product item is required.',
            'items.*.product_id.required'   => 'Product is required for each item.',
            'items.*.product_id.exists'     => 'Selected product does not exist.',
            'items.*.quantity.required'     => 'Quantity is required for each item.',
            'items.*.quantity.min'          => 'Quantity must be greater than zero.',
        ];
    }
}
