<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_planning_task_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('product_planning_tasks')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->text('note')->nullable();
            $table->enum('status', ['pending', 'ready', 'cancelled'])->default('pending');
            $table->timestamps();

            $table->index('task_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_planning_task_items');
    }
};
