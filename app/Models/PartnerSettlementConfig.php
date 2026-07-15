<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
    ];

    protected $casts = [
        'auto_cost_return' => 'boolean',
        'is_active'        => 'boolean',
    ];

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
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

    // ─── Accessors ────────────────────────────────────────────────────────────

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
            'cash'           => 'Cash',
            'bank_transfer'  => 'Bank Transfer',
            'adjustment'     => 'Adjustment',
            'reinvestment'   => 'Reinvestment',
            default          => ucfirst($this->payment_preference),
        };
    }
}
