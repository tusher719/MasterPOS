<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LegalPage extends Model
{
    protected $fillable = [
        'type',
        'title',
        'content',
        'is_visible',
        'updated_by',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by')->withTrashed();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Human-readable label for the page type.
     */
    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'privacy_policy'   => 'Privacy Policy',
            'terms_conditions' => 'Terms & Conditions',
            default            => ucfirst(str_replace('_', ' ', $this->type)),
        };
    }

    /**
     * The public URL slug for this page.
     */
    public function getSlugAttribute(): string
    {
        return match ($this->type) {
            'privacy_policy'   => 'privacy-policy',
            'terms_conditions' => 'terms-conditions',
            default            => str_replace('_', '-', $this->type),
        };
    }
}
