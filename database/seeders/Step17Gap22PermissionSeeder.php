<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step17Gap22PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create new permission
        $approve = Permission::firstOrCreate(
            ['name' => 'settlement_config.approve', 'guard_name' => 'web']
        );

        // Admin gets approve permission
        $admin = Role::findByName('Admin', 'web');
        $admin->givePermissionTo($approve);

        // Staff does NOT get approve — Super Admin only via Gate::before() bypass
    }
}
