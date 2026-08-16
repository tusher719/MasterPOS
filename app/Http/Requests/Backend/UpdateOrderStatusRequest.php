<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_status' => [
                'required',
                'string',
                'in:processing,confirmed,out_for_delivery,delivered,cancelled,returned',
            ],
            'note' => [
                'required',
                'string',
                'min:3',
                'max:500',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'order_status.required' => 'Please select a status.',
            'order_status.in'       => 'Invalid order status selected.',
            'note.required'         => 'A reason is required when changing order status.',
            'note.min'              => 'Reason must be at least 3 characters.',
        ];
    }
}
