<?php

// app/Models/Purchase.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'supplier_id',
        'reference_no',
        'purchase_date',
        'purchase_status',
        'subtotal',
        'discount',
        'tax',
        'shipping_cost',
        'grand_total',
        'paid_amount',
        'due_amount',
        'payment_status',
        'note',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'purchase_date'  => 'date',
        'subtotal'       => 'decimal:2',
        'discount'       => 'decimal:2',
        'tax'            => 'decimal:2',
        'shipping_cost'  => 'decimal:2',
        'grand_total'    => 'decimal:2',
        'paid_amount'    => 'decimal:2',
        'due_amount'     => 'decimal:2',
    ];

    // ─── Enums ────────────────────────────────────────────────────────────────

    const PURCHASE_STATUSES = [
        'draft'            => 'Draft',
        'ordered'          => 'Ordered',
        'received'         => 'Received',
        'partial_received' => 'Partial Received',
        'cancelled'        => 'Cancelled',
    ];

    const PAYMENT_STATUSES = [
        'paid'    => 'Paid',
        'partial' => 'Partial',
        'due'     => 'Due',
    ];

    // Statuses that trigger stock movement
    const STOCK_TRIGGER_STATUSES = ['received', 'partial_received'];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PurchasePayment::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeBySupplier($query, $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function scopeByPurchaseStatus($query, $status)
    {
        return $query->where('purchase_status', $status);
    }

    public function scopeByPaymentStatus($query, $status)
    {
        return $query->where('payment_status', $status);
    }

    public function scopeByDateRange($query, $from, $to)
    {
        return $query->whereBetween('purchase_date', [$from, $to]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    // Recalculate grand_total, due_amount and payment_status
    public function recalculate(): void
    {
        $this->grand_total    = $this->subtotal - $this->discount + $this->tax + $this->shipping_cost;
        $this->due_amount     = max(0, $this->grand_total - $this->paid_amount);
        $this->payment_status = $this->resolvePaymentStatus();
    }

    private function resolvePaymentStatus(): string
    {
        if ($this->paid_amount <= 0) {
            return 'due';
        }

        if ($this->due_amount <= 0) {
            return 'paid';
        }

        return 'partial';
    }

    // Check if this purchase status triggers stock movement
    public function triggersStock(): bool
    {
        return in_array($this->purchase_status, self::STOCK_TRIGGER_STATUSES);
    }

    // Generate reference number: PUR-YYYYMMDD-XXXX
    public static function generateReferenceNo(): string
    {
        $today  = now()->format('Ymd');
        $prefix = "PUR-{$today}-";

        $last = self::withTrashed()
            ->where('reference_no', 'like', $prefix . '%')
            ->orderByDesc('reference_no')
            ->value('reference_no');

        $sequence = $last
            ? (int) substr($last, strlen($prefix)) + 1
            : 1;

        return $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
