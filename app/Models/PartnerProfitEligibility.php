<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class PartnerProfitEligibility extends Model
{
    protected $fillable = [
        'partner_id',
        'profit_start_date',
        'profit_end_date',
        'applies_to',           // NEW — Gap 2.3
        'status',
        'pause_reason',
        'paused_by',
        'paused_at',
        'resumed_by',
        'resumed_at',
        'created_by',
    ];

    protected $casts = [
        'profit_start_date' => 'date',
        'profit_end_date'   => 'date',
        'paused_at'         => 'datetime',
        'resumed_at'        => 'datetime',
    ];

    // -----------------------------------------------------------------------
    // Relations
    // -----------------------------------------------------------------------

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class)->withTrashed();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function pausedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paused_by')->withTrashed();
    }

    public function resumedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resumed_by')->withTrashed();
    }

    // -----------------------------------------------------------------------
    // Scopes
    // -----------------------------------------------------------------------

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopePaused(Builder $query): Builder
    {
        return $query->where('status', 'paused');
    }

    public function scopeEnded(Builder $query): Builder
    {
        return $query->where('status', 'ended');
    }

    /**
     * Scope: eligibility record that fully covers a given distribution period.
     * profit_start_date <= period_start
     * AND (profit_end_date IS NULL OR profit_end_date >= period_end)
     * AND status = 'active'
     */
    public function scopeCoveringPeriod(Builder $query, string $periodStart, string $periodEnd): Builder
    {
        return $query
            ->where('status', 'active')
            ->where('profit_start_date', '<=', $periodStart)
            ->where(function (Builder $q) use ($periodEnd) {
                $q->whereNull('profit_end_date')
                  ->orWhere('profit_end_date', '>=', $periodEnd);
            });
    }

    /**
     * Filter eligibility records that apply to a given partner type stream.
     * 'all' always matches any stream — specific type matches only its own stream.
     * Used by PartnerEligibilityService to find the correct record per stream.
     *
     * @param  string  $type  'capital' | 'working' | 'product'
     */
    public function scopeForType(Builder $query, string $type): Builder
    {
        return $query->where(function (Builder $q) use ($type) {
            $q->where('applies_to', $type)
              ->orWhere('applies_to', 'all');
        });
    }

    // -----------------------------------------------------------------------
    // Accessors
    // -----------------------------------------------------------------------

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active';
    }

    public function getIsPausedAttribute(): bool
    {
        return $this->status === 'paused';
    }

    public function getIsEndedAttribute(): bool
    {
        return $this->status === 'ended';
    }

    public function getIsOngoingAttribute(): bool
    {
        return $this->status === 'active' && is_null($this->profit_end_date);
    }

    public function getAppliesToLabelAttribute(): string
    {
        return match ($this->applies_to) {
            'capital' => 'Capital Stream',
            'working' => 'Working Stream',
            'product' => 'Product Stream',
            'all'     => 'All Streams',
            default   => ucfirst($this->applies_to ?? 'all'),
        };
    }
}
