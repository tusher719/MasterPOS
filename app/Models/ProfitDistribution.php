<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProfitDistribution extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'distribution_no',
        'title',
        'distribution_date',
        'period_start',
        'period_end',
        'total_revenue',
        'total_cogs',
        'total_expenses',
        'total_investment',
        'gross_profit',
        'net_profit',
        'distribution_percent',
        'distributable_amount',
        'source_type',
        'note',
        'created_by',
        'updated_by',
    ];

    // ─── Excluded from fillable (set only via model methods) ──
    // status         → set via approve() / distribute() / reverse()
    // is_locked      → set via approve() / reverse()
    // approved_by    → set via approve() / reverse()
    // approved_at    → set via approve() / reverse()
    // distributed_by → set via distribute() / reverse()
    // distributed_at → set via distribute() / reverse()

    protected $casts = [
        'distribution_date'    => 'date',
        'period_start'         => 'date',
        'period_end'           => 'date',
        'total_revenue'        => 'decimal:2',
        'total_cogs'           => 'decimal:2',
        'total_expenses'       => 'decimal:2',
        'total_investment'     => 'decimal:2',
        'gross_profit'         => 'decimal:2',
        'net_profit'           => 'decimal:2',
        'distribution_percent' => 'decimal:2',
        'distributable_amount' => 'decimal:2',
        'is_locked'            => 'boolean',
        'approved_at'          => 'datetime',
        'distributed_at'       => 'datetime',
    ];

    // ─── Status Constants ─────────────────────────────────────

    const STATUS_DRAFT       = 'draft';
    const STATUS_APPROVED    = 'approved';
    const STATUS_DISTRIBUTED = 'distributed';

    // ─── Distribution Number Generator ───────────────────────

    /**
     * Generate the next sequential distribution number for the current year.
     * Format: PD-YYYY-000001
     * Must be called inside DB::transaction() with lockForUpdate().
     */
    public static function generateDistributionNo(): string
    {
        $year = now()->year;

        $count = static::withTrashed()
            ->whereYear('created_at', $year)
            ->lockForUpdate()
            ->count();

        return 'PD-' . $year . '-' . str_pad($count + 1, 6, '0', STR_PAD_LEFT);
    }

    // ─── Status Helpers ───────────────────────────────────────

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isDistributed(): bool
    {
        return $this->status === self::STATUS_DISTRIBUTED;
    }

    public function isLocked(): bool
    {
        return (bool) $this->is_locked;
    }

    public function canBeEdited(): bool
    {
        return $this->isDraft() && ! $this->isLocked();
    }

    public function canBeApproved(): bool
    {
        return $this->isDraft() && $this->items()->count() > 0;
    }

    public function canBeDistributed(): bool
    {
        return $this->isApproved();
    }

    public function canBeReversed(): bool
    {
        return ! $this->isDraft();
    }

    public function canBeDeleted(): bool
    {
        return $this->isDraft() && ! $this->isLocked();
    }

    // ─── Status Transitions ───────────────────────────────────

    /**
     * Approve this distribution.
     * Locks the snapshot and credits InvestorProfitBalance for each item.
     * Must be called inside DB::transaction().
     */
    public function approve(int $userId): void
    {
        $this->forceFill([
            'status'      => self::STATUS_APPROVED,
            'is_locked'   => true,
            'approved_by' => $userId,
            'approved_at' => now(),
        ])->save();

        foreach ($this->items()->with('investment')->get() as $item) {
            // Partner-based items have no investment_id — skip capital balance credit
            if (! $item->investment_id || ! $item->investment) {
                continue;
            }
            $balance = InvestorProfitBalance::findOrCreateForInvestment($item->investment);
            $balance->creditEarned($item->effectiveAmount());
        }
    }

    /**
     * Mark distribution as fully distributed.
     * All items must be settled before calling this.
     */
    public function distribute(int $userId): void
    {
        $unsettled = $this->items()
            ->whereNotIn('payment_status', [
                ProfitDistributionItemPayment::STATUS_PAID,
                ProfitDistributionItemPayment::STATUS_DEFERRED,
                ProfitDistributionItemPayment::STATUS_REINVESTED,
                ProfitDistributionItemPayment::STATUS_CANCELLED,
            ])
            ->count();

        if ($unsettled > 0) {
            throw new \RuntimeException(
                "Cannot mark as distributed: {$unsettled} item(s) are not yet settled."
            );
        }

        $this->forceFill([
            'status'         => self::STATUS_DISTRIBUTED,
            'distributed_by' => $userId,
            'distributed_at' => now(),
        ])->save();
    }

    /**
     * Reverse an approved or distributed distribution back to draft.
     * Cancels all payments and reverses InvestorProfitBalance credits.
     * Must be called inside DB::transaction().
     */
    public function reverse(string $reason): void
    {
        if ($this->isDraft()) {
            throw new \RuntimeException('Draft distributions cannot be reversed.');
        }

        foreach ($this->items()->with(['investment', 'payments'])->get() as $item) {
            if ($item->investment) {
                $balance = InvestorProfitBalance::findOrCreateForInvestment($item->investment);

                foreach ($item->payments as $payment) {
                    if (! $payment->isCancelled()) {
                        $item->cancelPayment($payment);
                    }
                }

                $balance->reverseEarned($item->effectiveAmount());
            }
        }

        $this->forceFill([
            'status'         => self::STATUS_DRAFT,
            'is_locked'      => false,
            'approved_by'    => null,
            'approved_at'    => null,
            'distributed_by' => null,
            'distributed_at' => null,
            'note'           => $this->note
                ? $this->note . "\n[Reversed] " . $reason
                : "[Reversed] " . $reason,
        ])->save();
    }

    // ─── Eligibility Helpers ──────────────────────────────────

    /**
     * Auto-generate eligibility records for all active investments
     * based on period_start date. Skips already-existing records.
     */
    public function generateEligibilities(): void
    {
        $periodStart = $this->period_start->toDateString();
        $existing    = $this->eligibilities()->pluck('investment_id')->toArray();

        $investments = Investment::whereNotIn('id', $existing)
            ->whereNull('deleted_at')
            ->get();

        foreach ($investments as $investment) {
            $isEligible = ProfitDistributionEligibility::determineEligibility(
                $investment,
                $periodStart
            );

            $this->eligibilities()->create([
                'investment_id'      => $investment->id,
                'investor_name'      => $investment->investor_name,
                'is_eligible'        => $isEligible,
                'eligibility_reason' => $isEligible
                    ? 'Investment date is on or before period start'
                    : 'Investment date is after period start',
            ]);
        }
    }

    // ─── Computed Accessors ───────────────────────────────────

    public function getPaidItemsCountAttribute(): int
    {
        return $this->items()
            ->whereIn('payment_status', ['paid', 'deferred', 'reinvested', 'cancelled'])
            ->count();
    }

    public function getPendingItemsCountAttribute(): int
    {
        return $this->items()->where('payment_status', 'pending')->count();
    }

    public function getTotalPaidAmountAttribute(): string
    {
        return $this->items()
            ->whereIn('payment_status', ['paid', 'deferred', 'reinvested'])
            ->sum('share_amount');
    }

    // ─── Scopes ───────────────────────────────────────────────

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeDistributed($query)
    {
        return $query->where('status', self::STATUS_DISTRIBUTED);
    }

    // ─── Relations ────────────────────────────────────────────

    public function items(): HasMany
    {
        return $this->hasMany(ProfitDistributionItem::class);
    }

    public function eligibilities(): HasMany
    {
        return $this->hasMany(ProfitDistributionEligibility::class, 'profit_distribution_id');
    }

    /**
     * Items that were deferred FROM this distribution into future ones.
     */
    public function carriedForwardItems(): HasMany
    {
        return $this->hasMany(ProfitDistributionItem::class, 'carried_from_distribution_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by')->withTrashed();
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by')->withTrashed();
    }

    public function distributor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'distributed_by')->withTrashed();
    }
}
