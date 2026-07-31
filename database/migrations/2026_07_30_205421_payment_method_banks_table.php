<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_method_banks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('payment_method_id')
                  ->constrained('payment_methods')
                  ->restrictOnDelete();

            $table->string('bank_name');
            $table->string('account_number')->nullable();
            $table->string('account_name')->nullable();

            $table->enum('charge_type', ['percent', 'fixed'])->nullable();
            $table->decimal('charge_value', 10, 2)->default(0);
            $table->boolean('charge_enabled')->default(false);
            $table->string('charge_label')->nullable();

            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_method_banks');
    }
};
