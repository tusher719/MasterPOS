<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * DEV-ONLY full database reset command.
 *
 * Usage:
 *   php artisan db:reset-dev              (asks for confirmation)
 *   php artisan db:reset-dev --force      (skips confirmation — CI use)
 *
 * This command ONLY runs in local environment.
 * There is intentionally NO equivalent UI button — Rule 1.5.
 *
 * What it does:
 *  1. Confirms we are in local environment
 *  2. Confirms with user (unless --force)
 *  3. Drops all tables (schema:fresh equivalent but without running migrations)
 *  4. Runs all migrations fresh
 *  5. Runs all seeders
 */
class ResetDatabaseCommand extends Command
{
    protected $signature = 'db:reset-dev
                            {--force : Skip confirmation prompt}';

    protected $description = '[DEV ONLY] Full database reset: drop → migrate:fresh → seed. Local environment only.';

    public function handle(): int
    {
        // ------------------------------------------------------------------ //
        // Guard: local environment only
        // ------------------------------------------------------------------ //
        if (! app()->isLocal()) {
            $this->error('This command can only run in the LOCAL environment.');
            $this->error('Current environment: ' . app()->environment());
            return self::FAILURE;
        }

        // ------------------------------------------------------------------ //
        // Warning block
        // ------------------------------------------------------------------ //
        $this->newLine();
        $this->line('  <bg=red;fg=white> ⚠  DEV RESET — DESTRUCTIVE OPERATION </bg=red;fg=white>');
        $this->newLine();
        $this->warn('  This will:');
        $this->line('    • Drop ALL tables in the current database');
        $this->line('    • Re-run ALL migrations from scratch');
        $this->line('    • Re-run ALL seeders');
        $this->newLine();
        $this->warn('  ALL data will be permanently deleted.');
        $this->newLine();

        // ------------------------------------------------------------------ //
        // Confirmation
        // ------------------------------------------------------------------ //
        if (! $this->option('force')) {
            $confirmed = $this->confirm(
                'Are you absolutely sure you want to reset the database?',
                false
            );

            if (! $confirmed) {
                $this->info('Reset cancelled.');
                return self::SUCCESS;
            }

            // Double-confirm: type the database name
            $dbName = DB::connection()->getDatabaseName();
            $typed  = $this->ask("Type the database name to confirm ({$dbName})");

            if ($typed !== $dbName) {
                $this->error('Database name does not match. Reset cancelled.');
                return self::FAILURE;
            }
        }

        // ------------------------------------------------------------------ //
        // Execute reset
        // ------------------------------------------------------------------ //
        $this->newLine();
        $this->info('Starting database reset...');

        try {
            // Disable FK checks so tables can be dropped in any order
            Schema::disableForeignKeyConstraints();

            $this->line('  → Dropping all tables...');
            $tables = DB::select('SHOW TABLES');
            foreach ($tables as $table) {
                $tableName = array_values((array) $table)[0];
                Schema::drop($tableName);
            }

            Schema::enableForeignKeyConstraints();
            $this->info('  ✓ All tables dropped.');

            // Fresh migrations
            $this->line('  → Running migrations...');
            $this->call('migrate', ['--force' => true]);
            $this->info('  ✓ Migrations complete.');

            // Seed
            $this->line('  → Running seeders...');
            $this->call('db:seed', ['--force' => true]);
            $this->info('  ✓ Seeding complete.');

            // Clear all caches
            $this->line('  → Clearing caches...');
            $this->call('cache:clear');
            $this->call('config:clear');
            $this->call('route:clear');
            $this->info('  ✓ Caches cleared.');

        } catch (\Throwable $e) {
            Schema::enableForeignKeyConstraints();
            $this->error('Reset failed: ' . $e->getMessage());
            $this->error('The database may be in an inconsistent state. Run migrations manually.');
            return self::FAILURE;
        }

        $this->newLine();
        $this->info('  ✓ Database reset complete.');
        $this->newLine();

        return self::SUCCESS;
    }
}
