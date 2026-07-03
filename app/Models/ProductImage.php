<?php
// app/Models/ProductImage.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class ProductImage extends Model
{
    protected $fillable = [
        'product_id',
        'image_path',
        'is_primary',
        'sort_order',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['image_url'];

    // --- Relationships ---

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // --- Accessors ---

    /** Full public URL for the image */
    public function getImageUrlAttribute(): string
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk->url($this->image_path);
    }
}
