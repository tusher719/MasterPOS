<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\PartnerProfitRule;

class Partner extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'partner_type_capital',
        'partner_type_working',
        'partner_type_product',
        'phone',
        'email',
        'address',
        'user_id',
        'note',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'partner_type_capital' => 'boolean',
        'partner_type_working' => 'boolean',
        'partner_type_product' => 'boolean',
        'is_active'            => 'boolean',
        'deleted_at'           => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Code Generation
    // -------------------------------------------------------------------------

    public static function generateCode(): string
    {
        $latest = static::withTrashed()
            ->whereNotNull('code')
            ->where('code', 'like', 'PTR-%')
            ->orderByRaw('CAST(SUBSTRING(code, 5) AS UNSIGNED) DESC')
            ->value('code');

        if (!$latest) {
            return 'PTR-001';
        }

        $number = (int) substr($latest, 4);

        return 'PTR-' . str_pad($number + 1, 3, '0', STR_PAD_LEFT);
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id')->withTrashed();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by')->withTrashed();
    }

    public function partnerInvestments(): HasMany
    {
        return $this->hasMany(PartnerInvestment::class);
    }

    public function investments(): BelongsToMany
    {
        return $this->belongsToMany(Investment::class, 'partner_investments')
            ->withPivot('is_primary', 'note')
            ->withTimestamps();
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public function getTypeLabelsAttribute(): string
    {
        $types = [];

        if ($this->partner_type_capital) $types[] = 'Capital';
        if ($this->partner_type_working) $types[] = 'Working';
        if ($this->partner_type_product) $types[] = 'Product';

        return implode(', ', $types);
    }

    public function getHasTypeAttribute(): bool
    {
        return $this->partner_type_capital
            || $this->partner_type_working
            || $this->partner_type_product;
    }

    public function profitRules(): HasMany
    {
        return $this->hasMany(PartnerProfitRule::class);
    }
}
