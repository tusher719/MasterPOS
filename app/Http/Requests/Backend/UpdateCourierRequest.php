<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCourierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $deliveryType = optional($this->route('sale'))->delivery_type;
        $requiresDelivery = in_array($deliveryType, [
            'inside_dhaka',
            'outside_dhaka',
            'parallel',
        ]);

        return [
            // Required when delivery type needs physical courier
            'courier_provider' => [
                $requiresDelivery ? 'required' : 'nullable',
                'string',
                'max:100',
            ],

            'courier_tracking_id' => [
                'nullable',
                'string',
                'max:100',
            ],

            'courier_status' => [
                $requiresDelivery ? 'required' : 'nullable',
                'string',
                'in:pending,picked_up,in_transit,delivered,returned,walk_in',
            ],

            'courier_note' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'courier_provider.required' => 'Courier provider is required for this delivery type.',
            'courier_provider.max'      => 'Courier provider name must not exceed 100 characters.',
            'courier_tracking_id.max'   => 'Tracking ID must not exceed 100 characters.',
            'courier_status.required'   => 'Courier status is required for this delivery type.',
            'courier_status.in'         => 'Invalid courier status selected.',
            'courier_note.max'          => 'Courier note must not exceed 500 characters.',
        ];
    }
}
