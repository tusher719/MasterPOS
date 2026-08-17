<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreFraudFlagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled in controller via Gate::allows()
    }

    public function rules(): array
    {
        return [
            'customer_id'       => ['nullable', 'exists:customers,id'],
            'phone'             => ['required', 'string', 'max:20'],
            'email'             => ['nullable', 'email', 'max:255'],
            'full_name_snapshot'=> ['required', 'string', 'max:255'],
            'address_snapshot'  => ['nullable', 'string'],
            'reason'            => ['required', 'in:no_answer,refused_delivery,multiple_returns,fake_order,failed_validation,ip_limit_exceeded,low_success_ratio,other'],
            'reason_note'       => ['required', 'string', 'min:10', 'max:1000'],
            'related_sale_ids'  => ['nullable', 'array'],
            'related_sale_ids.*'=> ['integer', 'exists:sales,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required'             => 'Phone number is required.',
            'full_name_snapshot.required'=> 'Customer name is required.',
            'reason.required'            => 'Please select a reason.',
            'reason.in'                  => 'Invalid reason selected.',
            'reason_note.required'       => 'A detailed note is required.',
            'reason_note.min'            => 'Note must be at least 10 characters.',
        ];
    }
}
