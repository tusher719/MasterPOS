<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PreOrderSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Create permissions ───────────────────────────────────────────────
        $permissions = [
            'pre_order.view',    // list + show
            'pre_order.create',  // create new pre-order
            'pre_order.manage',  // edit + status change + convert to sale + delete
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
        }

        // ─── Assign to Admin ──────────────────────────────────────────────────
        $admin = Role::where('name', 'Admin')->first();
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        // ─── Assign to Staff — view only ─────────────────────────────────────
        $staff = Role::where('name', 'Staff')->first();
        if ($staff) {
            $staff->givePermissionTo('pre_order.view');
        }

        // ─── Moderator — view + create only ──────────────────────────────────
        // Moderator role was created in OrderTaskSeeder (Item 8.1)
        $moderator = Role::where('name', 'Moderator')->first();
        if ($moderator) {
            $moderator->givePermissionTo([
                'pre_order.view',
                'pre_order.create',
            ]);
        }
    }
}
