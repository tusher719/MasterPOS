<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class Step17Phase4GPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'fund_usage.view',
            'fund_usage.create',
            'fund_usage.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin gets all permissions
        $admin = Role::findByName('Admin', 'web');
        $admin->givePermissionTo($permissions);

        // Staff gets view only
        $staff = Role::findByName('Staff', 'web');
        $staff->givePermissionTo(['fund_usage.view']);
    }
}
