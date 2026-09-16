<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseReturnItem extends Model
{
    protected $fillable = [
        'purchase_return_id',
        'product_id',
        'variant_id',
        'quantity',
        'unit_cost',
        'subtotal',
        'reason_note',
    ];

    protected $casts = [
        'quantity'  => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'subtotal'  => 'decimal:2',
    ];

    // ─── Relations ────────────────────────────────────────────────────────────

    public function purchaseReturn(): BelongsTo
    {
        return $this->belongsTo(PurchaseReturn::class);
    }

    public function product(): BelongsTo
    {
        // withTrashed — soft-deleted products still need to be readable in history
        return $this->belongsTo(Product::class)->withTrashed();
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id')->withTrashed();
    }
}
