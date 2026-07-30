<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockReservation extends Model
{
    protected $fillable = [
        'product_id',
        'variant_id',
        'sale_id',
        'quantity',
        'reserved_until',
        'status',
    ];

    protected $casts = [
        'quantity'       => 'decimal:2',
        'reserved_until' => 'datetime',
    ];

    // ------------------------------------------------------------------ //
    // Relations
    // ------------------------------------------------------------------ //

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    // ------------------------------------------------------------------ //
    // Scopes
    // ------------------------------------------------------------------ //

    /**
     * Active reservations that have not yet expired.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                     ->where('reserved_until', '>', now());
    }

    /**
     * Active reservations that are past their reserved_until window.
     * Used by SweepExpiredReservations command.
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'active')
                     ->where('reserved_until', '<=', now());
    }

    // ------------------------------------------------------------------ //
    // Status helpers
    // ------------------------------------------------------------------ //

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->reserved_until->isFuture();
    }

    public function markConverted(int $saleId): void
    {
        $this->forceFill([
            'status'  => 'converted',
            'sale_id' => $saleId,
        ])->save();
    }

    public function markExpired(): void
    {
        $this->forceFill(['status' => 'expired'])->save();
    }

    public function markReleased(): void
    {
        $this->forceFill(['status' => 'released'])->save();
    }
}
