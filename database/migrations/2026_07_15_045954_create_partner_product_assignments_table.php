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
        Schema::create('partner_product_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->restrictOnDelete();
            $table->string('assignable_type')->default('product');
            $table->unsignedBigInteger('assignable_id');
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->boolean('cost_return_enabled')->default(true);
            $table->decimal('profit_share_percent', 8, 4);
            $table->boolean('is_active')->default(true);
            $table->foreignId('approved_by')->nullable()->nullOnDelete()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['assignable_type', 'assignable_id']);
            $table->index(['partner_id', 'effective_from']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_product_assignments');
    }
};
