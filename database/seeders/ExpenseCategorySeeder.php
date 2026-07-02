<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Office Supplies',  'color' => '#6366f1', 'description' => 'Pens, paper, stationery'],
            ['name' => 'Utilities',         'color' => '#f59e0b', 'description' => 'Electricity, water, gas'],
            ['name' => 'Rent',              'color' => '#ef4444', 'description' => 'Shop or office rent'],
            ['name' => 'Salaries',          'color' => '#10b981', 'description' => 'Employee wages and salaries'],
            ['name' => 'Marketing',         'color' => '#8b5cf6', 'description' => 'Ads and promotions'],
            ['name' => 'Transportation',    'color' => '#3b82f6', 'description' => 'Fuel and transport costs'],
            ['name' => 'Maintenance',       'color' => '#f97316', 'description' => 'Repairs and upkeep'],
            ['name' => 'Miscellaneous',     'color' => '#64748b', 'description' => 'Other expenses'],
        ];

        foreach ($categories as $category) {
            ExpenseCategory::firstOrCreate(
                ['name' => $category['name']],
                array_merge($category, ['is_active' => true])
            );
        }
    }
}
