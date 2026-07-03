<?php
// app/Models/Unit.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    protected $fillable = [
        'name',
        'short_code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /** Products using this unit */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'unit_id');
    }
}
