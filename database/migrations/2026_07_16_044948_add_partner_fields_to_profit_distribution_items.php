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
        Schema::table('profit_distribution_items', function (Blueprint $table) {
            // Phase 4H columns — nullable for backward compatibility
            $table->foreignId('partner_id')
                  ->nullable()
                  ->nullOnDelete()
                  ->constrained('partners')
                  ->after('investment_id');

            $table->foreignId('profit_rule_id')
                  ->nullable()
                  ->nullOnDelete()
                  ->constrained('partner_profit_rules')
                  ->after('partner_id');

            $table->json('profit_rule_snapshot')
                  ->nullable()
                  ->after('profit_rule_id');

            $table->enum('settlement_type', [
                'profit_only',
                'cost_plus_profit',
                'custom',
            ])->nullable()->after('profit_rule_snapshot');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profit_distribution_items', function (Blueprint $table) {
            $table->dropForeign(['partner_id']);
            $table->dropForeign(['profit_rule_id']);
            $table->dropColumn([
                'partner_id',
                'profit_rule_id',
                'profit_rule_snapshot',
                'settlement_type',
            ]);
        });
    }
};
