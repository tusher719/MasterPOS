<?php

namespace App\Http\Requests\Backend;

use App\Models\ProfitDistributionItemPayment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled in controller
    }

    public function rules(): array
    {
        return [
            'action' => [
                'required',
                'string',
                Rule::in(['pay', 'defer', 'reinvest']),
            ],

            // Required only when action = pay
            'amount' => [
                Rule::requiredIf($this->input('action') === 'pay'),
                'nullable',
                'numeric',
                'min:0.01',
                'max:99999999.99',
            ],

            'payment_method' => [
                Rule::requiredIf($this->input('action') === 'pay'),
                'nullable',
                'string',
                'max:100',
            ],

            'transaction_reference' => [
                'nullable',
                'string',
                'max:255',
            ],

            'note' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'action.required' => 'Payment action is required.',
            'action.in'       => 'Action must be one of: pay, defer, reinvest.',
            'amount.required' => 'Amount is required when action is pay.',
            'amount.min'      => 'Amount must be at least 0.01.',
            'payment_method.required' => 'Payment method is required when action is pay.',
        ];
    }
}
