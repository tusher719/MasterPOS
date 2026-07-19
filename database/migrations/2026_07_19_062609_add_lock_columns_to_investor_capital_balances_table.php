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
        Schema::table('investor_capital_balances', function (Blueprint $table) {
            $table->decimal('unlocked_amount', 10, 2)->default(0)->after('current_balance');
            $table->decimal('locked_amount', 10, 2)->default(0)->after('unlocked_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('investor_capital_balances', function (Blueprint $table) {
            $table->dropColumn(['unlocked_amount', 'locked_amount']);
        });
    }
};
