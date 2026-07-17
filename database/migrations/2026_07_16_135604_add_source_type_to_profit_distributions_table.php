<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profit_distributions', function (Blueprint $table) {
            $table->enum('source_type', ['investment_based', 'partner_based'])
                ->default('investment_based')
                ->after('distributable_amount');
        });
    }

    public function down(): void
    {
        Schema::table('profit_distributions', function (Blueprint $table) {
            $table->dropColumn('source_type');
        });
    }
};
