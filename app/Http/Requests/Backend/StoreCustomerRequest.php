<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => ['required', 'string', 'max:255'],
            'email'           => ['nullable', 'email', 'max:255', 'unique:customers,email'],
            'phone'           => ['nullable', 'string', 'max:50'],
            'address'         => ['nullable', 'string', 'max:500'],
            'city'            => ['nullable', 'string', 'max:100'],
            'country'         => ['required', 'string', 'max:100'],
            'opening_balance' => ['required', 'numeric', 'min:0'],
            'is_active'       => ['required', 'boolean'],
        ];
    }
}
