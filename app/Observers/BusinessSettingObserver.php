<?php

namespace App\Observers;

use App\Models\BusinessSetting;
use App\Services\SettingsService;

class BusinessSettingObserver
{
    /**
     * Invalidate cache whenever a setting is created or updated.
     */
    public function saved(BusinessSetting $businessSetting): void
    {
        SettingsService::invalidate();
    }

    /**
     * Invalidate cache when a setting is deleted.
     */
    public function deleted(BusinessSetting $businessSetting): void
    {
        SettingsService::invalidate();
    }
}
