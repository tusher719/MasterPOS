<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\ProductVariant;
use App\Models\Product;

class ProductPlanningTaskItem extends Model
{
    protected $fillable = [
        'task_id',
        'product_id',
        'variant_id',
        'quantity',
        'unit_cost',
        'note',
        'status',
    ];

    protected $casts = [
        'quantity'  => 'decimal:2',
        'unit_cost' => 'decimal:2',
    ];

    // ─── Status helpers ───────────────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isReady(): bool
    {
        return $this->status === 'ready';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    // ─── Computed ─────────────────────────────────────────────────────────────

    /**
     * Subtotal for this item (quantity × unit_cost).
     * Returns null when unit_cost is not set.
     */
    public function getSubtotalAttribute(): ?float
    {
        if ($this->unit_cost === null) {
            return null;
        }

        return round((float) $this->quantity * (float) $this->unit_cost, 2);
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function task(): BelongsTo
    {
        return $this->belongsTo(ProductPlanningTask::class, 'task_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id')->withTrashed();
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id')->withTrashed();
    }
}
