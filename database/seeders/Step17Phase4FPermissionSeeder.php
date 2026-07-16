<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class Step17Phase4FPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permission
        $permission = Permission::firstOrCreate(
            ['name' => 'profit_calculation.preview', 'guard_name' => 'web']
        );

        // Admin gets the permission
        $admin = Role::findByName('Admin', 'web');
        $admin->givePermissionTo($permission);
    }
}
