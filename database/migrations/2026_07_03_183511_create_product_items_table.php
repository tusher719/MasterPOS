<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Last purchase price — updated every time a purchase is received
            $table->decimal('last_purchase_price', 10, 2)
                ->nullable()
                ->after('cost_price');

            // Weighted average cost — used for COGS calculation in reports (Step 15/16)
            // Formula: (current_stock × current_avg_cost + qty × unit_cost) / (current_stock + qty)
            $table->decimal('average_cost', 10, 2)
                ->default(0)
                ->after('last_purchase_price');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['last_purchase_price', 'average_cost']);
        });
    }
};
