<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdditionalPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'                  => ['required', 'numeric', 'min:0.01'],
            'payment_method_id'       => ['required', 'exists:payment_methods,id'],
            'payment_method_bank_id'  => ['nullable', 'exists:payment_method_banks,id'],
            'payment_charge'          => ['nullable', 'numeric', 'min:0'],
            'transaction_id'          => ['nullable', 'string', 'max:100'],
            'payment_reference'       => ['nullable', 'string', 'max:100'],
            'payment_date'            => ['required', 'date'],
            'note'                    => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required'            => 'Payment amount is required.',
            'amount.min'                 => 'Payment amount must be greater than zero.',
            'payment_method_id.required' => 'Please select a payment method.',
            'payment_method_id.exists'   => 'Selected payment method is invalid.',
            'payment_date.required'      => 'Payment date is required.',
        ];
    }
}
