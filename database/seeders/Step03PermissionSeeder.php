<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step03PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Settings
            'settings.view',
            'settings.edit',

            // Payment Methods
            'payment_method.view',
            'payment_method.create',
            'payment_method.edit',
            'payment_method.delete',

            // Expense Categories
            'expense_category.view',
            'expense_category.create',
            'expense_category.edit',
            'expense_category.delete',

            // Investment Types
            'investment_type.view',
            'investment_type.create',
            'investment_type.edit',
            'investment_type.delete',
        ];

        // Create permissions if they don't exist
        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name'       => $permission,
                'guard_name' => 'web',
            ]);
        }

        // Assign ALL permissions to Admin role
        $admin = Role::findByName('Admin', 'web');
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        // Assign only view permissions to Staff role
        $staff = Role::findByName('Staff', 'web');
        if ($staff) {
            $staff->givePermissionTo([
                'settings.view',
                'payment_method.view',
                'expense_category.view',
                'investment_type.view',
            ]);
        }
    }
}
