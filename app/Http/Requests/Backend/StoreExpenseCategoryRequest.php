<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('expense_category.create');
    }

    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:100|unique:expense_categories,name',
            'description' => 'nullable|string|max:500',
            'color'       => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active'   => 'required|boolean',
        ];
    }
}
