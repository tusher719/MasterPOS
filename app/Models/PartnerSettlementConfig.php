<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class PartnerSettlementConfig extends Model
{
    protected $fillable = [
        'partner_id',
        'settlement_type',
        'payment_preference',
        'auto_cost_return',
        'notes',
        'is_active',
        'created_by',
        // approved_by, approved_at — excluded from $fillable (Rule 66)
        // use approve() method with forceFill()->save() instead
    ];

    protected $casts = [
        'auto_cost_return' => 'boolean',
        'is_active'        => 'boolean',
        'approved_at'      => 'datetime',
    ];

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeApproved($query)
    {
        return $query->whereNotNull('approved_by');
    }

    public function scopePending($query)
    {
        return $query->whereNull('approved_by');
    }

    // ─── Business Methods ─────────────────────────────────────────────────────

    /**
     * Approve this settlement config.
     * Uses forceFill()->save() — approved_by/approved_at are excluded from $fillable.
     */
    public function approve(): void
    {
        $this->forceFill([
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ])->save();
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public function getIsPendingAttribute(): bool
    {
        return is_null($this->approved_by);
    }

    public function getIsApprovedAttribute(): bool
    {
        return ! is_null($this->approved_by);
    }

    public function getSettlementTypeLabelAttribute(): string
    {
        return match ($this->settlement_type) {
            'profit_only'      => 'Profit Only',
            'cost_plus_profit' => 'Cost + Profit',
            'custom'           => 'Custom',
            default            => ucfirst($this->settlement_type),
        };
    }

    public function getPaymentPreferenceLabelAttribute(): string
    {
        return match ($this->payment_preference) {
            'cash'          => 'Cash',
            'bank_transfer' => 'Bank Transfer',
            'adjustment'    => 'Adjustment',
            'reinvestment'  => 'Reinvestment',
            default         => ucfirst($this->payment_preference),
        };
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class)->withTrashed();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by')->withTrashed();
    }
}
