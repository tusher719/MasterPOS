<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_returns', function (Blueprint $table) {
            $table->id();

            $table->foreignId('purchase_id')
                ->constrained('purchases')
                ->restrictOnDelete();

            $table->date('return_date');

            $table->enum('return_type', ['supplier_return', 'damage_wastage']);

            // Human-readable reason for this return
            $table->text('reason');

            $table->text('note')->nullable();

            $table->enum('status', ['draft', 'confirmed'])->default('draft');

            // Total value of items being returned (sum of subtotals)
            $table->decimal('total_return_value', 10, 2)->default(0);

            // Filled when admin confirms the return
            $table->foreignId('confirmed_by')
                ->nullable()
                ->nullOnDelete()
                ->constrained('users');

            $table->timestamp('confirmed_at')->nullable();

            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Indexes for common filter queries
            $table->index('status');
            $table->index('return_type');
            $table->index('return_date');
            $table->index('purchase_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_returns');
    }
};
