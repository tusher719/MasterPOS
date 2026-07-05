<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step09PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'sale.view',
            'sale.create',
            'sale.delete',
            'sale.restore',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
        }

        $admin = Role::findByName('Admin');
        $admin->givePermissionTo($permissions);

        $staff = Role::findByName('Staff');
        $staff->givePermissionTo([
            'sale.view',
            'sale.create',
        ]);
    }
}

