<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Modify the type enum to include bank_transfer
        DB::statement("
            ALTER TABLE `payment_methods`
            MODIFY COLUMN `type`
            ENUM('cash','card','mobile_banking','bank_transfer','other')
            NOT NULL DEFAULT 'cash'
        ");
    }

    public function down(): void
    {
        // Remove bank_transfer — existing rows with this value will error,
        // so only roll back on a clean dataset
        DB::statement("
            ALTER TABLE `payment_methods`
            MODIFY COLUMN `type`
            ENUM('cash','card','mobile_banking','other')
            NOT NULL DEFAULT 'cash'
        ");
    }
};
