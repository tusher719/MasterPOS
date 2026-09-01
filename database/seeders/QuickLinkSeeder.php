<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class QuickLinkSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'quick_link.view',
            'quick_link.create',
            'quick_link.edit',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin gets all 3
        $admin = Role::where('name', 'Admin')->first();
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        // Staff gets view only
        $staff = Role::where('name', 'Staff')->first();
        if ($staff) {
            $staff->givePermissionTo('quick_link.view');
        }

        // Moderator gets view only (if role exists)
        $moderator = Role::where('name', 'Moderator')->first();
        if ($moderator) {
            $moderator->givePermissionTo('quick_link.view');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
