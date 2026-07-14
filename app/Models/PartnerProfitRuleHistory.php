<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerProfitRuleHistory extends Model
{
    // Append-only table — no SoftDeletes, no updates, no deletes ever.

    protected $fillable = [
        'partner_profit_rule_id',
        'changed_by',
        'change_type',
        'previous_value',
        'new_value',
        'change_reason',
    ];

    protected $casts = [
        'previous_value' => 'array',
        'new_value'      => 'array',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function rule(): BelongsTo
    {
        return $this->belongsTo(PartnerProfitRule::class, 'partner_profit_rule_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by')->withTrashed();
    }
}
