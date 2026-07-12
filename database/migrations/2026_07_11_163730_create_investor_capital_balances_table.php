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
        Schema::create('investor_capital_balances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('investment_id')
                ->unique()
                ->constrained('investments')
                ->restrictOnDelete();

            $table->string('investor_name'); // denormalized for fast read

            $table->decimal('total_deposited', 10, 2)->default(0);
            $table->decimal('total_withdrawn', 10, 2)->default(0);
            $table->decimal('total_reinvested', 10, 2)->default(0);
            $table->decimal('total_adjusted', 10, 2)->default(0); // net of +/- adjustments

            $table->decimal('current_balance', 10, 2)->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investor_capital_balances');
    }
};
