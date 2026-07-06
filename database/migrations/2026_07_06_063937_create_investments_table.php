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
        Schema::create('investments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('investment_type_id')
                  ->constrained('investment_types')
                  ->restrictOnDelete();
            $table->string('title');
            $table->string('investor_name');
            $table->decimal('amount', 10, 2);
            $table->date('investment_date');
            $table->string('reference')->nullable();
            $table->string('attachment')->nullable();
            $table->text('note')->nullable();
            $table->enum('status', ['active', 'withdrawn'])->default('active');
            $table->foreignId('created_by')
                  ->constrained('users')
                  ->restrictOnDelete();
            $table->foreignId('updated_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investments');
    }
};
