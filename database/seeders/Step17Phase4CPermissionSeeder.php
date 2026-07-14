<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step17Phase4CPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'eligibility.view',
            'eligibility.create',
            'eligibility.pause',
            'eligibility.resume',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
        }

        // Admin gets all eligibility permissions
        $admin = Role::findByName('Admin');
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        // Staff gets view only
        $staff = Role::findByName('Staff');
        if ($staff) {
            $staff->givePermissionTo('eligibility.view');
        }

        $this->command->info('Step 17 Phase 4C permissions seeded successfully.');
        $this->command->table(
            ['Permission', 'Admin', 'Staff'],
            collect($permissions)->map(fn($p) => [
                $p,
                '✅',
                $p === 'eligibility.view' ? '✅' : '❌',
            ])->toArray()
        );
    }
}
