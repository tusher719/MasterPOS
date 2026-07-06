<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no')->unique();
            $table->string('title');
            $table->foreignId('expense_category_id')
                  ->constrained('expense_categories')
                  ->restrictOnDelete();
            $table->foreignId('payment_method_id')
                  ->nullable()
                  ->nullOnDelete()
                  ->constrained('payment_methods');
            $table->decimal('amount', 10, 2);
            $table->date('expense_date');
            $table->string('reference')->nullable();
            $table->string('attachment')->nullable();
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
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
