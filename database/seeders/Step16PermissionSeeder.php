<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step16PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'report.view',
            'report.export',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $admin = Role::findByName('Admin', 'web');
        $staff = Role::findByName('Staff', 'web');

        $admin->givePermissionTo($permissions);
        $staff->givePermissionTo(['report.view']);
    }
}
