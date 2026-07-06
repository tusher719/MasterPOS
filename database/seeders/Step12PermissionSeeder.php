<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step12PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'expense.view',
            'expense.create',
            'expense.edit',
            'expense.delete',
            'expense.restore',
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
        }

        // Admin — all permissions
        $admin = Role::findByName('Admin');
        $admin->givePermissionTo($permissions);

        // Staff — view + create only
        $staff = Role::findByName('Staff');
        $staff->givePermissionTo([
            'expense.view',
            'expense.create',
        ]);
    }
}
