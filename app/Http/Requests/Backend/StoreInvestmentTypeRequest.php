<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvestmentTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('investment_type.create');
    }

    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:100|unique:investment_types,name',
            'description' => 'nullable|string|max:500',
            'is_active'   => 'required|boolean',
        ];
    }
}
