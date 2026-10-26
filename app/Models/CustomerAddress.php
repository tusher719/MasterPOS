<?php

namespace App\Models;

use App\Traits\HasCustomUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerAddress extends Model
{
    use HasFactory, HasCustomUuid;

    protected $fillable = [
        'uuid',
        'customer_id',
        'label',
        'recipient_name',
        'recipient_phone',
        'address',
        'city',
        'delivery_type',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
