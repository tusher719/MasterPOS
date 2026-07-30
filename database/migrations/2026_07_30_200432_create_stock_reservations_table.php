<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_reservations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();

            $table->foreignId('variant_id')
                ->nullable()
                ->constrained('product_variants')
                ->nullOnDelete();

            $table->foreignId('sale_id')
                ->nullable()
                ->comment('Filled on conversion to real sale')
                ->constrained('sales')
                ->nullOnDelete();

            $table->decimal('quantity', 10, 2);
            $table->timestamp('reserved_until');

            $table->enum('status', ['active', 'converted', 'expired', 'released'])
                ->default('active');

            $table->timestamps();

            // Indexes for sweep job and availability queries
            $table->index(['product_id', 'status']);
            $table->index(['variant_id', 'status']);
            $table->index(['status', 'reserved_until']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_reservations');
    }
};
