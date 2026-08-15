<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('courier_provider')->nullable()->after('delivery_status');
            $table->string('courier_tracking_id')->nullable()->after('courier_provider');
            $table->enum('courier_status', [
                'pending',
                'picked_up',
                'in_transit',
                'delivered',
                'returned',
                'walk_in',
            ])->nullable()->after('courier_tracking_id');
            $table->string('courier_note')->nullable()->after('courier_status');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'courier_provider',
                'courier_tracking_id',
                'courier_status',
                'courier_note',
            ]);
        });
    }
};
