<?php
// app/Models/Product.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

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
        // slug is intentionally excluded — auto-generated only, never mass-assigned
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

    // --- Boot ---

    protected static function boot(): void
    {
        parent::boot();

        // Generate slug once at creation — never on update
        static::creating(function (Product $product): void {
            $product->slug = static::generateUniqueSlug($product->name);
        });

        // Guard: prevent slug from being changed after creation
        static::updating(function (Product $product): void {
            if ($product->isDirty('slug')) {
                $product->slug = $product->getOriginal('slug');
            }
        });
    }

    /**
     * Generate a unique slug: Str::slug($name) + '-' + 6 random alphanumeric chars.
     * Example: "red-cotton-kurti-xl-4f9a2c"
     */
    private static function generateUniqueSlug(string $name): string
    {
        $base = Str::slug($name);

        do {
            $slug = $base . '-' . Str::lower(Str::random(6));
        } while (static::withTrashed()->where('slug', $slug)->exists());

        return $slug;
    }

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

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'product_id')
                    ->orderBy('id');
    }

    public function activeVariants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'product_id')
                    ->where('is_active', true)
                    ->orderBy('id');
    }

    public function purchaseItems(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    // --- Accessors ---

    /** True if stock is at or below low_stock_threshold */
    public function getIsLowStockAttribute(): bool
    {
        return $this->stock_qty <= $this->low_stock_threshold;
    }

    // --- Scopes ---

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
