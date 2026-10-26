<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasCustomUuid;

class Customer extends Model
{
    use HasFactory, SoftDeletes, HasCustomUuid;

    protected $fillable = [
        'uuid',
        'name',
        'email',
        'phone',
        'whatsapp',
        'address',
        'city',
        'country',
        'opening_balance',
        'facebook',
        'instagram',
        'tiktok',
        'is_active',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'is_active'       => 'boolean',
    ];

    // Scopes

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
