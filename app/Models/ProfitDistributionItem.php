<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

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
        'distribution_percent',
        'deferred_amount',
        'reinvested_amount',
        'carried_from_distribution_id',
        'note',
    ];

    // ─── Excluded from fillable (set only via model methods) ──
    // payment_status        → updated via syncPaymentStatus()
    // payment_method        → legacy inline field (backward compat)
    // transaction_reference → legacy inline field (backward compat)
    // paid_by               → legacy inline field (backward compat)
    // paid_at               → legacy inline field (backward compat)

    protected $casts = [
        'invested_amount'      => 'decimal:2',
        'share_percent'        => 'decimal:4',
        'share_amount'         => 'decimal:2',
        'distribution_percent' => 'decimal:2',
        'deferred_amount'      => 'decimal:2',
        'reinvested_amount'    => 'decimal:2',
        'paid_at'              => 'datetime',
    ];

    // ─── Relations ────────────────────────────────────────────

    public function distribution(): BelongsTo
    {
        return $this->belongsTo(ProfitDistribution::class, 'profit_distribution_id');
    }

    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class)->withTrashed();
    }

    public function carriedFromDistribution(): BelongsTo
    {
        return $this->belongsTo(ProfitDistribution::class, 'carried_from_distribution_id')
                    ->withTrashed();
    }

    public function paidByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by')->withTrashed();
    }

    /**
     * All payment transactions recorded against this item.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(ProfitDistributionItemPayment::class, 'profit_distribution_item_id')
                    ->orderBy('created_at', 'asc');
    }

    // ─── Computed Amounts ─────────────────────────────────────

    /**
     * Effective distributable amount after applying per-investor
     * distribution_percent override.
     */
    public function effectiveAmount(): float
    {
        return round(
            (float) $this->share_amount * ((float) $this->distribution_percent / 100),
            2
        );
    }

    /**
     * Total amount already paid across all active payment transactions.
     */
    public function totalPaid(): float
    {
        return (float) $this->payments()
            ->whereIn('payment_status', [
                ProfitDistributionItemPayment::STATUS_PAID,
                ProfitDistributionItemPayment::STATUS_PARTIAL,
            ])
            ->sum('amount');
    }

    /**
     * Remaining payable = effective - paid - deferred - reinvested.
     */
    public function remainingAmount(): float
    {
        return max(0, round(
            $this->effectiveAmount()
                - $this->totalPaid()
                - (float) $this->deferred_amount
                - (float) $this->reinvested_amount,
            2
        ));
    }

    // ─── Payment Status Sync ──────────────────────────────────

    /**
     * Recalculate and sync payment_status based on payment transactions.
     * Call after every payment action.
     */
    public function syncPaymentStatus(): void
    {
        $effective  = $this->effectiveAmount();
        $paid       = $this->totalPaid();
        $deferred   = (float) $this->deferred_amount;
        $reinvested = (float) $this->reinvested_amount;
        $covered    = $paid + $deferred + $reinvested;

        $status = match (true) {
            $reinvested >= $effective       => ProfitDistributionItemPayment::STATUS_REINVESTED,
            $deferred   >= $effective       => ProfitDistributionItemPayment::STATUS_DEFERRED,
            $covered    >= $effective       => ProfitDistributionItemPayment::STATUS_PAID,
            $paid > 0 && $covered < $effective => ProfitDistributionItemPayment::STATUS_PARTIAL,
            default                         => ProfitDistributionItemPayment::STATUS_PENDING,
        };

        $this->forceFill(['payment_status' => $status])->save();
    }

    // ─── Payment Action Methods ───────────────────────────────

    /**
     * Record a full or partial payment against this item.
     */
    public function markAsPaid(
        float $amount, string $paymentMethod, ?string $reference, ?string $note
    ): ProfitDistributionItemPayment {
        if ($amount > $this->remainingAmount()) {
            throw new \RuntimeException(
                "Payment amount ({$amount}) exceeds remaining amount ({$this->remainingAmount()})."
            );
        }

        $remaining = $this->remainingAmount();
        $status    = $amount >= $remaining
            ? ProfitDistributionItemPayment::STATUS_PAID
            : ProfitDistributionItemPayment::STATUS_PARTIAL;

        $payment = $this->payments()->create([
            'amount'                => $amount,
            'payment_status'        => $status,
            'payment_method'        => $paymentMethod,
            'transaction_reference' => $reference,
            'note'                  => $note,
            'paid_by'               => Auth::id(),
            'paid_at'               => now(),
        ]);

        $balance = InvestorProfitBalance::findOrCreateForInvestment($this->investment);
        $balance->recordPayment($amount);

        $this->syncPaymentStatus();

        return $payment;
    }

    /**
     * Defer remaining amount to next distribution period.
     */
    public function markAsDeferred(?string $note = null): ProfitDistributionItemPayment
    {
        $amount = $this->remainingAmount();

        if ($amount <= 0) {
            throw new \RuntimeException('No remaining amount to defer.');
        }

        $payment = $this->payments()->create([
            'amount'         => $amount,
            'payment_status' => ProfitDistributionItemPayment::STATUS_DEFERRED,
            'note'           => $note,
            'paid_by'        => Auth::id(),
            'paid_at'        => now(),
        ]);

        $this->increment('deferred_amount', $amount);

        $balance = InvestorProfitBalance::findOrCreateForInvestment($this->investment);
        $balance->recordDeferred($amount);

        $this->syncPaymentStatus();

        return $payment;
    }

    /**
     * Reinvest remaining amount into capital.
     */
    public function markAsReinvested(?string $note = null): ProfitDistributionItemPayment
    {
        $amount = $this->remainingAmount();

        if ($amount <= 0) {
            throw new \RuntimeException('No remaining amount to reinvest.');
        }

        $payment = $this->payments()->create([
            'amount'         => $amount,
            'payment_status' => ProfitDistributionItemPayment::STATUS_REINVESTED,
            'note'           => $note,
            'paid_by'        => Auth::id(),
            'paid_at'        => now(),
        ]);

        $this->increment('reinvested_amount', $amount);

        $balance = InvestorProfitBalance::findOrCreateForInvestment($this->investment);
        $balance->recordReinvested($amount);

        $this->syncPaymentStatus();

        return $payment;
    }

    /**
     * Cancel a specific payment transaction and restore pending balance.
     */
    public function cancelPayment(ProfitDistributionItemPayment $payment): void
    {
        if ($payment->isCancelled()) {
            throw new \RuntimeException('Payment is already cancelled.');
        }

        $amount = (float) $payment->amount;
        $status = $payment->payment_status;

        $payment->update([
            'payment_status' => ProfitDistributionItemPayment::STATUS_CANCELLED,
        ]);

        $balance = InvestorProfitBalance::findOrCreateForInvestment($this->investment);

        match ($status) {
            ProfitDistributionItemPayment::STATUS_PAID,
            ProfitDistributionItemPayment::STATUS_PARTIAL => $balance->reversePayment($amount),

            ProfitDistributionItemPayment::STATUS_DEFERRED => (function () use ($amount, $balance) {
                $this->decrement('deferred_amount', $amount);
                $balance->reverseDeferred($amount);
            })(),

            ProfitDistributionItemPayment::STATUS_REINVESTED => (function () use ($amount, $balance) {
                $this->decrement('reinvested_amount', $amount);
                $balance->reverseReinvested($amount);
            })(),
            ProfitDistributionItemPayment::STATUS_REOPENED => $balance->reversePayment($amount),

            default => null,
        };

        $this->syncPaymentStatus();
    }

    /**
     * Reopen a cancelled payment.
     */
    public function reopenPayment(ProfitDistributionItemPayment $payment): void
    {
        if (! $payment->canBeReopened()) {
            throw new \RuntimeException('Only cancelled payments can be reopened.');
        }

        $payment->update([
            'payment_status' => ProfitDistributionItemPayment::STATUS_REOPENED,
        ]);

        $this->syncPaymentStatus();
    }

    // ─── Status Helpers ───────────────────────────────────────

    public function isPending(): bool
    {
        return $this->payment_status === ProfitDistributionItemPayment::STATUS_PENDING;
    }

    public function isPaid(): bool
    {
        return $this->payment_status === ProfitDistributionItemPayment::STATUS_PAID;
    }

    public function isCancelled(): bool
    {
        return $this->payment_status === ProfitDistributionItemPayment::STATUS_CANCELLED;
    }

    public function isFullySettled(): bool
    {
        return in_array($this->payment_status, [
            ProfitDistributionItemPayment::STATUS_PAID,
            ProfitDistributionItemPayment::STATUS_REINVESTED,
            ProfitDistributionItemPayment::STATUS_DEFERRED,
        ]);
    }

    public function isCarriedForward(): bool
    {
        return $this->carried_from_distribution_id !== null;
    }

    // ─── Accessors (backward compat for existing UI) ──────────

    public function getPaymentStatusLabelAttribute(): string
    {
        return ProfitDistributionItemPayment::statusLabel($this->payment_status ?? 'pending');
    }

    public function getPaymentStatusBadgeAttribute(): array
    {
        return match ($this->payment_status) {
            'paid'        => ['bg' => 'bg-green-100',  'text' => 'text-green-700'],
            'partial'     => ['bg' => 'bg-blue-100',   'text' => 'text-blue-700'],
            'deferred'    => ['bg' => 'bg-purple-100', 'text' => 'text-purple-700'],
            'reinvested'  => ['bg' => 'bg-indigo-100', 'text' => 'text-indigo-700'],
            'cancelled'   => ['bg' => 'bg-red-100',    'text' => 'text-red-700'],
            'reopened'    => ['bg' => 'bg-yellow-100', 'text' => 'text-yellow-700'],
            default       => ['bg' => 'bg-amber-100',  'text' => 'text-amber-700'],
        };
    }

    public function profitDistribution(): BelongsTo
    {
        return $this->belongsTo(ProfitDistribution::class, 'profit_distribution_id');
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by')->withTrashed();
    }


}
