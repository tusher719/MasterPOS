<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profit_distribution_items', function (Blueprint $table) {
            // Per-investor distribution percentage override
            $table->decimal('distribution_percent', 5, 2)->default(100)->after('share_amount');

            // Deferred and reinvested amounts
            $table->decimal('deferred_amount', 10, 2)->default(0)->after('distribution_percent');
            $table->decimal('reinvested_amount', 10, 2)->default(0)->after('deferred_amount');

            // Link to source distribution if this item carries deferred profit forward
            $table->foreignId('carried_from_distribution_id')
                  ->nullable()
                  ->nullOnDelete()
                  ->constrained('profit_distributions')
                  ->after('reinvested_amount');

            // Extend existing payment_status enum — add partial, deferred, reinvested, reopened
            // Existing: pending, paid, cancelled
            // New:      pending, partial, paid, deferred, reinvested, cancelled, reopened
            $table->enum('payment_status', [
                'pending',
                'partial',
                'paid',
                'deferred',
                'reinvested',
                'cancelled',
                'reopened',
            ])->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('profit_distribution_items', function (Blueprint $table) {
            $table->dropForeign(['carried_from_distribution_id']);
            $table->dropColumn([
                'distribution_percent',
                'deferred_amount',
                'reinvested_amount',
                'carried_from_distribution_id',
            ]);

            // Revert enum to original 3 states
            $table->enum('payment_status', [
                'pending',
                'paid',
                'cancelled',
            ])->default('pending')->change();
        });
    }
};
