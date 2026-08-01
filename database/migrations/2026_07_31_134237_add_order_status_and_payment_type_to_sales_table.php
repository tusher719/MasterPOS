<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->enum('order_status', [
                'processing',
                'confirmed',
                'out_for_delivery',
                'delivered',
                'cancelled',
                'returned',
            ])->default('processing')->after('payment_status');

            $table->enum('payment_type', [
                'full_paid',
                'half_paid',
                'cash_on_delivery',
            ])->nullable()->after('order_status');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['order_status', 'payment_type']);
        });
    }
};
