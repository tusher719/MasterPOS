<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step17Phase4APermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'partners.view',
            'partners.create',
            'partners.edit',
            'partners.delete',
            'partners.restore',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin — all permissions
        $admin = Role::findByName('Admin', 'web');
        $admin->givePermissionTo($permissions);

        // Super Admin — handled globally via Gate::before()
        // No explicit permission assignment needed

        // Staff — view only
        $staff = Role::findByName('Staff', 'web');
        $staff->givePermissionTo([
            'partners.view',
        ]);
    }
}
