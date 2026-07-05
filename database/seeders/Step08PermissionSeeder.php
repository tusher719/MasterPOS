<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step08PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'customer.view',
            'customer.create',
            'customer.edit',
            'customer.delete',
            'customer.restore',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin gets all
        $admin = Role::findByName('Admin');
        $admin->givePermissionTo($permissions);

        // Staff gets view only
        $staff = Role::findByName('Staff');
        $staff->givePermissionTo(['customer.view']);
    }
}
