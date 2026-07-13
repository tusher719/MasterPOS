<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerInvestment extends Model
{
    // No SoftDeletes — link table uses hard delete only

    protected $fillable = [
        'partner_id',
        'investment_id',
        'is_primary',
        'note',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class)->withTrashed();
    }

    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class)->withTrashed();
    }
}
