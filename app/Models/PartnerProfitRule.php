<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerProfitRule extends Model
{
    // No SoftDeletes — rules are versioned, never deleted
    // approved_by + approved_at excluded from $fillable — use forceFill()->save()

    protected $fillable = [
        'partner_id',
        'rule_type',
        'profit_source',
        'share_percent',
        'effective_from',
        'effective_to',
        'is_active',
        'reason',
        'created_by',
    ];

    protected $casts = [
        'share_percent' => 'decimal:4',
        'effective_from' => 'date',
        'effective_to'   => 'date',
        'is_active'      => 'boolean',
        'approved_at'    => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by')->withTrashed();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function history(): HasMany
    {
        return $this->hasMany(PartnerProfitRuleHistory::class, 'partner_profit_rule_id')
            ->orderBy('created_at', 'asc');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Only approved rules — pending rules are invisible to calculation engine.
     */
    public function scopeApproved($query)
    {
        return $query->whereNotNull('approved_by');
    }

    /**
     * Only pending rules — awaiting Super Admin approval.
     */
    public function scopePending($query)
    {
        return $query->whereNull('approved_by');
    }

    /**
     * Rules active at a given date — used by rule resolution engine.
     * effective_from <= $date AND (effective_to IS NULL OR effective_to >= $date)
     */
    public function scopeActiveAt($query, string $date)
    {
        return $query->whereNotNull('approved_by')
            ->where('effective_from', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_to')
                  ->orWhere('effective_to', '>=', $date);
            });
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
        return $this->is_approved && is_null($this->effective_to) && $this->is_active;
    }

    // -------------------------------------------------------------------------
    // Business Logic
    // -------------------------------------------------------------------------

    /**
     * Approve this rule.
     * Sets approved_by + approved_at via forceFill (excluded from $fillable).
     * Deactivates the previously active rule for this partner.
     * Writes history entries for both this rule and the superseded rule.
     * Must be called inside a DB::transaction().
     */
    public function approve(User $approver): void
    {
        // Deactivate previously active approved rule for this partner
        $previousRule = static::where('partner_id', $this->partner_id)
            ->whereNotNull('approved_by')
            ->whereNull('effective_to')
            ->where('is_active', true)
            ->where('id', '!=', $this->id)
            ->first();

        if ($previousRule) {
            $previousEffectiveTo = $this->effective_from->copy()->subDay()->toDateString();

            $previousRule->forceFill([
                'effective_to' => $previousEffectiveTo,
                'is_active'    => false,
            ])->save();

            // History: deactivated
            PartnerProfitRuleHistory::create([
                'partner_profit_rule_id' => $previousRule->id,
                'changed_by'             => $approver->id,
                'change_type'            => 'deactivated',
                'previous_value'         => [
                    'effective_to' => null,
                    'is_active'    => true,
                ],
                'new_value' => [
                    'effective_to' => $previousEffectiveTo,
                    'is_active'    => false,
                ],
                'change_reason' => 'Superseded by new profit rule (ID: ' . $this->id . ')',
            ]);
        }

        // Approve this rule
        $this->forceFill([
            'approved_by' => $approver->id,
            'approved_at' => now(),
        ])->save();

        // History: approved
        PartnerProfitRuleHistory::create([
            'partner_profit_rule_id' => $this->id,
            'changed_by'             => $approver->id,
            'change_type'            => 'approved',
            'previous_value'         => ['approved_by' => null, 'approved_at' => null],
            'new_value'              => [
                'approved_by' => $approver->id,
                'approved_at' => now()->toDateTimeString(),
            ],
            'change_reason' => 'Rule approved by ' . $approver->name,
        ]);
    }

    /**
     * Write a 'created' history entry for a newly created rule.
     * Called by controller after store().
     */
    public function recordCreatedHistory(User $createdByUser): void
    {
        PartnerProfitRuleHistory::create([
            'partner_profit_rule_id' => $this->id,
            'changed_by'             => $createdByUser->id,
            'change_type'            => 'created',
            'previous_value'         => null,
            'new_value'              => [
                'rule_type'      => $this->rule_type,
                'profit_source'  => $this->profit_source,
                'share_percent'  => $this->share_percent,
                'effective_from' => $this->effective_from->toDateString(),
                'effective_to'   => $this->effective_to?->toDateString(),
                'reason'         => $this->reason,
            ],
            'change_reason' => 'New profit rule created',
        ]);
    }

    /**
     * Write an 'updated' history entry for a pending rule edit.
     * Called by controller after update().
     */
    public function recordUpdatedHistory(User $updatedByUser, array $previousValues): void
    {
        PartnerProfitRuleHistory::create([
            'partner_profit_rule_id' => $this->id,
            'changed_by'             => $updatedByUser->id,
            'change_type'            => 'updated',
            'previous_value'         => $previousValues,
            'new_value'              => [
                'rule_type'      => $this->rule_type,
                'profit_source'  => $this->profit_source,
                'share_percent'  => $this->share_percent,
                'effective_from' => $this->effective_from->toDateString(),
                'effective_to'   => $this->effective_to?->toDateString(),
                'reason'         => $this->reason,
            ],
            'change_reason' => 'Pending rule updated before approval',
        ]);
    }
}
