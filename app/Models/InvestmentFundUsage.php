<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InvestmentFundUsage extends Model
{
    protected $fillable = [
        'capital_ledger_entry_id',
        'partner_id',
        'usable_type',
        'usable_id',
        'amount',
        'note',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    // ─── Relations ────────────────────────────────────────────────

    public function capitalLedgerEntry(): BelongsTo
    {
        return $this->belongsTo(CapitalLedgerEntry::class, 'capital_ledger_entry_id');
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class, 'partner_id')->withTrashed();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function usable(): MorphTo
    {
        return $this->morphTo();
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeForEntry($query, int $entryId)
    {
        return $query->where('capital_ledger_entry_id', $entryId);
    }

    public function scopePurchases($query)
    {
        return $query->where('usable_type', 'purchase');
    }

    public function scopeExpenses($query)
    {
        return $query->where('usable_type', 'expense');
    }

    // ─── Accessors ────────────────────────────────────────────────

    public function getUsableLabelAttribute(): string
    {
        return match ($this->usable_type) {
            'purchase' => 'Purchase',
            'expense'  => 'Expense',
            default    => ucfirst($this->usable_type),
        };
    }
}
