<?php
// app/Models/Product.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'sku',
        'barcode',
        'category_id',
        'unit_id',
        'cost_price',
        'sale_price',
        'is_taxable',
        'tax_id',
        'discount_type',
        'discount_value',
        'stock_qty',
        'low_stock_threshold',
        'min_sale_qty',
        'has_variants',
        'weight',
        'weight_unit',
        'is_featured',
        'sort_order',
        'meta_title',
        'meta_description',
        'description',
        'is_active',
    ];

    protected $casts = [
        'cost_price'          => 'decimal:2',
        'sale_price'          => 'decimal:2',
        'discount_value'      => 'decimal:2',
        'stock_qty'           => 'decimal:2',
        'low_stock_threshold' => 'decimal:2',
        'min_sale_qty'        => 'decimal:2',
        'weight'              => 'decimal:3',
        'is_taxable'          => 'boolean',
        'has_variants'        => 'boolean',
        'is_featured'         => 'boolean',
        'is_active'           => 'boolean',
        'sort_order'          => 'integer',
    ];

    // --- Relationships ---

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'product_id')
                    ->orderBy('sort_order');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class, 'product_id')
                    ->where('is_primary', true);
    }

    // --- Accessors ---

    /** True if stock is at or below low_stock_threshold */
    public function getIsLowStockAttribute(): bool
    {
        return $this->stock_qty <= $this->low_stock_threshold;
    }

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function scopeActive($query)
{
    return $query->where('is_active', true);
}
}
