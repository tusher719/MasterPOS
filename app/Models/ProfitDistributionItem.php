<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfitDistributionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'profit_distribution_id',
        'investment_id',
        'investor_name',
        'investment_title',
        'investment_type',
        'invested_amount',
        'share_percent',
        'share_amount',
        'payment_status',
        'payment_method',
        'transaction_reference',
        'paid_by',
        'paid_at',
        'note',
    ];

    protected $casts = [
        'invested_amount' => 'decimal:2',
        'share_percent'   => 'decimal:4',
        'share_amount'    => 'decimal:2',
        'paid_at'         => 'datetime',
    ];

    // -----------------------------------------------------------------------
    // Payment status helpers
    // -----------------------------------------------------------------------

    public function isPending(): bool
    {
        return $this->payment_status === 'pending';
    }

    public function isPaid(): bool
    {
        return $this->payment_status === 'paid';
    }

    public function isCancelled(): bool
    {
        return $this->payment_status === 'cancelled';
    }

    // -----------------------------------------------------------------------
    // Payment transition
    // -----------------------------------------------------------------------

    /**
     * Mark this item as paid.
     * Caller must ensure the parent distribution is in 'approved' or
     * 'distributed' status before calling this method.
     */
    public function markAsPaid(
        int $userId,
        ?string $paymentMethod = null,
        ?string $transactionReference = null
    ): void {
        $this->update([
            'payment_status'        => 'paid',
            'payment_method'        => $paymentMethod,
            'transaction_reference' => $transactionReference,
            'paid_by'               => $userId,
            'paid_at'               => now(),
        ]);
    }

    /**
     * Cancel this item's payment (only from 'pending' status).
     */
    public function markAsCancelled(): void
    {
        $this->update([
            'payment_status' => 'cancelled',
        ]);
    }

    // -----------------------------------------------------------------------
    // Accessors
    // -----------------------------------------------------------------------

    /**
     * Human-readable payment status label for UI badges.
     */
    public function getPaymentStatusLabelAttribute(): string
    {
        return match ($this->payment_status) {
            'paid'      => 'Paid',
            'cancelled' => 'Cancelled',
            default     => 'Pending',
        };
    }

    /**
     * Tailwind badge color classes for payment status.
     * Returns an array: ['bg' => '...', 'text' => '...']
     */
    public function getPaymentStatusBadgeAttribute(): array
    {
        return match ($this->payment_status) {
            'paid'      => ['bg' => 'bg-green-100', 'text' => 'text-green-700'],
            'cancelled' => ['bg' => 'bg-red-100',   'text' => 'text-red-700'],
            default     => ['bg' => 'bg-amber-100',  'text' => 'text-amber-700'],
        };
    }

    // -----------------------------------------------------------------------
    // Relations
    // -----------------------------------------------------------------------

    public function distribution(): BelongsTo
    {
        return $this->belongsTo(ProfitDistribution::class, 'profit_distribution_id');
    }

    /**
     * Investment FK preserved for ledger JOIN.
     * withTrashed() ensures the relation resolves even if the investment
     * is soft-deleted after the snapshot was taken.
     */
    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class)->withTrashed();
    }

    /**
     * User who marked this item as paid.
     */
    public function paidByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by')->withTrashed();
    }
}
