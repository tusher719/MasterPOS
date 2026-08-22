<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreOrder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_id',
        'customer_name_snapshot',
        'customer_phone_snapshot',
        'product_id',
        'product_name_snapshot',
        'booking_date',
        'expected_delivery_date',
        'total_amount',
        'advance_amount',
        'due_amount',
        'advance_payment_method',
        'advance_transaction_id',
        'advance_payment_proof',
        // status excluded — set only via updateStatus() / convertToSale()
        'linked_sale_id',
        'note',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'booking_date'           => 'date',
        'expected_delivery_date' => 'date',
        'total_amount'           => 'decimal:2',
        'advance_amount'         => 'decimal:2',
        'due_amount'             => 'decimal:2',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)->withTrashed();
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    public function linkedSale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'linked_sale_id')->withTrashed();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by')->withTrashed();
    }

    // ─── Status Helpers ───────────────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    public function isReady(): bool
    {
        return $this->status === 'ready';
    }

    public function isDelivered(): bool
    {
        return $this->status === 'delivered';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /** Terminal statuses — no further status change allowed */
    public function isTerminal(): bool
    {
        return in_array($this->status, ['delivered', 'cancelled']);
    }

    public function isConverted(): bool
    {
        return $this->linked_sale_id !== null;
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeOverdue($query)
    {
        return $query->whereNotNull('expected_delivery_date')
            ->where('expected_delivery_date', '<', today())
            ->whereNotIn('status', ['delivered', 'cancelled']);
    }

    // ─── Business Methods ─────────────────────────────────────────────────────

    /**
     * Calculate and set due_amount from total and advance.
     * Call before save when amounts change.
     */
    public function recalculateDue(): void
    {
        $this->due_amount = max(0, $this->total_amount - $this->advance_amount);
    }
}
