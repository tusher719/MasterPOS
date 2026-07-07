<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'status',
        'is_locked',
        'note',
        'approved_by',
        'approved_at',
        'distributed_by',
        'distributed_at',
        'created_by',
        'updated_by',
    ];

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

    // -----------------------------------------------------------------------
    // Auto-generate distribution_no
    // -----------------------------------------------------------------------

    /**
     * Generate the next sequential distribution number for the current year.
     * Must be called inside a DB::transaction() with a lockForUpdate() to
     * prevent race conditions under concurrent requests.
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

    // -----------------------------------------------------------------------
    // Status helpers
    // -----------------------------------------------------------------------

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isDistributed(): bool
    {
        return $this->status === 'distributed';
    }

    public function isLocked(): bool
    {
        return (bool) $this->is_locked;
    }

    // -----------------------------------------------------------------------
    // Status transitions
    // -----------------------------------------------------------------------

    public function approve(int $userId): void
    {
        $this->update([
            'status'      => 'approved',
            'is_locked'   => true,
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);
    }

    public function distribute(int $userId): void
    {
        $this->update([
            'status'           => 'distributed',
            'distributed_by'   => $userId,
            'distributed_at'   => now(),
        ]);
    }

    // -----------------------------------------------------------------------
    // Computed accessors
    // -----------------------------------------------------------------------

    /**
     * Count of items with payment_status = paid.
     */
    public function getPaidItemsCountAttribute(): int
    {
        return $this->items()->where('payment_status', 'paid')->count();
    }

    /**
     * Count of items with payment_status = pending.
     */
    public function getPendingItemsCountAttribute(): int
    {
        return $this->items()->where('payment_status', 'pending')->count();
    }

    /**
     * Sum of share_amount for paid items.
     */
    public function getTotalPaidAmountAttribute(): string
    {
        return $this->items()->where('payment_status', 'paid')->sum('share_amount');
    }

    // -----------------------------------------------------------------------
    // Scopes
    // -----------------------------------------------------------------------

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeDistributed($query)
    {
        return $query->where('status', 'distributed');
    }

    // -----------------------------------------------------------------------
    // Relations
    // -----------------------------------------------------------------------

    public function items(): HasMany
    {
        return $this->hasMany(ProfitDistributionItem::class);
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
