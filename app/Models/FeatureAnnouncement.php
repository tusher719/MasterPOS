<?php
// app/Models/FeatureAnnouncement.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class FeatureAnnouncement extends Model
{
    protected $fillable = [
        'label',
        'route_name',
        'badge_type',
        'badge_text',
        'show_until',
        'is_active',
    ];

    protected $casts = [
        'show_until' => 'date',
        'is_active'  => 'boolean',
    ];

    // ── Scopes ────────────────────────────────────────────────────────────────

    /**
     * Active announcements that have not expired yet.
     * Called from HandleInertiaRequests on every request.
     */
    public function scopeVisible($query)
    {
        return $query
            ->where('is_active', true)
            ->where('show_until', '>=', Carbon::today());
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    /**
     * The text to display inside the badge.
     * custom → badge_text, otherwise capitalize badge_type.
     */
    public function getBadgeLabelAttribute(): string
    {
        if ($this->badge_type === 'custom' && $this->badge_text) {
            return $this->badge_text;
        }

        return match ($this->badge_type) {
            'new'  => 'New',
            'hot'  => 'Hot',
            'beta' => 'Beta',
            default => ucfirst($this->badge_type),
        };
    }

    /**
     * Whether this announcement has expired (show_until < today).
     */
    public function getIsExpiredAttribute(): bool
    {
        return $this->show_until->lt(Carbon::today());
    }
}
