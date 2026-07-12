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
        Schema::create('capital_ledger_entries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('investment_id')
                ->constrained('investments')
                ->restrictOnDelete();

            $table->string('investor_name'); // snapshot

            $table->enum('transaction_type', [
                'deposit',
                'withdrawal',
                'reinvestment',
                'adjustment',
            ]);

            $table->enum('direction', ['credit', 'debit']);

            $table->decimal('amount', 10, 2);
            $table->decimal('running_balance', 10, 2); // balance after this entry

            $table->string('reference_no')->unique()->nullable(); // CL-YYYYMMDD-XXXX

            // Polymorphic source (for reinvestment: ProfitDistributionItem)
            $table->string('source_type')->nullable();
            $table->unsignedBigInteger('source_id')->nullable();

            $table->text('reason')->nullable();  // mandatory for adjustment
            $table->text('note')->nullable();

            $table->enum('status', [
                'completed',  // deposit, reinvestment, approved withdrawal, adjustment
                'pending',    // withdrawal awaiting approval
                'approved',   // withdrawal approved (balance deducted at this point)
                'rejected',   // withdrawal rejected
                'cancelled',  // withdrawal cancelled before approval
            ])->default('completed');

            $table->foreignId('requested_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')->nullable();

            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->index(['investment_id', 'transaction_type']);
            $table->index(['source_type', 'source_id']);
            $table->index('status');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('capital_ledger_entries');
    }
};
