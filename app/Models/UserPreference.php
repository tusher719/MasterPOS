<?php
// app/Models/UserPreference.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    protected $fillable = [
        'user_id',
        'theme_json',
        'ui_json',
    ];

    protected $casts = [
        'theme_json' => 'array',
        'ui_json'    => 'array',
    ];

    // ─── Default theme values ───────────────────────────────────────────────
    public const DEFAULT_THEME = [
        'primary_color' => '#4F46E5',
        'sidebar_color' => '#111827',
        'font_size'     => 'medium',
        'font_family'   => 'inter',
        'mode'          => 'system',
        'border_radius' => 'medium',
        'preset'        => 'indigo',
    ];

    // ─── Default UI values ──────────────────────────────────────────────────
    public const DEFAULT_UI = [
        'sidebar_collapsed' => false,
        'sidebar_width'     => 'normal',
        'density'           => 'comfortable',
        'card_style'        => 'flat',
        'sidebar_behavior'  => 'fixed',
        'reduce_motion'     => false,
    ];

    // ─── Relations ──────────────────────────────────────────────────────────
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    /**
     * Get theme_json merged with defaults.
     * Ensures no key is ever missing on frontend.
     */
    public function getTheme(): array
    {
        return array_merge(
            self::DEFAULT_THEME,
            $this->theme_json ?? []
        );
    }

    /**
     * Get ui_json merged with defaults.
     */
    public function getUi(): array
    {
        return array_merge(
            self::DEFAULT_UI,
            $this->ui_json ?? []
        );
    }

    /**
     * Find or create preference record for a user.
     * Always returns a valid model — never null on frontend.
     */
    public static function findOrCreateForUser(int $userId): self
    {
        return self::firstOrCreate(
            ['user_id' => $userId],
            [
                'theme_json' => self::DEFAULT_THEME,
                'ui_json'    => self::DEFAULT_UI,
            ]
        );
    }
}
