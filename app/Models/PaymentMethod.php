<?php
// app/Models/PaymentMethod.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaymentMethod extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'is_active',
        'sort_order',
        'online_charge_type',
        'online_charge_value',
        'charge_enabled',
        'charge_label',
    ];

    protected $casts = [
        'is_active'            => 'boolean',
        'sort_order'           => 'integer',
        'charge_enabled'       => 'boolean',
        'online_charge_value'  => 'decimal:2',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Calculate the charge amount for a given subtotal.
     * Returns 0 if charge is disabled or not configured.
     */
    public function calculateCharge(float $subtotal): float
    {
        if (! $this->charge_enabled || ! $this->online_charge_type) {
            return 0.0;
        }

        if ($this->online_charge_type === 'percent') {
            return round($subtotal * (float) $this->online_charge_value / 100, 2);
        }

        // fixed
        return round((float) $this->online_charge_value, 2);
    }
}
