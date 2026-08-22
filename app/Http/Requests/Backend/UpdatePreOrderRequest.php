<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // authorization handled in controller via Gate
    }

    public function rules(): array
    {
        return [
            'customer_id'             => ['nullable', 'exists:customers,id'],
            'customer_name_snapshot'  => ['required', 'string', 'max:255'],
            'customer_phone_snapshot' => ['nullable', 'string', 'max:20'],
            'product_id'              => ['nullable', 'exists:products,id'],
            'product_name_snapshot'   => ['nullable', 'string', 'max:255'],
            'booking_date'            => ['required', 'date'],
            'expected_delivery_date'  => ['nullable', 'date', 'after_or_equal:booking_date'],
            'total_amount'            => ['required', 'numeric', 'min:0'],
            'advance_amount'          => ['required', 'numeric', 'min:0'],
            'advance_payment_method'  => ['nullable', 'string', 'max:100'],
            'advance_transaction_id'  => ['nullable', 'string', 'max:100'],
            'advance_payment_proof'   => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'note'                    => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_name_snapshot.required'        => 'Customer name is required.',
            'booking_date.required'                  => 'Booking date is required.',
            'total_amount.required'                  => 'Total amount is required.',
            'total_amount.min'                       => 'Total amount cannot be negative.',
            'advance_amount.required'                => 'Advance amount is required.',
            'advance_amount.min'                     => 'Advance amount cannot be negative.',
            'expected_delivery_date.after_or_equal'  => 'Expected delivery date must be on or after booking date.',
            'advance_payment_proof.mimes'            => 'Payment proof must be jpg, jpeg, png, or pdf.',
            'advance_payment_proof.max'              => 'Payment proof file size cannot exceed 5MB.',
        ];
    }

    /**
     * Advance amount cannot exceed total amount.
     * Also block updates if pre-order is already terminal (delivered/cancelled).
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Amount cross-check
            $total   = (float) $this->input('total_amount', 0);
            $advance = (float) $this->input('advance_amount', 0);

            if ($advance > $total) {
                $validator->errors()->add(
                    'advance_amount',
                    'Advance amount cannot exceed total amount.'
                );
            }

            // Block edit if terminal
            $preOrder = $this->route('preOrder');
            if ($preOrder && $preOrder->isTerminal()) {
                $validator->errors()->add(
                    'status',
                    'Cannot edit a pre-order that is already delivered or cancelled.'
                );
            }
        });
    }
}
