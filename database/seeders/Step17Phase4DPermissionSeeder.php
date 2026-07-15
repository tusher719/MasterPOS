<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step17Phase4DPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'settlement_config.view',
            'settlement_config.create',
            'settlement_config.edit',
            'settlement_config.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin gets all permissions
        $admin = Role::findByName('Admin', 'web');
        $admin->givePermissionTo($permissions);

        // Staff gets view only
        $staff = Role::findByName('Staff', 'web');
        $staff->givePermissionTo([
            'settlement_config.view',
        ]);
    }
}
