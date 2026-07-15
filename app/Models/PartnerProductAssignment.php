<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PartnerProductAssignment extends Model
{
    protected $fillable = [
        'partner_id',
        'assignable_type',
        'assignable_id',
        'effective_from',
        'effective_to',
        'cost_return_enabled',
        'profit_share_percent',
        'is_active',
        // approved_by, approved_at excluded — use forceFill()->save() in approve action
        'created_by',
    ];

    protected $casts = [
        'effective_from'       => 'date',
        'effective_to'         => 'date',
        'cost_return_enabled'  => 'boolean',
        'profit_share_percent' => 'decimal:4',
        'is_active'            => 'boolean',
        'approved_at'          => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class)->withTrashed();
    }

    public function assignable(): MorphTo
    {
        return $this->morphTo();
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'assignable_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by')->withTrashed();
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public function getIsPendingAttribute(): bool
    {
        return is_null($this->approved_by);
    }

    public function getIsApprovedAttribute(): bool
    {
        return ! is_null($this->approved_by);
    }

    public function getIsCurrentlyActiveAttribute(): bool
    {
        if (! $this->is_approved) {
            return false;
        }

        $today = now()->toDateString();

        if ($this->effective_from->toDateString() > $today) {
            return false;
        }

        if (! is_null($this->effective_to) && $this->effective_to->toDateString() < $today) {
            return false;
        }

        return true;
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeApproved($query)
    {
        return $query->whereNotNull('approved_by');
    }

    public function scopePending($query)
    {
        return $query->whereNull('approved_by');
    }

    public function scopeActive($query)
    {
        return $query->whereNotNull('approved_by')
            ->where('is_active', true)
            ->where('effective_from', '<=', now()->toDateString())
            ->where(function ($q) {
                $q->whereNull('effective_to')
                  ->orWhere('effective_to', '>=', now()->toDateString());
            });
    }

    /**
     * Scope for Phase 4F engine — assignments covering a specific sale date.
     * Called by ProfitCalculationEngine directly.
     */
    public function scopeCoveringSaleDate($query, string $saleDate)
    {
        return $query->whereNotNull('approved_by')
            ->where('is_active', true)
            ->where('effective_from', '<=', $saleDate)
            ->where(function ($q) use ($saleDate) {
                $q->whereNull('effective_to')
                  ->orWhere('effective_to', '>=', $saleDate);
            });
    }

    /**
     * Scope for Phase 4F engine — assignments covering an entire distribution period.
     */
    public function scopeCoveringPeriod($query, string $periodStart, string $periodEnd)
    {
        return $query->whereNotNull('approved_by')
            ->where('is_active', true)
            ->where('effective_from', '<=', $periodStart)
            ->where(function ($q) use ($periodEnd) {
                $q->whereNull('effective_to')
                  ->orWhere('effective_to', '>=', $periodEnd);
            });
    }

    // -------------------------------------------------------------------------
    // Business Methods
    // -------------------------------------------------------------------------

    /**
     * Approve this assignment. Called by PartnerProductAssignmentController::approve().
     */
    public function approve(int $userId): void
    {
        $this->forceFill([
            'approved_by' => $userId,
            'approved_at' => now(),
        ])->save();
    }
}
