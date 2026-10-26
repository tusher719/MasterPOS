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
        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('label', 50)->default('Home'); // Home, Office, Other
            $table->string('recipient_name', 150);
            $table->string('recipient_phone', 30);
            $table->text('address');
            $table->string('city', 100)->nullable()->default('Dhaka');
            $table->string('delivery_type', 30)->default('inside_dhaka'); // inside_dhaka, outside_dhaka, store_pickup
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index(['customer_id', 'is_default']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_addresses');
    }
};
