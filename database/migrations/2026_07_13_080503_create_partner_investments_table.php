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
        Schema::create('partner_investments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')
                ->constrained('partners')
                ->restrictOnDelete();
            $table->foreignId('investment_id')
                ->constrained('investments')
                ->restrictOnDelete();
            $table->boolean('is_primary')->default(true);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['partner_id', 'investment_id']);
            $table->index('partner_id');
            $table->index('investment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_investments');
    }
};
