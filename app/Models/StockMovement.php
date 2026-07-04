<?php

// app/Models/StockMovement.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'reference_type',
        'reference_id',
        'type',
        'quantity',
        'before_quantity',
        'after_quantity',
        'unit_cost',
        'note',
        'created_by',
    ];

    protected $casts = [
        'quantity'        => 'integer',
        'before_quantity' => 'integer',
        'after_quantity'  => 'integer',
        'unit_cost'       => 'decimal:2',
    ];

    // ─── Movement Types ───────────────────────────────────────────────────────

    const TYPES = [
        'purchase'    => 'Purchase',
        'sale'        => 'Sale',
        'return'      => 'Return',
        'adjustment'  => 'Adjustment',
        'transfer'    => 'Transfer',
    ];

    // Stock IN types (positive quantity)
    const STOCK_IN_TYPES = ['purchase', 'return', 'adjustment', 'transfer'];

    // Stock OUT types (negative quantity)
    const STOCK_OUT_TYPES = ['sale'];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Polymorphic: resolves to Purchase, Sale, Return, etc.
    public function reference(): MorphTo
    {
        return $this->morphTo('reference');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForReference($query, string $type, int $id)
    {
        return $query->where('reference_type', $type)
                     ->where('reference_id', $id);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    // Returns true if this movement added stock
    public function isStockIn(): bool
    {
        return $this->quantity > 0;
    }

    // Returns true if this movement removed stock
    public function isStockOut(): bool
    {
        return $this->quantity < 0;
    }
}
