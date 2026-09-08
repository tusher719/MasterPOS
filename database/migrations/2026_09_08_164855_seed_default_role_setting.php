<?php
// database/migrations/2026_09_08_164855_seed_default_role_setting.php

use App\Models\BusinessSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Seed the default_registration_role_id key.
        // Value starts as null — admin picks a role from Settings → Staff & Roles tab.
        BusinessSetting::updateOrInsert(
            ['key' => 'default_registration_role_id'],
            ['value' => null, 'group' => 'staff']
        );
    }

    public function down(): void
    {
        BusinessSetting::where('key', 'default_registration_role_id')->delete();
    }
};
