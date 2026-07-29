<?php

namespace App\Services;

use App\Models\BusinessSetting;
use Illuminate\Support\Facades\Cache;

class SettingsService
{
    // Cache key for the full settings map
    public const CACHE_KEY = 'business_settings_map';

    // Cache TTL — 24 hours; Observer invalidates on every update
    private const CACHE_TTL = 86400;

    /**
     * Get a single setting value by key.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $map = static::all();

        return $map[$key] ?? $default;
    }

    /**
     * Get all settings as a key-value map (cached).
     */
    public static function all(): array
    {
        return Cache::remember(static::CACHE_KEY, static::CACHE_TTL, function () {
            return BusinessSetting::pluck('value', 'key')->toArray();
        });
    }

    /**
     * Invalidate the settings cache.
     * Called by BusinessSettingObserver on every save/delete.
     */
    public static function invalidate(): void
    {
        Cache::forget(static::CACHE_KEY);
    }
}
