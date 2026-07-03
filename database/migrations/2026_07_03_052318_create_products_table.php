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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            // --- Core identity ---
            $table->string('name');
            $table->string('sku')->unique();
            $table->string('barcode')->nullable()->unique();

            // --- Relations ---
            $table->foreignId('category_id')
                  ->nullable()
                  ->constrained('product_categories')
                  ->nullOnDelete();
            $table->foreignId('unit_id')
                  ->nullable()
                  ->constrained('units')
                  ->nullOnDelete();

            // --- Pricing ---
            $table->decimal('cost_price', 10, 2)->default(0.00);
            $table->decimal('sale_price', 10, 2)->default(0.00);

            // --- Tax (nullable — Step-03 tax settings hook) ---
            $table->boolean('is_taxable')->default(false)->nullable();
            $table->string('tax_id')->nullable(); // future: FK to tax table

            // --- Discount (nullable — future product-level discount) ---
            $table->enum('discount_type', ['flat', 'percentage'])->nullable();
            $table->decimal('discount_value', 10, 2)->nullable();

            // --- Stock ---
            $table->decimal('stock_qty', 10, 2)->default(0.00);
            $table->decimal('low_stock_threshold', 10, 2)->default(5.00);
            $table->decimal('min_sale_qty', 10, 2)->default(1.00)->nullable();

            // --- Variants (nullable — future variant system) ---
            $table->boolean('has_variants')->default(false)->nullable();

            // --- Shipping (nullable — future delivery module) ---
            $table->decimal('weight', 8, 3)->nullable();
            $table->string('weight_unit', 10)->nullable(); // kg, g, lb

            // --- POS UI ---
            $table->boolean('is_featured')->default(false)->nullable();
            $table->tinyInteger('sort_order')->default(0)->nullable();

            // --- SEO / E-commerce (nullable — future online store) ---
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();

            // --- Description & status ---
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);

            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
