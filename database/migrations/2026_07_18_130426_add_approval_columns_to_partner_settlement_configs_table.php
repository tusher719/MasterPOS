<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partner_settlement_configs', function (Blueprint $table) {
            $table->foreignId('approved_by')
                  ->nullable()
                  ->nullOnDelete()
                  ->constrained('users')
                  ->after('is_active');

            $table->timestamp('approved_at')
                  ->nullable()
                  ->after('approved_by');
        });

        // Auto-approve all existing active configs so live data is not broken.
        // Super Admin (id=1) is used as the approver for existing records.
        DB::table('partner_settlement_configs')
            ->whereNotNull('id')
            ->update([
                'approved_by' => 1,
                'approved_at' => now(),
            ]);
    }

    public function down(): void
    {
        Schema::table('partner_settlement_configs', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['approved_by', 'approved_at']);
        });
    }
};
