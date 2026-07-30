<?php
// app/Http/Requests/Backend/UpdateProductRequest.php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            // Core identity
            'name'                => ['required', 'string', 'max:255'],
            'sku'                 => [
                'required', 'string', 'max:100',
                Rule::unique('products', 'sku')->ignore($productId),
            ],
            'barcode'             => [
                'nullable', 'string', 'max:100',
                Rule::unique('products', 'barcode')->ignore($productId),
            ],

            // Relations
            'category_id'         => ['nullable', 'exists:product_categories,id'],
            'unit_id'             => ['nullable', 'exists:units,id'],

            // Pricing
            'cost_price'          => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'sale_price'          => ['required', 'numeric', 'min:0', 'max:99999999.99'],

            // Tax
            'is_taxable'          => ['boolean'],
            'tax_id'              => ['nullable', 'string', 'max:100'],

            // Discount
            'discount_type'       => ['nullable', 'in:flat,percentage'],
            'discount_value'      => ['nullable', 'numeric', 'min:0'],

            // Stock
            'stock_qty'           => ['required', 'numeric', 'min:0'],
            'low_stock_threshold' => ['required', 'numeric', 'min:0'],
            'min_sale_qty'        => ['nullable', 'numeric', 'min:0'],

            // Variants & Shipping
            'has_variants'        => ['boolean'],
            'weight'              => ['nullable', 'numeric', 'min:0'],
            'weight_unit'         => ['nullable', 'string', 'in:kg,g,lb'],

            // POS UI
            'is_featured'         => ['boolean'],
            'sort_order'          => ['nullable', 'integer', 'min:0', 'max:127'],

            // SEO
            'meta_title'          => ['nullable', 'string', 'max:255'],
            'meta_description'    => ['nullable', 'string', 'max:500'],

            // Description & status
            'description'         => ['nullable', 'string'],
            'is_active'           => ['boolean'],

            // New images to upload
            'images'              => ['nullable', 'array', 'max:8'],
            'images.*'            => ['image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],

            // Existing image management
            'deleted_image_ids'   => ['nullable', 'array'],
            'deleted_image_ids.*' => ['integer', 'exists:product_images,id'],
            'primary_image_id'    => ['nullable', 'integer', 'exists:product_images,id'],
            'primary_image_index' => ['nullable', 'integer', 'min:0'],

            // Variants
            'variants'            => ['nullable', 'string'], // JSON string
        ];
    }
}
