<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fraud_flags', function (Blueprint $table) {
            $table->id();

            $table->foreignId('customer_id')
                  ->nullable()
                  ->nullOnDelete()
                  ->constrained('customers');

            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('full_name_snapshot');
            $table->text('address_snapshot')->nullable();

            $table->enum('reason', [
                'no_answer',
                'refused_delivery',
                'multiple_returns',
                'fake_order',
                'failed_validation',
                'ip_limit_exceeded',
                'low_success_ratio',
                'other',
            ]);

            $table->text('reason_note');

            $table->enum('trigger_type', [
                'manual',
                'auto_layer2',
                'auto_layer3',
            ]);

            $table->json('related_sale_ids')->nullable();

            $table->enum('status', [
                'pending_review',
                'confirmed_fraud',
                'cleared',
            ])->default('pending_review');

            // null = system-triggered
            $table->foreignId('flagged_by')
                  ->nullable()
                  ->nullOnDelete()
                  ->constrained('users');

            $table->timestamp('flagged_at');

            $table->foreignId('reviewed_by')
                  ->nullable()
                  ->nullOnDelete()
                  ->constrained('users');

            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();

            // Reserved for Phase 2 paid external API
            $table->json('external_fraud_check_response')->nullable();

            $table->timestamps();

            // Indexes for common lookups
            $table->index('phone');
            $table->index('email');
            $table->index('status');
            $table->index('trigger_type');
            $table->index('customer_id');
            $table->index('flagged_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fraud_flags');
    }
};
