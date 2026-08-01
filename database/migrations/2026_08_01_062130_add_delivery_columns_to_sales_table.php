<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->enum('delivery_type', [
                'store_pickup',
                'inside_dhaka',
                'outside_dhaka',
                'parallel',
            ])->nullable()->after('payment_type');

            $table->decimal('delivery_charge', 10, 2)->nullable()->default(0)->after('delivery_type');
            $table->boolean('delivery_charge_free')->default(false)->after('delivery_charge');
            $table->text('delivery_address')->nullable()->after('delivery_charge_free');
            $table->string('delivery_contact_phone')->nullable()->after('delivery_address');

            $table->enum('delivery_status', [
                'pending',
                'dispatched',
                'delivered',
                'failed',
            ])->nullable()->after('delivery_contact_phone');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'delivery_type',
                'delivery_charge',
                'delivery_charge_free',
                'delivery_address',
                'delivery_contact_phone',
                'delivery_status',
            ]);
        });
    }
};
