<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pre_orders', function (Blueprint $table) {
            $table->id();

            // Customer link (nullable — walk-in customers have no account)
            $table->foreignId('customer_id')
                ->nullable()
                ->nullOnDelete()
                ->constrained('customers');

            // Snapshots — captured at creation time
            $table->string('customer_name_snapshot');
            $table->string('customer_phone_snapshot')->nullable();

            // Product link (nullable — generic booking with no specific product)
            $table->foreignId('product_id')
                ->nullable()
                ->nullOnDelete()
                ->constrained('products');

            $table->string('product_name_snapshot')->nullable(); // frozen product name

            // Dates
            $table->date('booking_date');
            $table->date('expected_delivery_date')->nullable();

            // Financials
            $table->decimal('total_amount', 10, 2);
            $table->decimal('advance_amount', 10, 2)->default(0);
            $table->decimal('due_amount', 10, 2);          // auto = total - advance

            // Advance payment details
            $table->string('advance_payment_method')->nullable();
            $table->string('advance_transaction_id')->nullable();
            $table->string('advance_payment_proof')->nullable(); // file path

            // Status
            $table->enum('status', [
                'pending',
                'confirmed',
                'ready',
                'delivered',
                'cancelled',
            ])->default('pending');

            // Conversion link — filled when converted to a Sale
            $table->foreignId('linked_sale_id')
                ->nullable()
                ->nullOnDelete()
                ->constrained('sales');

            $table->text('note')->nullable();

            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('updated_by')
                ->nullable()
                ->nullOnDelete()
                ->constrained('users');

            $table->timestamps();
            $table->softDeletes();

            // Indexes for common filter queries
            $table->index('status');
            $table->index('booking_date');
            $table->index('expected_delivery_date');
            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pre_orders');
    }
};
