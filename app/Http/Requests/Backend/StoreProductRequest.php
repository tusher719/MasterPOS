<?php
// app/Http/Requests/Backend/StoreProductRequest.php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Product::class);
    }

    public function rules(): array
    {
        return [
            // Core identity
            'name'                => ['required', 'string', 'max:255'],
            'sku'                 => ['required', 'string', 'max:100', 'unique:products,sku'],
            'barcode'             => ['nullable', 'string', 'max:100', 'unique:products,barcode'],

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

            // Images
            'images'              => ['nullable', 'array', 'max:8'],
            'images.*'            => ['image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'primary_image_index' => ['nullable', 'integer', 'min:0'],

            // Variants
            'variants'            => ['nullable', 'string'], // JSON string

        ];
    }
}
