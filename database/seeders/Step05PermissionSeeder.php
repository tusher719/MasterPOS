<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step05PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'notification.view',
            'notification.delete',
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin gets all
        $admin = Role::where('name', 'Admin')->first();
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        // Staff gets view only
        $staff = Role::where('name', 'Staff')->first();
        if ($staff) {
            $staff->givePermissionTo(['notification.view']);
        }
    }
}
