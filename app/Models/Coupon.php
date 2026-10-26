<?php

namespace App\Models;

use App\Traits\HasCustomUuid;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Coupon extends Model
{
    use HasFactory, SoftDeletes, HasCustomUuid;

    protected $fillable = [
        'uuid',
        'code',
        'description',
        'type',
        'value',
        'min_order_amount',
        'max_discount_amount',
        'usage_limit',
        'usage_limit_per_customer',
        'used_count',
        'applicable_to',
        'applicable_category_ids',
        'applicable_product_ids',
        'starts_at',
        'expires_at',
        'coupon_stackable',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'value'                    => 'decimal:2',
        'min_order_amount'         => 'decimal:2',
        'max_discount_amount'      => 'decimal:2',
        'usage_limit'              => 'integer',
        'usage_limit_per_customer' => 'integer',
        'used_count'               => 'integer',
        'applicable_category_ids'  => 'array',
        'applicable_product_ids'   => 'array',
        'starts_at'                => 'datetime',
        'expires_at'               => 'datetime',
        'coupon_stackable'         => 'boolean',
        'is_active'                => 'boolean',
    ];

    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope for active coupons within valid date range.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(function (Builder $q) {
                $q->whereNull('starts_at')
                  ->orWhere('starts_at', '<=', now());
            })
            ->where(function (Builder $q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', now());
            });
    }

    /**
     * Check if coupon is currently valid by time window and usage limits.
     */
    public function isValidNow(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = now();

        if ($this->starts_at && $now->lt($this->starts_at)) {
            return false;
        }

        if ($this->expires_at && $now->gt($this->expires_at)) {
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    /**
     * Calculate discount for a given subtotal.
     */
    public function calculateDiscount(float $subtotal): float
    {
        if ($this->min_order_amount !== null && $subtotal < (float) $this->min_order_amount) {
            return 0.0;
        }

        if ($this->type === 'percent') {
            $discount = ($subtotal * (float) $this->value) / 100.0;

            if ($this->max_discount_amount !== null && $discount > (float) $this->max_discount_amount) {
                $discount = (float) $this->max_discount_amount;
            }

            return round(min($discount, $subtotal), 2);
        }

        // Fixed discount
        return round(min((float) $this->value, $subtotal), 2);
    }
}
