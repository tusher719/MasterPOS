<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_return_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('purchase_return_id')
                ->constrained('purchase_returns')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();

            // Nullable — only set when the product has variants
            $table->foreignId('variant_id')
                ->nullable()
                ->nullOnDelete()
                ->constrained('product_variants');

            // Quantity being returned for this item
            $table->decimal('quantity', 10, 2);

            // Unit cost snapshot from the original purchase
            $table->decimal('unit_cost', 10, 2);

            // quantity × unit_cost
            $table->decimal('subtotal', 10, 2);

            // Optional per-item reason (damage description, defect note etc.)
            $table->text('reason_note')->nullable();

            $table->timestamps();

            $table->index('purchase_return_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_return_items');
    }
};
