<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Supplier::class);
    }

    public function rules(): array
    {
        return [
            'name'            => ['required', 'string', 'max:100'],
            'company'         => ['nullable', 'string', 'max:150'],
            'email'           => ['nullable', 'email', 'max:150', 'unique:suppliers,email'],
            'phone'           => ['nullable', 'string', 'max:20'],
            'address'         => ['nullable', 'string'],
            'city'            => ['nullable', 'string', 'max:100'],
            'country'         => ['nullable', 'string', 'max:100'],
            'opening_balance' => ['nullable', 'numeric', 'min:0'],
            'is_active'       => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Supplier name is required.',
            'email.unique'  => 'This email is already registered.',
            'email.email'   => 'Please enter a valid email address.',
        ];
    }
}
