<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PurchaseReturnSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'purchase_return.view',
            'purchase_return.create',
            'purchase_return.confirm',
            'purchase_return.delete',
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
            $staff->givePermissionTo('purchase_return.view');
        }

        // Clear cached permissions so changes take effect immediately
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
