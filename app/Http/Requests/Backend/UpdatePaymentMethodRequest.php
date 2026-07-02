<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('payment_method.edit');
    }

    public function rules(): array
    {
        $id = $this->route('paymentMethod')?->id;

        return [
            'name'       => "required|string|max:100|unique:payment_methods,name,{$id}",
            'type'       => 'required|in:cash,card,mobile_banking,other',
            'is_active'  => 'required|boolean',
            'sort_order' => 'required|integer|min:0|max:255',
        ];
    }
}
