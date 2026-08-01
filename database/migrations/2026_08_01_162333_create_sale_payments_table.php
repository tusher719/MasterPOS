<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sale_id')
                  ->constrained('sales')
                  ->cascadeOnDelete();

            $table->foreignId('payment_method_id')
                  ->nullable()
                  ->constrained('payment_methods')
                  ->nullOnDelete();

            $table->foreignId('payment_method_bank_id')
                  ->nullable()
                  ->constrained('payment_method_banks')
                  ->nullOnDelete();

            $table->decimal('amount', 10, 2);
            $table->decimal('payment_charge', 10, 2)->default(0);
            $table->date('payment_date');

            $table->string('reference')->nullable();
            $table->text('note')->nullable();
            $table->string('payment_proof_image')->nullable();

            $table->enum('payment_status_manual', [
                'pending_verification',
                'verified',
                'rejected',
            ])->default('verified');  // POS payments are verified immediately

            $table->string('transaction_id')->nullable();

            $table->foreignId('verified_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('verified_at')->nullable();

            $table->foreignId('created_by')
                  ->constrained('users')
                  ->restrictOnDelete();

            $table->timestamps();

            // ── Indexes ───────────────────────────────────────────
            $table->index('sale_id');
            $table->index('payment_date');
            $table->index('payment_status_manual');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_payments');
    }
};
