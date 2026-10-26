<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class Step19StorefrontBannerPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'banners.view',
            'banners.create',
            'banners.edit',
            'banners.delete',
            'banners.restore',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin gets all permissions
        $admin = Role::where('name', 'Admin')->where('guard_name', 'web')->first();
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        // Staff gets view only
        $staff = Role::where('name', 'Staff')->where('guard_name', 'web')->first();
        if ($staff) {
            $staff->givePermissionTo(['banners.view']);
        }
    }
}
