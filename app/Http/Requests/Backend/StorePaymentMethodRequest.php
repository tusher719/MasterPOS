<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('payment_method.create');
    }

    public function rules(): array
    {
        return [
            'name'       => 'required|string|max:100|unique:payment_methods,name',
            'type'       => 'required|in:cash,card,mobile_banking,other',
            'is_active'  => 'required|boolean',
            'sort_order' => 'required|integer|min:0|max:255',
        ];
    }
}
