<?php
// database/seeders/Step04PermissionSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step04PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'product_category.view', 'product_category.create',
            'product_category.edit', 'product_category.delete',

            'unit.view', 'unit.create', 'unit.edit', 'unit.delete',

            'product.view', 'product.create', 'product.edit', 'product.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Give Admin all new permissions
        $admin = Role::where('name', 'Admin')->first();
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        // Staff gets view-only
        $staff = Role::where('name', 'Staff')->first();
        if ($staff) {
            $staff->givePermissionTo([
                'product_category.view',
                'unit.view',
                'product.view',
            ]);
        }
    }
}
