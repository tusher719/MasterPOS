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
        Schema::create('partner_profit_eligibilities', function (Blueprint $table) {
            $table->id();

            $table->foreignId('partner_id')
                ->constrained('partners')
                ->restrictOnDelete();

            $table->date('profit_start_date');
            $table->date('profit_end_date')->nullable();

            $table->enum('status', ['active', 'paused', 'ended'])->default('active');

            $table->text('pause_reason')->nullable();

            $table->foreignId('paused_by')
                ->nullable()
                ->nullOnDelete()
                ->constrained('users');
            $table->timestamp('paused_at')->nullable();

            $table->foreignId('resumed_by')
                ->nullable()
                ->nullOnDelete()
                ->constrained('users');
            $table->timestamp('resumed_at')->nullable();

            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->timestamps();

            $table->index('partner_id');
            $table->index('status');
            $table->index(['partner_id', 'status']);
            $table->index(['profit_start_date', 'profit_end_date'], 'ppe_date_range_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_profit_eligibilities');
    }
};
