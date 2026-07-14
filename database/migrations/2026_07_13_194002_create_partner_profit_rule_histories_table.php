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
        Schema::create('partner_profit_rule_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_profit_rule_id')
                ->constrained('partner_profit_rules')
                ->restrictOnDelete();
            $table->foreignId('changed_by')->constrained('users')->restrictOnDelete();
            $table->enum('change_type', ['created', 'updated', 'approved', 'deactivated']);
            $table->json('previous_value')->nullable();
            $table->json('new_value');
            $table->text('change_reason');
            $table->timestamps();

            $table->index('partner_profit_rule_id');
            $table->index('changed_by');
            $table->index('change_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_profit_rule_histories');
    }
};
