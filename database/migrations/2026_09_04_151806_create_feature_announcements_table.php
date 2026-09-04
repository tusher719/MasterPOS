<?php
// database/migrations/2026_09_04_000001_create_feature_announcements_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feature_announcements', function (Blueprint $table) {
            $table->id();
            $table->string('label');                          // e.g. "Pre-Orders"
            $table->string('route_name');                     // sidebar nav route to match
            $table->enum('badge_type', ['new', 'hot', 'beta', 'custom'])->default('new');
            $table->string('badge_text')->nullable();         // used when badge_type = custom
            $table->date('show_until');                       // auto-expires after this date
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'show_until']);
            $table->index('route_name');
        });

        // Seed hot_product_order_threshold business setting
        DB::table('business_settings')->updateOrInsert(
            ['key' => 'hot_product_order_threshold'],
            ['value' => '10', 'updated_at' => now(), 'created_at' => now()]
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_announcements');

        DB::table('business_settings')
            ->where('key', 'hot_product_order_threshold')
            ->delete();
    }
};
