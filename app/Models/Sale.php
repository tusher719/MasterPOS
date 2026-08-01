<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'reference_no',
        'customer_id',
        'sale_date',
        'subtotal',
        'discount',
        'tax',
        'grand_total',
        'paid_amount',
        'due_amount',
        'payment_status',
        'payment_method_id',
        'order_status',
        'payment_type',
        'note',
        'created_by',
    ];

    protected $casts = [
        'sale_date'   => 'date',
        'subtotal'    => 'decimal:2',
        'discount'    => 'decimal:2',
        'tax'         => 'decimal:2',
        'grand_total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount'  => 'decimal:2',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)->withTrashed();
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class)->withTrashed();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    // ─── Reference Number Generator ───────────────────────────────

    /**
     * Generate next reference number: SL-YYYYMMDD-XXXX
     */
    public static function generateReference(): string
    {
        $prefix = 'SL-' . now()->format('Ymd') . '-';

        $last = static::withTrashed()
            ->where('reference_no', 'like', $prefix . '%')
            ->orderByDesc('reference_no')
            ->value('reference_no');

        $next = $last
            ? (int) substr($last, -4) + 1
            : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    // ─── Order Status Helpers ─────────────────────────────────────

    public function isDelivered(): bool
    {
        return $this->order_status === 'delivered';
    }

    public function isCancelled(): bool
    {
        return $this->order_status === 'cancelled';
    }

    public function isReturned(): bool
    {
        return $this->order_status === 'returned';
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }

    public function scopeByOrderStatus($query, string $status)
    {
        return $query->where('order_status', $status);
    }
}
