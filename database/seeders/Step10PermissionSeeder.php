<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step10PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'invoice.view',
            'invoice.print',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $admin = Role::findByName('Admin', 'web');
        $staff = Role::findByName('Staff', 'web');

        // Admin gets all invoice permissions
        $admin->givePermissionTo([
            'invoice.view',
            'invoice.print',
        ]);

        // Staff gets view only
        $staff->givePermissionTo([
            'invoice.view',
        ]);

        $this->command->info('Step10PermissionSeeder: invoice permissions seeded successfully.');
    }
}
