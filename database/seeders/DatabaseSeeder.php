<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);
        $this->call(BusinessSettingSeeder::class);
        $this->call(PaymentMethodSeeder::class);
        $this->call(ExpenseCategorySeeder::class);
        $this->call(InvestmentTypeSeeder::class);
        $this->call(Step03PermissionSeeder::class);

        // Step 04
        $this->call(UnitSeeder::class);
        $this->call(ProductCategorySeeder::class);
        $this->call(Step04PermissionSeeder::class);

        $admin = \App\Models\User::firstOrCreate(
            ['email' => 'admin@masterpos.test'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('password'),
                'status' => 'active',
            ]
        );
        $admin->assignRole('Admin');
    }
}
