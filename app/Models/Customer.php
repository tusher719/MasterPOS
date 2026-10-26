<?php

namespace App\Models;

use App\Traits\HasCustomUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Customer extends Authenticatable
{
    use HasFactory, SoftDeletes, HasCustomUuid, Notifiable;

    protected $fillable = [
        'uuid',
        'name',
        'email',
        'phone',
        'password',
        'avatar',
        'whatsapp',
        'address',
        'city',
        'country',
        'default_delivery_type',
        'phone_verified_at',
        'opening_balance',
        'facebook',
        'instagram',
        'tiktok',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'phone_verified_at' => 'datetime',
        'password'          => 'hashed',
        'opening_balance'   => 'decimal:2',
        'is_active'         => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class)->latest('id');
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class)->latest('id');
    }

    public function defaultAddress(): HasOne
    {
        return $this->hasOne(CustomerAddress::class)->where('is_default', true);
    }

    public function couponUsages(): HasMany
    {
        return $this->hasMany(CouponUsage::class)->latest('id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
