<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->call([
            RolePermissionSeeder::class,
            BusinessSettingSeeder::class,
            PaymentMethodSeeder::class,
            ExpenseCategorySeeder::class,
            InvestmentTypeSeeder::class,
            Step03PermissionSeeder::class,

            // Step 04 — Catalogue
            UnitSeeder::class,
            ProductCategorySeeder::class,
            Step04PermissionSeeder::class,

            // Core CRM, Inventory, POS & Finance permissions
            Step05PermissionSeeder::class,
            Step06PermissionSeeder::class,
            Step07PermissionSeeder::class,
            Step08PermissionSeeder::class,
            Step09PermissionSeeder::class,
            Step10PermissionSeeder::class,
            Step11PermissionSeeder::class,
            Step12PermissionSeeder::class,
            Step13PermissionSeeder::class,
            Step14PermissionSeeder::class,
            Step16PermissionSeeder::class,

            // Step 17 — Partner & Capital permissions
            Step17PermissionSeeder::class,
            Step17Phase2PermissionSeeder::class,
            Step17Phase3PermissionSeeder::class,
            Step17Phase4APermissionSeeder::class,
            Step17Phase4BPermissionSeeder::class,
            Step17Phase4CPermissionSeeder::class,
            Step17Phase4DPermissionSeeder::class,
            Step17Phase4EPermissionSeeder::class,
            Step17Phase4FPermissionSeeder::class,
            Step17Phase4GPermissionSeeder::class,
            Step17Gap22PermissionSeeder::class,

            // System notifications
            NotificationSeeder::class,
        ]);

        $admin = User::firstOrCreate(
            ['email' => 'admin@masterpos.test'],
            [
                'name'     => 'Super Admin',
                'password' => bcrypt('password'),
                'status'   => 'active',
            ]
        );
        $admin->assignRole('Admin');
    }
}
