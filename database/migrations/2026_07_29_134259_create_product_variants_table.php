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
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();
            $table->string('sku')->unique();
            $table->json('attributes'); // {"color":"Red","size":"XL"}
            $table->decimal('stock_qty', 10, 2)->default(0);
            $table->decimal('price_override', 10, 2)->nullable();
            $table->decimal('cost_price_override', 10, 2)->nullable();
            $table->unsignedBigInteger('image_id')->nullable(); // FK to product_images
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('product_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
