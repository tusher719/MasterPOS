<?php
// app/Http/Requests/Backend/StoreProductCategoryRequest.php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\ProductCategory::class);
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'parent_id'   => ['nullable', 'exists:product_categories,id'],
            'image'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'description' => ['nullable', 'string', 'max:1000'],
            'sort_order'  => ['nullable', 'integer', 'min:0', 'max:127'],
            'is_active'   => ['boolean'],
        ];
    }
}
