<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HoldOrder extends Model
{
    protected $fillable = [
        'reference_no',
        'customer_id',
        'note',
        'status',
        'subtotal',
        'discount',
        'tax',
        'grand_total',
        'expires_at',
        'created_by',
    ];

    protected $casts = [
        'subtotal'    => 'decimal:2',
        'discount'    => 'decimal:2',
        'tax'         => 'decimal:2',
        'grand_total' => 'decimal:2',
        'expires_at'  => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)->withTrashed();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function items(): HasMany
    {
        return $this->hasMany(HoldOrderItem::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    // ─── Helpers ──────────────────────────────────────────────────

    public static function generateReference(): string
    {
        $prefix  = 'HO-' . now()->format('Ymd') . '-';
        $last    = static::where('reference_no', 'like', $prefix . '%')
                            ->orderByDesc('id')
                            ->value('reference_no');

        $next = $last
            ? str_pad((int) substr($last, -4) + 1, 4, '0', STR_PAD_LEFT)
            : '0001';

        return $prefix . $next;
    }

    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function markAsProcessing(): bool
    {
        return $this->update(['status' => 'processing']);
    }

    public function markAsActive(): bool
    {
        return $this->update(['status' => 'active']);
    }
}
