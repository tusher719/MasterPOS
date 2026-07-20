<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profit_distribution_items', function (Blueprint $table) {
            // Stores the cost return portion separately from profit share.
            // Only populated for product-based partner items.
            // NULL = legacy item created before Gap 4.2 (not retroactively updated).
            // share_amount remains the total (cost_return + profit_share) for backward compat.
            $table->decimal('cost_return_amount', 10, 2)
                ->nullable()
                ->default(0)
                ->after('share_amount');
        });
    }

    public function down(): void
    {
        Schema::table('profit_distribution_items', function (Blueprint $table) {
            $table->dropColumn('cost_return_amount');
        });
    }
};
