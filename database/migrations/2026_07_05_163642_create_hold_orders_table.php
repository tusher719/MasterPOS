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
        Schema::create('hold_orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no')->unique();
            $table->foreignId('customer_id')
                    ->nullable()
                    ->nullOnDelete()
                    ->constrained('customers');
            $table->text('note')->nullable();
            $table->enum('status', ['active', 'processing'])->default('active');
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('grand_total', 10, 2)->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('created_by')
                    ->constrained('users')
                    ->restrictOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hold_orders');
    }
};
