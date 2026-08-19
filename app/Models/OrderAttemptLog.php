<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * OrderAttemptLog
 *
 * Logs every checkout attempt (POS + storefront) for Layer 2 IP fraud detection.
 * One row per attempt — never updated, never soft-deleted.
 *
 * Layer 2 queries this table to count how many attempts a given IP
 * has made within the last 24 hours. If the count exceeds the configured
 * limit (fraud_ip_order_limit_per_24h), the order is auto-blocked.
 *
 * @property int         $id
 * @property string      $ip_address     IPv4 or IPv6 address of the requester
 * @property string|null $phone          Normalized BD phone (01XXXXXXXXX) — nullable
 * @property \Carbon\Carbon $attempted_at  When the attempt happened
 * @property bool        $was_blocked    True if this attempt was rejected by Layer 2
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class OrderAttemptLog extends Model
{
    protected $fillable = [
        'ip_address',
        'phone',
        'attempted_at',
        'was_blocked',
    ];

    protected $casts = [
        'attempted_at' => 'datetime',
        'was_blocked'  => 'boolean',
    ];

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /**
     * Attempts from a specific IP address within the last 24 hours.
     * This is the core query used by Layer2IpOrderLimitService::check().
     */
    public function scopeRecentByIp(\Illuminate\Database\Eloquent\Builder $query, string $ip): \Illuminate\Database\Eloquent\Builder
    {
        return $query
            ->where('ip_address', $ip)
            ->where('attempted_at', '>=', now()->subHours(24));
    }

    /**
     * Only rows where the attempt was blocked by Layer 2.
     */
    public function scopeBlocked(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('was_blocked', true);
    }
}
