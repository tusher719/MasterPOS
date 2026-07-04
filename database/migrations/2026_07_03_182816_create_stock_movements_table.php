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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();$table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete(); // prevent product deletion if stock movements exist

            // Polymorphic reference — Purchase, Sale, Return, Adjustment, etc.
            $table->string('reference_type')->nullable(); // e.g. App\Models\Purchase
            $table->unsignedBigInteger('reference_id')->nullable(); // e.g. purchase_id

            $table->enum('type', [
                'purchase',
                'sale',
                'return',
                'adjustment',
                'transfer',
            ]);

            // Positive = stock IN, Negative = stock OUT
            $table->integer('quantity');

            // Snapshots before and after — for full audit trail
            $table->integer('before_quantity');
            $table->integer('after_quantity');

            $table->decimal('unit_cost', 10, 2)->nullable(); // cost at time of movement

            $table->text('note')->nullable();

            // Audit
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            // Index for fast lookup by product or reference
            $table->index(['reference_type', 'reference_id']);
            $table->index('product_id');
            $table->index('type');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
