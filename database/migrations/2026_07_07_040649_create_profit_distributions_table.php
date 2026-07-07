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
        Schema::create('profit_distributions', function (Blueprint $table) {
            $table->id();

            // Identity
            $table->string('distribution_no')->unique();
            $table->string('title');
            $table->date('distribution_date');

            // Period
            $table->date('period_start');
            $table->date('period_end');

            // Financial snapshots — never recalculated after creation
            $table->decimal('total_revenue', 10, 2)->default(0);
            $table->decimal('total_cogs', 10, 2)->default(0);
            $table->decimal('total_expenses', 10, 2)->default(0);
            $table->decimal('total_investment', 10, 2)->default(0);
            $table->decimal('gross_profit', 10, 2)->default(0);
            $table->decimal('net_profit', 10, 2)->default(0);

            // Distribution config
            $table->decimal('distribution_percent', 5, 2)->default(100.00);
            $table->decimal('distributable_amount', 10, 2)->default(0);

            // Status & lock
            $table->enum('status', ['draft', 'approved', 'distributed'])->default('draft');
            $table->boolean('is_locked')->default(false);

            // Notes
            $table->text('note')->nullable();

            // Audit — approve
            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            // Audit — distribute
            $table->foreignId('distributed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('distributed_at')->nullable();

            // Audit — create/update
            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();
            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profit_distributions');
    }
};
