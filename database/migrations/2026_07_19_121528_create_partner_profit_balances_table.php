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
        Schema::create('partner_profit_balances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('partner_id')
                ->unique()
                ->constrained('partners')
                ->restrictOnDelete();

            // Cost return tracking (product partner only)
            $table->decimal('total_cost_returned', 10, 2)->default(0);
            $table->decimal('total_cost_paid', 10, 2)->default(0);
            $table->decimal('pending_cost_balance', 10, 2)->default(0);

            // Profit share tracking (all partner types)
            $table->decimal('total_profit_earned', 10, 2)->default(0);
            $table->decimal('total_profit_paid', 10, 2)->default(0);
            $table->decimal('pending_profit_balance', 10, 2)->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_profit_balances');
    }
};
