<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('business_settings')->insert([
            [
                'key'        => 'fraud_success_ratio_threshold',
                'value'      => '60',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key'        => 'fraud_min_orders_before_check',
                'value'      => '3',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        DB::table('business_settings')->whereIn('key', [
            'fraud_success_ratio_threshold',
            'fraud_min_orders_before_check',
        ])->delete();
    }
};
