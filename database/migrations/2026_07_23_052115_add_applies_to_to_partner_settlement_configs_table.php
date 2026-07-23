<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partner_settlement_configs', function (Blueprint $table) {
            $table->enum('applies_to', ['capital', 'working', 'product', 'all'])
                  ->default('all')
                  ->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('partner_settlement_configs', function (Blueprint $table) {
            $table->dropColumn('applies_to');
        });
    }
};
