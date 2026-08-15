<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalePayment extends Model
{
    protected $fillable = [
        'sale_id',
        'payment_method_id',
        'payment_method_bank_id',
        'amount',
        'payment_charge',
        'payment_date',
        'reference',
        'note',
        'payment_proof_image',
        'payment_status_manual',
        'transaction_id',
        'verified_by',
        'verified_at',
        'created_by',
    ];

    protected $casts = [
        'amount'         => 'decimal:2',
        'payment_charge' => 'decimal:2',
        'payment_date'   => 'date',
        'verified_at'    => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class)->withTrashed();
    }

    /**
     * PaymentMethodBank has no SoftDeletes — withTrashed() must NOT be called here.
     */
    public function paymentMethodBank(): BelongsTo
    {
        return $this->belongsTo(PaymentMethodBank::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by')->withTrashed();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeVerified($query)
    {
        return $query->where('payment_status_manual', 'verified');
    }

    public function scopePendingVerification($query)
    {
        return $query->where('payment_status_manual', 'pending_verification');
    }

    // ─── Helpers ──────────────────────────────────────────────────

    public function isVerified(): bool
    {
        return $this->payment_status_manual === 'verified';
    }

    public function isPendingVerification(): bool
    {
        return $this->payment_status_manual === 'pending_verification';
    }

    public function isRejected(): bool
    {
        return $this->payment_status_manual === 'rejected';
    }

    /**
     * Total amount including payment charge.
     */
    public function totalWithCharge(): float
    {
        return (float) $this->amount + (float) $this->payment_charge;
    }
}
