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
        // ── Item 4.2 — Delivery ───────────────────────────────────
        'delivery_type',
        'delivery_charge',
        'delivery_charge_free',
        'delivery_address',
        'delivery_contact_phone',
        'delivery_status',
        // ─────────────────────────────────────────────────────────
        'note',
        'created_by',
    ];

    protected $casts = [
        'sale_date'            => 'date',
        'subtotal'             => 'decimal:2',
        'discount'             => 'decimal:2',
        'tax'                  => 'decimal:2',
        'grand_total'          => 'decimal:2',
        'paid_amount'          => 'decimal:2',
        'due_amount'           => 'decimal:2',
        'delivery_charge'      => 'decimal:2',
        'delivery_charge_free' => 'boolean',
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

    // ─── Delivery Helpers ─────────────────────────────────────────

    public function requiresDelivery(): bool
    {
        return in_array($this->delivery_type, [
            'inside_dhaka',
            'outside_dhaka',
            'parallel',
        ]);
    }

    public function effectiveDeliveryCharge(): float
    {
        if ($this->delivery_charge_free || $this->delivery_type === 'store_pickup') {
            return 0.0;
        }

        return (float) ($this->delivery_charge ?? 0);
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

    public function scopeByDeliveryStatus($query, string $status)
    {
        return $query->where('delivery_status', $status);
    }

    public function scopeByDeliveryType($query, string $type)
    {
        return $query->where('delivery_type', $type);
    }
}
