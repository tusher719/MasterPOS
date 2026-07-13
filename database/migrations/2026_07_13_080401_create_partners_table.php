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
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique()->nullable();
            $table->boolean('partner_type_capital')->default(false);
            $table->boolean('partner_type_working')->default(false);
            $table->boolean('partner_type_product')->default(false);
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->foreignId('user_id')
                ->nullable()
                ->nullOnDelete()
                ->constrained('users');
            $table->text('note')->nullable();
            $table->boolean('is_active')->default(true);
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partners');
    }
};
