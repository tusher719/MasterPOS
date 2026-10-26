<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasCustomUuid;

class Supplier extends Model
{
    use HasFactory, SoftDeletes, HasCustomUuid;

    protected $fillable = [
        'uuid',
        'name',
        'company',
        'email',
        'phone',
        'address',
        'city',
        'country',
        'opening_balance',
        'is_active',
    ];

    protected $casts = [
        'is_active'       => 'boolean',
        'opening_balance' => 'decimal:2',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
    public function purchases(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\Purchase::class);
    }
}

