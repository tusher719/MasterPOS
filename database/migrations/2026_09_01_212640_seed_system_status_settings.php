<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            [
                'key'   => 'maintenance_mode_enabled',
                'value' => 'false',
            ],
            [
                'key'   => 'maintenance_message',
                'value' => 'We are currently performing scheduled maintenance. We will be back shortly.',
            ],
            [
                'key'   => 'coming_soon_mode_enabled',
                'value' => 'false',
            ],
            [
                'key'   => 'coming_soon_message',
                'value' => 'Our website is coming soon. Stay tuned!',
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('business_settings')->updateOrInsert(
                ['key' => $setting['key']],
                ['value' => $setting['value'], 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }

    public function down(): void
    {
        DB::table('business_settings')->whereIn('key', [
            'maintenance_mode_enabled',
            'maintenance_message',
            'coming_soon_mode_enabled',
            'coming_soon_message',
        ])->delete();
    }
};
