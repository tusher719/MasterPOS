<?php

use App\Models\BusinessSetting;

if (!function_exists('setting')) {
    /**
     * Get a business setting value by key.
     */
    function setting(string $key, mixed $default = null): mixed
    {
        return BusinessSetting::get($key, $default);
    }
}
