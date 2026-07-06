<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step13PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'investment.view',
            'investment.create',
            'investment.edit',
            'investment.delete',
            'investment.restore',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $admin = Role::findByName('Admin', 'web');
        $admin->givePermissionTo($permissions);

        $staff = Role::findByName('Staff', 'web');
        $staff->givePermissionTo([
            'investment.view',
        ]);

        $this->command->info('Step 13 permissions seeded successfully.');
    }
}
