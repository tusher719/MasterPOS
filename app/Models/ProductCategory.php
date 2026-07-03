<?php
// app/Models/ProductCategory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ProductCategory extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'parent_id',
        'image',
        'description',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
    ];

    // --- Auto-generate slug before saving ---
    protected static function booted(): void
    {
        static::creating(function (ProductCategory $category) {
            $category->slug = Str::slug($category->name);
        });

        static::updating(function (ProductCategory $category) {
            if ($category->isDirty('name')) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    // --- Relationships ---

    /** Parent category (null if top-level) */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'parent_id');
    }

    /** Direct children (max depth: 2 levels) */
    public function children(): HasMany
    {
        return $this->hasMany(ProductCategory::class, 'parent_id');
    }

    /** Products belonging to this category */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'category_id');
    }
}
