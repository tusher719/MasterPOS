<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Investment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'investment_type_id',
        'title',
        'investor_name',
        'amount',
        'investment_date',
        'reference',
        'attachment',
        'note',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount'          => 'decimal:2',
        'investment_date' => 'date',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function investmentType(): BelongsTo
    {
        return $this->belongsTo(InvestmentType::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by')->withTrashed();
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeWithdrawn($query)
    {
        return $query->where('status', 'withdrawn');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isWithdrawn(): bool
    {
        return $this->status === 'withdrawn';
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        return $this->attachment
            ? asset('storage/' . $this->attachment)
            : null;
    }

    public function getAttachmentExtensionAttribute(): ?string
    {
        return $this->attachment
            ? strtolower(pathinfo($this->attachment, PATHINFO_EXTENSION))
            : null;
    }

    public function isAttachmentImage(): bool
    {
        return in_array($this->attachment_extension, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    }
}
