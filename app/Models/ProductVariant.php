<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'sku',
        'attributes',
        'stock_qty',
        'price_override',
        'cost_price_override',
        'image_id',
        'is_active',
    ];

    protected $casts = [
        'attributes'          => 'array',
        'stock_qty'           => 'decimal:2',
        'price_override'      => 'decimal:2',
        'cost_price_override' => 'decimal:2',
        'is_active'           => 'boolean',
    ];

    // ─── Relations ───────────────────────────────────────────────

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function image(): BelongsTo
    {
        return $this->belongsTo(ProductImage::class, 'image_id');
    }

    // ─── Accessors ───────────────────────────────────────────────

    /**
     * Human-readable label built from attributes array.
     * e.g. {"color":"Red","size":"XL"} → "Red / XL"
     */
    public function getLabelAttribute(): string
    {
        $attrs = $this->getAttribute('attributes'); // cast array
        if (empty($attrs)) {
            return $this->sku;
        }
        return implode(' / ', array_values($attrs));
    }

    /**
     * Effective sale price — override if set, else product base price.
     */
    public function getEffectivePriceAttribute(): string
    {
        return $this->price_override ?? optional($this->product)->sale_price ?? '0.00';
    }

    /**
     * Effective cost price — override if set, else product base cost.
     */
    public function getEffectiveCostAttribute(): string
    {
        return $this->cost_price_override ?? optional($this->product)->cost_price ?? '0.00';
    }
}
