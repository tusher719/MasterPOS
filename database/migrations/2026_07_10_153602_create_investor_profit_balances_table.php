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
        Schema::create('investor_profit_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('investment_id')
                  ->constrained('investments')
                  ->restrictOnDelete();
            $table->string('investor_name');
            $table->decimal('total_earned', 10, 2)->default(0);
            $table->decimal('total_paid', 10, 2)->default(0);
            $table->decimal('total_deferred', 10, 2)->default(0);
            $table->decimal('total_reinvested', 10, 2)->default(0);
            $table->decimal('pending_balance', 10, 2)->default(0);
            $table->timestamps();

            $table->unique('investment_id');
            $table->index('investment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investor_profit_balances');
    }
};
