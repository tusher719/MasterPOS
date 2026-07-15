<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step17Phase4EPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'product_assignment.view',
            'product_assignment.create',
            'product_assignment.edit',
            'product_assignment.approve',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $admin = Role::findByName('Admin', 'web');
        $staff = Role::findByName('Staff', 'web');

        // Admin gets all permissions
        $admin->givePermissionTo($permissions);

        // Staff gets view only
        $staff->givePermissionTo([
            'product_assignment.view',
        ]);
    }
}
