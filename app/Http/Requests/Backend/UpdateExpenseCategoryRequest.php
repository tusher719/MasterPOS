<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('expense_category.edit');
    }

    public function rules(): array
    {
        $id = $this->route('expenseCategory')?->id;

        return [
            'name'        => "required|string|max:100|unique:expense_categories,name,{$id}",
            'description' => 'nullable|string|max:500',
            'color'       => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active'   => 'required|boolean',
        ];
    }
}
