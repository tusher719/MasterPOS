<?php

namespace Database\Seeders;

use App\Models\InvestmentType;
use Illuminate\Database\Seeder;

class InvestmentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Cash Investment',       'description' => 'Physical cash injected into the business'],
            ['name' => 'Equipment Purchase',    'description' => 'Machinery, computers, furniture'],
            ['name' => 'Inventory Stock',       'description' => 'Initial or additional stock purchase'],
            ['name' => 'Property',              'description' => 'Land or building investment'],
            ['name' => 'Partner Contribution',  'description' => 'Capital contribution from business partner'],
            ['name' => 'Bank Loan',             'description' => 'Loan taken from a bank or financial institution'],
        ];

        foreach ($types as $type) {
            InvestmentType::firstOrCreate(
                ['name' => $type['name']],
                array_merge($type, ['is_active' => true])
            );
        }
    }
}
