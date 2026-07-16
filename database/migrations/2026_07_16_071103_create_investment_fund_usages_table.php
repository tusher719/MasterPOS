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
        Schema::create('investment_fund_usages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('capital_ledger_entry_id')
                ->constrained('capital_ledger_entries')
                ->restrictOnDelete();

            $table->foreignId('partner_id')
                ->nullable()
                ->constrained('partners')
                ->nullOnDelete();

            $table->string('usable_type'); // 'purchase' | 'expense'
            $table->unsignedBigInteger('usable_id');
 
            $table->decimal('amount', 10, 2);
            $table->text('note')->nullable();

            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->timestamps();

            // Indexes
            $table->index(['usable_type', 'usable_id']);
            $table->index('capital_ledger_entry_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investment_fund_usages');
    }
};
