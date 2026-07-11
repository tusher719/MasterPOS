<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfitDistributionItemPayment extends Model
{
    protected $fillable = [
        'profit_distribution_item_id',
        'amount',
        'payment_status',
        'payment_method',
        'transaction_reference',
        'note',
        'paid_by',
        'paid_at',
    ];

    protected $casts = [
        'amount'   => 'decimal:2',
        'paid_at'  => 'datetime',
    ];

    // ─── Payment Status Constants ─────────────────────────────

    const STATUS_PENDING    = 'pending';
    const STATUS_PARTIAL    = 'partial';
    const STATUS_PAID       = 'paid';
    const STATUS_DEFERRED   = 'deferred';
    const STATUS_REINVESTED = 'reinvested';
    const STATUS_CANCELLED  = 'cancelled';
    const STATUS_REOPENED   = 'reopened';

    const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PARTIAL,
        self::STATUS_PAID,
        self::STATUS_DEFERRED,
        self::STATUS_REINVESTED,
        self::STATUS_CANCELLED,
        self::STATUS_REOPENED,
    ];

    // ─── Relations ────────────────────────────────────────────

    public function distributionItem(): BelongsTo
    {
        return $this->belongsTo(ProfitDistributionItem::class, 'profit_distribution_item_id');
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by')->withTrashed();
    }

    // ─── Helpers ──────────────────────────────────────────────

    public function isPaid(): bool
    {
        return $this->payment_status === self::STATUS_PAID;
    }

    public function isDeferred(): bool
    {
        return $this->payment_status === self::STATUS_DEFERRED;
    }

    public function isReinvested(): bool
    {
        return $this->payment_status === self::STATUS_REINVESTED;
    }

    public function isCancelled(): bool
    {
        return $this->payment_status === self::STATUS_CANCELLED;
    }

    public function canBeReopened(): bool
    {
        return $this->payment_status === self::STATUS_CANCELLED;
    }

    /**
     * Check if this payment transaction is a terminal state
     * (cannot transition further without explicit reopen).
     */
    public function isTerminal(): bool
    {
        return in_array($this->payment_status, [
            self::STATUS_PAID,
            self::STATUS_REINVESTED,
            self::STATUS_CANCELLED,
        ]);
    }

    /**
     * Badge color map for frontend use — returned as label string.
     */
    public static function statusLabel(string $status): string
    {
        return match ($status) {
            self::STATUS_PENDING    => 'Pending',
            self::STATUS_PARTIAL    => 'Partial Paid',
            self::STATUS_PAID       => 'Paid',
            self::STATUS_DEFERRED   => 'Deferred',
            self::STATUS_REINVESTED => 'Reinvested',
            self::STATUS_CANCELLED  => 'Cancelled',
            self::STATUS_REOPENED   => 'Reopened',
            default                 => ucfirst($status),
        };
    }
}
