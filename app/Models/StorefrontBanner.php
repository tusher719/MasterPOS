<?php

namespace App\Models;

use App\Traits\HasCustomUuid;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StorefrontBanner extends Model
{
    use HasFactory, HasCustomUuid, SoftDeletes;

    protected $fillable = [
        'title',
        'subtitle',
        'badge_text',
        'image_path',
        'link_url',
        'button_text',
        'coupon_code',
        'placement',
        'bg_color',
        'sort_order',
        'is_active',
        'starts_at',
        'expires_at',
        'created_by',
    ];

    protected $casts = [
        'is_active'   => 'boolean',
        'sort_order'  => 'integer',
        'starts_at'   => 'datetime',
        'expires_at'  => 'datetime',
    ];

    // ── Scopes ─────────────────────────────────────────────────────────────

    /**
     * Scope for banners that are active and currently within valid dates.
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
     * Scope for a specific placement (e.g. hero_slider, promo_strip, popup_banner).
     */
    public function scopePlacement(Builder $query, string $placement): Builder
    {
        return $query->where('placement', $placement);
    }

    /**
     * Scope ordered by sort order ascending then latest ID descending.
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order', 'asc')->orderByDesc('id');
    }

    // ── Relations ──────────────────────────────────────────────────────────

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class, 'coupon_code', 'code');
    }
}
