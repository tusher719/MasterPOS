<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class Step17Phase4BPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'profit_rule.view',
            'profit_rule.create',
            'profit_rule.edit',
            'profit_rule.approve',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin: all permissions including approve
        $adminRole = Role::findByName('Admin', 'web');
        $adminRole->givePermissionTo([
            'profit_rule.view',
            'profit_rule.create',
            'profit_rule.edit',
            'profit_rule.approve',
        ]);

        // Staff: view only
        $staffRole = Role::findByName('Staff', 'web');
        $staffRole->givePermissionTo([
            'profit_rule.view',
        ]);



    }
}
