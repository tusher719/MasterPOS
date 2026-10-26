<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class Step18CouponPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'coupons.view',
            'coupons.create',
            'coupons.edit',
            'coupons.delete',
            'coupons.restore',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin gets all permissions
        $admin = Role::findByName('Admin', 'web');
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        // Staff gets view only
        $staff = Role::findByName('Staff', 'web');
        if ($staff) {
            $staff->givePermissionTo(['coupons.view']);
        }
    }
}
