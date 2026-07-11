<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step17PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Clear permission cache before seeding
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'profit_distribution.eligibility',
            'profit_distribution.reverse',
            'profit_distribution.payment',
            'investor_balance.view',
        ];

        // Create permissions if they don't already exist
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
        }

        // Admin gets all new permissions
        $admin = Role::findByName('Admin', 'web');
        $admin->givePermissionTo($permissions);

        // Staff gets no new permissions for Step 17
        // (eligibility override, reverse, payment recording are admin-only)

        $this->command->info('Step 17 permissions seeded successfully.');
        $this->command->table(
            ['Permission', 'Admin', 'Staff'],
            collect($permissions)->map(fn ($p) => [
                $p,
                '✅',
                '❌',
            ])->toArray()
        );
    }
}
