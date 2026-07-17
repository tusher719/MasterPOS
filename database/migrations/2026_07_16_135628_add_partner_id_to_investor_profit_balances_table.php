<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('investor_profit_balances', function (Blueprint $table) {
            $table->foreignId('partner_id')
                ->nullable()
                ->nullOnDelete()
                ->constrained('partners')
                ->after('investor_name');
        });
    }

    public function down(): void
    {
        Schema::table('investor_profit_balances', function (Blueprint $table) {
            $table->dropForeign(['partner_id']);
            $table->dropColumn('partner_id');
        });
    }
};
