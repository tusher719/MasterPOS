<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partner_profit_eligibilities', function (Blueprint $table) {
            $table->enum('applies_to', ['capital', 'working', 'product', 'all'])
                  ->default('all')
                  ->after('profit_end_date');
        });
    }

    public function down(): void
    {
        Schema::table('partner_profit_eligibilities', function (Blueprint $table) {
            $table->dropColumn('applies_to');
        });
    }
};
