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
        Schema::create('partner_profit_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->restrictOnDelete();
            $table->enum('rule_type', ['fixed_percent', 'product_based', 'capital_based', 'mixed']);
            $table->enum('profit_source', ['capital_share', 'working_share', 'product_share', 'custom']);
            $table->decimal('share_percent', 8, 4)->comment('Manually configured — never derived from capital amount');
            $table->date('effective_from');
            $table->date('effective_to')->nullable()->comment('Null means currently active');
            $table->boolean('is_active')->default(true);
            $table->string('reason')->nullable()->comment('Why this rule exists or changed');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index('partner_id');
            $table->index('effective_from');
            $table->index('approved_by');
            $table->index(['partner_id', 'effective_from']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_profi_rules');
    }
};
