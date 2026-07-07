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
        Schema::create('profit_distribution_items', function (Blueprint $table) {
            $table->id();

            // Parent
            $table->foreignId('profit_distribution_id')
                ->constrained('profit_distributions')
                ->cascadeOnDelete();

            // Investment FK — preserved for ledger JOIN; source record may be soft-deleted
            $table->foreignId('investment_id')
                ->constrained('investments')
                ->restrictOnDelete();

            // Investor / investment snapshots — written once, never updated from source
            $table->string('investor_name');
            $table->string('investment_title');
            $table->string('investment_type');
            $table->decimal('invested_amount', 10, 2);

            // Calculated snapshots
            $table->decimal('share_percent', 8, 4);
            $table->decimal('share_amount', 10, 2);

            // Payment tracking
            $table->enum('payment_status', ['pending', 'paid', 'cancelled'])->default('pending');
            $table->string('payment_method')->nullable();
            $table->string('transaction_reference')->nullable();

            // Audit — payment
            $table->foreignId('paid_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('paid_at')->nullable();

            // Notes
            $table->text('note')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profit_distribution_items');
    }
};
