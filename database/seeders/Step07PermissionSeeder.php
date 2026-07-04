<?php

// database/seeders/Step07PermissionSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step07PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ─── Define Permissions ───────────────────────────────────────────────

        $permissions = [
            'purchase.view',
            'purchase.create',
            'purchase.edit',
            'purchase.delete',
            'purchase.restore',
            'purchase.payment',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
        }

        // ─── Assign to Admin ──────────────────────────────────────────────────

        $admin = Role::findByName('Admin');
        $admin->givePermissionTo($permissions);

        // ─── Assign to Staff (view only) ──────────────────────────────────────

        $staff = Role::findByName('Staff');
        $staff->givePermissionTo([
            'purchase.view',
        ]);

        $this->command->info('Step 07 permissions seeded successfully.');
        $this->command->table(
            ['Permission', 'Admin', 'Staff'],
            collect($permissions)->map(fn($p) => [
                $p,
                '✅',
                in_array($p, ['purchase.view']) ? '✅' : '❌',
            ])->toArray()
        );
    }
}
