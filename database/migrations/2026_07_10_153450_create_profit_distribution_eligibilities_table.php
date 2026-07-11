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
        Schema::create('profit_distribution_eligibilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profit_distribution_id')
                  ->constrained('profit_distributions')
                  ->cascadeOnDelete();
            $table->foreignId('investment_id')
                  ->constrained('investments')
                  ->restrictOnDelete();
            $table->string('investor_name');
            $table->boolean('is_eligible')->default(true);
            $table->string('eligibility_reason')->nullable();
            $table->foreignId('override_by')
                  ->nullable()
                  ->nullOnDelete()
                  ->constrained('users');
            $table->timestamp('override_at')->nullable();
            $table->timestamps();

            $table->unique(['profit_distribution_id', 'investment_id'], 'eligibility_unique');
            $table->index('profit_distribution_id');
            $table->index('investment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profit_distribution_eligibilities');
    }
};
