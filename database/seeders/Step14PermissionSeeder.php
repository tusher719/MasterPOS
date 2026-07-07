<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class Step14PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'profit_distribution.view',
            'profit_distribution.create',
            'profit_distribution.edit',
            'profit_distribution.delete',
            'profit_distribution.restore',
            'profit_distribution.approve',
        ];

        // Create permissions if they don't exist
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin gets all permissions
        $admin = Role::findByName('Admin', 'web');
        $admin->givePermissionTo($permissions);

        // Staff gets view only
        $staff = Role::findByName('Staff', 'web');
        $staff->givePermissionTo([
            'profit_distribution.view',
        ]);
    }
}
