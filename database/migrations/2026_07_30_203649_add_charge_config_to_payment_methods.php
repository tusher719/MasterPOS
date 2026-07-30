<?php
// database/migrations/2026_07_31_000001_add_charge_config_to_payment_methods.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->enum('online_charge_type', ['percent', 'fixed'])
                  ->nullable()
                  ->after('sort_order');
            $table->decimal('online_charge_value', 10, 2)
                  ->default(0)
                  ->after('online_charge_type');
            $table->boolean('charge_enabled')
                  ->default(false)
                  ->after('online_charge_value');
            $table->string('charge_label')
                  ->nullable()
                  ->after('charge_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn([
                'online_charge_type',
                'online_charge_value',
                'charge_enabled',
                'charge_label',
            ]);
        });
    }
};
