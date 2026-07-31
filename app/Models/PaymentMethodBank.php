<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentMethodBank extends Model
{
    protected $fillable = [
        'payment_method_id',
        'bank_name',
        'account_number',
        'account_name',
        'charge_type',
        'charge_value',
        'charge_enabled',
        'charge_label',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'charge_enabled' => 'boolean',
        'charge_value'   => 'decimal:2',
        'is_active'      => 'boolean',
        'sort_order'     => 'integer',
    ];

    // ── Relations ──────────────────────────────────────────────────────────────

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('bank_name');
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Calculate the charge amount for a given subtotal.
     * Returns 0 if charge is disabled or type not configured.
     */
    public function calculateCharge(float $subtotal): float
    {
        if (! $this->charge_enabled || ! $this->charge_type) {
            return 0.0;
        }

        if ($this->charge_type === 'percent') {
            return round($subtotal * (float) $this->charge_value / 100, 2);
        }

        // fixed
        return round((float) $this->charge_value, 2);
    }
}
