<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step06PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'supplier.view',
            'supplier.create',
            'supplier.edit',
            'supplier.delete',
            'supplier.restore',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin gets all supplier permissions
        $admin = Role::findByName('Admin', 'web');
        $admin->givePermissionTo($permissions);

        // Staff gets view only
        $staff = Role::findByName('Staff', 'web');
        $staff->givePermissionTo('supplier.view');
    }
}
