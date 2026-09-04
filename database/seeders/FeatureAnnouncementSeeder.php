<?php
// database/seeders/FeatureAnnouncementSeeder.php

namespace Database\Seeders;

use App\Models\FeatureAnnouncement;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class FeatureAnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        // ── Permissions ───────────────────────────────────────────────────────
        $permissions = [
            'feature_announcement.view',
            'feature_announcement.create',
            'feature_announcement.edit',
            'feature_announcement.delete',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $admin = Role::where('name', 'Admin')->first();

        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        app()[\Spatie\Permission\PermissionRegistrar::class]
            ->forgetCachedPermissions();

        // ── Sample announcements ──────────────────────────────────────────────
        // These show badges on their matching sidebar nav items.
        // Adjust show_until dates as needed.
        $samples = [
            [
                'label'      => 'Pre-Orders',
                'route_name' => 'backend.pre-orders.index',
                'badge_type' => 'new',
                'badge_text' => null,
                'show_until' => Carbon::today()->addDays(30)->toDateString(),
                'is_active'  => true,
            ],
            [
                'label'      => 'Planning Tasks',
                'route_name' => 'backend.product-planning-tasks.index',
                'badge_type' => 'beta',
                'badge_text' => null,
                'show_until' => Carbon::today()->addDays(60)->toDateString(),
                'is_active'  => true,
            ],
        ];

        foreach ($samples as $data) {
            // Use updateOrInsert to avoid duplicates on re-run
            FeatureAnnouncement::firstOrCreate(
                ['route_name' => $data['route_name']],
                $data,
            );
        }
    }
}
