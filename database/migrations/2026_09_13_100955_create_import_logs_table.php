<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('import_logs', function (Blueprint $table) {
            $table->id();
            $table->string('module');                          // products, customers, etc.
            $table->string('filename');                        // original uploaded filename
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('imported_rows')->default(0);
            $table->unsignedInteger('skipped_rows')->default(0);
            $table->unsignedInteger('failed_rows')->default(0);
            $table->enum('status', ['completed', 'partial', 'failed'])->default('completed');
            $table->foreignId('imported_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['module', 'created_at']);
            $table->index('imported_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_logs');
    }
};
