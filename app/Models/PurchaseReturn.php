<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseReturn extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'purchase_id',
        'return_date',
        'return_type',
        'reason',
        'note',
        'total_return_value',
        // status, confirmed_by, confirmed_at excluded — set only via confirm() method (Rule 66)
        'created_by',
    ];

    protected $casts = [
        'return_date'       => 'date',
        'confirmed_at'      => 'datetime',
        'total_return_value' => 'decimal:2',
    ];

    // ─── Status helpers ───────────────────────────────────────────────────────

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    // ─── Return type helpers ──────────────────────────────────────────────────

    public function isSupplierReturn(): bool
    {
        return $this->return_type === 'supplier_return';
    }

    public function isDamageWastage(): bool
    {
        return $this->return_type === 'damage_wastage';
    }

    // ─── Business method — confirm return ─────────────────────────────────────
    // Sets status + audit fields via forceFill (Rule 66 — excluded from $fillable)

    public function confirm(int $userId): void
    {
        $this->forceFill([
            'status'       => 'confirmed',
            'confirmed_by' => $userId,
            'confirmed_at' => now(),
        ])->save();
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('return_type', $type);
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class)->withTrashed();
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseReturnItem::class);
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by')->withTrashed();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }
}
