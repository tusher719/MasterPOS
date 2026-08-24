<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ProductPlanningTaskSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'product_task.view',
            'product_task.create',
            'product_task.edit',
            'product_task.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin gets all permissions
        $admin = Role::where('name', 'Admin')->first();
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        // Staff gets view only
        $staff = Role::where('name', 'Staff')->first();
        if ($staff) {
            $staff->givePermissionTo('product_task.view');
        }

        // Moderator gets view + create + edit (can manage tasks but not delete)
        $moderator = Role::where('name', 'Moderator')->first();
        if ($moderator) {
            $moderator->givePermissionTo([
                'product_task.view',
                'product_task.create',
                'product_task.edit',
            ]);
        }
    }
}
