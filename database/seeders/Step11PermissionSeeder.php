<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step11PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'hold_order.view',
            'hold_order.create',
            'hold_order.edit',
            'hold_order.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
        }

        // Admin — all hold order permissions
        $admin = Role::findByName('Admin', 'web');
        $admin->givePermissionTo($permissions);

        // Staff — view + create + edit only (no delete)
        $staff = Role::findByName('Staff', 'web');
        $staff->givePermissionTo([
            'hold_order.view',
            'hold_order.create',
            'hold_order.edit',
        ]);
    }
}
