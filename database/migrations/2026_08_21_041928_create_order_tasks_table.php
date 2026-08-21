<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_tasks', function (Blueprint $table) {
            $table->id();

            // Snapshot fields — stored at task creation time
            $table->string('title');
            $table->string('customer_name_snapshot');
            $table->string('customer_phone_snapshot')->nullable();

            // Task metadata
            $table->enum('source', ['facebook', 'instagram', 'whatsapp', 'phone', 'website', 'other']);
            $table->enum('priority', ['urgent', 'normal', 'flexible'])->default('normal');
            $table->date('due_date')->nullable();
            $table->text('note')->nullable();

            // Assignment — admin assigns OR task is open for any moderator to claim
            $table->enum('assignment_type', ['assigned', 'open'])->default('open');
            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Claim — atomic, guarded by lockForUpdate()
            $table->foreignId('claimed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('claimed_at')->nullable();

            // Status flow: pending → claimed → in_progress → ready → converted_to_sale / cancelled
            $table->enum('status', [
                'pending',
                'claimed',
                'in_progress',
                'ready',
                'converted_to_sale',
                'cancelled',
            ])->default('pending');

            // Sale conversion — filled when task is converted to a sale
            $table->foreignId('linked_sale_id')
                ->nullable()
                ->constrained('sales')
                ->nullOnDelete();

            // Audit fields
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('started_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes for common filter queries
            $table->index('status');
            $table->index('priority');
            $table->index('source');
            $table->index('assignment_type');
            $table->index('assigned_to');
            $table->index('claimed_by');
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_tasks');
    }
};
