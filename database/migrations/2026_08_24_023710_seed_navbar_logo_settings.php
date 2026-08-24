<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $keys = [
            [
                'key'        => 'logo_type',
                'value'      => 'text',
                'group'      => 'business',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key'        => 'logo_image_path',
                'value'      => null,
                'group'      => 'business',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key'   => 'logo_text_segments',
                'value' => json_encode([
                    ['text' => 'Master', 'color' => '#4f46e5'],
                    ['text' => 'POS',    'color' => '#ef4444'],
                ]),
                'group'      => 'business',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($keys as $row) {
            DB::table('business_settings')->insertOrIgnore($row);
        }

        // If a logo was already uploaded under the old 'business_logo' key,
        // copy that path into the new 'logo_image_path' key so nothing is lost.
        $oldLogo = DB::table('business_settings')
            ->where('key', 'business_logo')
            ->value('value');

        if ($oldLogo) {
            DB::table('business_settings')
                ->where('key', 'logo_image_path')
                ->update(['value' => $oldLogo, 'updated_at' => $now]);

            // Also flip logo_type to 'image' so the navbar shows the existing logo immediately.
            DB::table('business_settings')
                ->where('key', 'logo_type')
                ->update(['value' => 'image', 'updated_at' => $now]);
        }
    }

    public function down(): void
    {
        DB::table('business_settings')
            ->whereIn('key', ['logo_type', 'logo_image_path', 'logo_text_segments'])
            ->delete();
    }
};
