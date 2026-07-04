<?php

// app/Http/Requests/Backend/StorePurchasePaymentRequest.php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchasePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $purchase = $this->route('purchase');

        // Must have outstanding due amount
        if ($purchase->due_amount <= 0) {
            return false;
        }

        return $this->user()->hasPermissionTo('purchase.payment');
    }

    public function rules(): array
    {
        $purchase = $this->route('purchase');

        return [
            'payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],
            'amount'            => [
                'required',
                'numeric',
                'min:0.01',
                // Cannot pay more than what is due
                'max:' . $purchase->due_amount,
            ],
            'payment_date'      => ['required', 'date'],
            'reference'         => ['nullable', 'string', 'max:255'],
            'note'              => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        $purchase = $this->route('purchase');

        return [
            'amount.required' => 'Payment amount is required.',
            'amount.min'      => 'Payment amount must be greater than zero.',
            'amount.max'      => 'Payment amount cannot exceed the due amount of '
                                 . number_format($purchase->due_amount, 2) . '.',
            'payment_date.required'    => 'Payment date is required.',
            'payment_method_id.required' => 'Please select a payment method.',
            'payment_method_id.exists'   => 'Selected payment method does not exist.',
        ];
    }
}
