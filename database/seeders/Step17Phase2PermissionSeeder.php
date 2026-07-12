<?php

// database/seeders/Step17Phase2PermissionSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class Step17Phase2PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'capital_ledger.view',
            'capital_ledger.deposit',
            'capital_ledger.adjust',
            'capital_ledger.withdrawal.request',
            'capital_ledger.withdrawal.approve',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
        }

        // Admin gets all capital ledger permissions
        $admin = Role::where('name', 'Admin')->first();
        if ($admin) {
            $admin->givePermissionTo($permissions);
            $this->command->info('✓ Admin → all capital_ledger permissions assigned.');
        }

        // Staff gets view only
        $staff = Role::where('name', 'Staff')->first();
        if ($staff) {
            $staff->givePermissionTo('capital_ledger.view');
            $this->command->info('✓ Staff → capital_ledger.view assigned.');
        }

        $this->command->info('Step 17 Phase 2 permissions seeded successfully.');
    }
}
