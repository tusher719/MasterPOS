<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class OrderTaskSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'order_task.view',
            'order_task.create',
            'order_task.assign',
            'order_task.claim',
            'order_task.complete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
        }

        // Admin gets all permissions
        $admin = Role::firstOrCreate(
            ['name' => 'Admin'],
            ['guard_name' => 'web']
        );
        $admin->givePermissionTo($permissions);

        // Moderator role — can claim and complete, cannot assign
        $moderator = Role::firstOrCreate(
            ['name' => 'Moderator'],
            ['guard_name' => 'web']
        );
        $moderator->givePermissionTo([
            'order_task.view',
            'order_task.claim',
            'order_task.complete',
        ]);

        // Staff gets view only
        $staff = Role::firstOrCreate(
            ['name' => 'Staff'],
            ['guard_name' => 'web']
        );
        $staff->givePermissionTo('order_task.view');
    }
}
