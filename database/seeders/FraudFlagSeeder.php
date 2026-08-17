<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class FraudFlagSeeder extends Seeder
{
    public function run(): void
    {
        // ── Permissions ───────────────────────────────────────────────────────
        $permissions = [
            'fraud.flag',   // create manual fraud flags, view all flags
            'fraud.review', // confirm or clear any fraud flag
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // ── Super Admin — gets all permissions via Gate::before() bypass ──────
        // No explicit assignment needed.

        // ── Admin — gets both permissions ─────────────────────────────────────
        $admin = Role::findByName('Admin', 'web');
        $admin->givePermissionTo(['fraud.flag', 'fraud.review']);

        // ── Fraud Manager — new role ──────────────────────────────────────────
        $fraudManager = Role::firstOrCreate(
            ['name' => 'Fraud Manager', 'guard_name' => 'web']
        );
        $fraudManager->givePermissionTo(['fraud.flag', 'fraud.review']);

        // ── Staff — no fraud permissions ──────────────────────────────────────
        // Staff can see flagged customers indirectly via Layer 1/2/3 block popup
        // but cannot create or review flags manually.
    }
}
