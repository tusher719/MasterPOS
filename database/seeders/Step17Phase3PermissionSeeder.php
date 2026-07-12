<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step17Phase3PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'investor_statement.view',
            'investor_statement.export',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $admin = Role::where('name', 'Admin')->first();
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        // Staff gets no access — investor statements are Admin only
    }
}
