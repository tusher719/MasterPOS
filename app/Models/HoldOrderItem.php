<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HoldOrderItem extends Model
{
    protected $fillable = [
        'hold_order_id',
        'product_id',
        'quantity',
        'unit_price',
        'discount',
        'subtotal',
    ];

    protected $casts = [
        'quantity'   => 'integer',
        'unit_price' => 'decimal:2',
        'discount'   => 'decimal:2',
        'subtotal'   => 'decimal:2',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function holdOrder(): BelongsTo
    {
        return $this->belongsTo(HoldOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }
}
