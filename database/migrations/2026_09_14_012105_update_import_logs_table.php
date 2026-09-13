<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('import_logs', function (Blueprint $table) {
            // 'import' or 'export' — default import for existing rows
            $table->enum('type', ['import', 'export'])->default('import')->after('module');

            // xlsx / csv — only for export rows
            $table->string('format', 10)->nullable()->after('type');

            // JSON — per-row dry-run results, stored on commit for history preview
            $table->longText('row_results')->nullable()->after('failed_rows');
        });
    }

    public function down(): void
    {
        Schema::table('import_logs', function (Blueprint $table) {
            $table->dropColumn(['type', 'format', 'row_results']);
        });
    }
};
