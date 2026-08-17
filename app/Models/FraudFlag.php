<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FraudFlag extends Model
{
    protected $fillable = [
        'customer_id',
        'phone',
        'email',
        'full_name_snapshot',
        'address_snapshot',
        'reason',
        'reason_note',
        'trigger_type',
        'related_sale_ids',
        'flagged_by',
        'flagged_at',
        // status, reviewed_by, reviewed_at, review_note excluded from fillable
        // — set only via review() model method (Rule 66 pattern)
        // external_fraud_check_response excluded — Phase 2 only
    ];

    protected $casts = [
        'related_sale_ids'              => 'array',
        'external_fraud_check_response' => 'array',
        'flagged_at'                    => 'datetime',
        'reviewed_at'                   => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)->withTrashed();
    }

    public function flaggedBy(): BelongsTo
    {
        // null = system-triggered (auto_layer2 / auto_layer3)
        return $this->belongsTo(User::class, 'flagged_by')->withTrashed();
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by')->withTrashed();
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public function getIsPendingAttribute(): bool
    {
        return $this->status === 'pending_review';
    }

    public function getIsConfirmedAttribute(): bool
    {
        return $this->status === 'confirmed_fraud';
    }

    public function getIsClearedAttribute(): bool
    {
        return $this->status === 'cleared';
    }

    // -------------------------------------------------------------------------
    // Business methods — use forceFill()->save() to bypass mass-assignment guard
    // -------------------------------------------------------------------------

    public function confirmFraud(int $reviewerId, string $note): void
    {
        $this->forceFill([
            'status'      => 'confirmed_fraud',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'review_note' => $note,
        ])->save();
    }

    public function clearFlag(int $reviewerId, string $note): void
    {
        $this->forceFill([
            'status'      => 'cleared',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'review_note' => $note,
        ])->save();
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopePendingReview($query)
    {
        return $query->where('status', 'pending_review');
    }

    public function scopeConfirmedFraud($query)
    {
        return $query->where('status', 'confirmed_fraud');
    }

    public function scopeCleared($query)
    {
        return $query->where('status', 'cleared');
    }

    public function scopeByPhone($query, string $phone)
    {
        return $query->where('phone', $phone);
    }

    public function scopeByTriggerType($query, string $type)
    {
        return $query->where('trigger_type', $type);
    }
}
