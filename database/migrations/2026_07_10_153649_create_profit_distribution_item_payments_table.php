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
        Schema::create('profit_distribution_item_payments', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('profit_distribution_item_id');

            $table->foreign(
                'profit_distribution_item_id',
                'fk_pd_item_payment_item'
            )
            ->references('id')
            ->on('profit_distribution_items')
            ->cascadeOnDelete();

            $table->decimal('amount', 10, 2);

            $table->enum('payment_status', [
                'pending',
                'partial',
                'paid',
                'deferred',
                'reinvested',
                'cancelled',
                'reopened',
            ])->default('pending');

            $table->string('payment_method')->nullable();
            $table->string('transaction_reference')->nullable();
            $table->text('note')->nullable();

            $table->foreignId('paid_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('paid_at')->nullable();

            $table->timestamps();

            $table->index('profit_distribution_item_id', 'idx_pd_item_id');
            $table->index('payment_status', 'idx_pd_payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profit_distribution_item_payments');
    }
};
