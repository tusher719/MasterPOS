<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            ['name' => 'Cash',   'type' => 'cash',           'sort_order' => 1],
            ['name' => 'Card',   'type' => 'card',           'sort_order' => 2],
            ['name' => 'bKash',  'type' => 'mobile_banking', 'sort_order' => 3],
            ['name' => 'Nagad',  'type' => 'mobile_banking', 'sort_order' => 4],
            ['name' => 'Rocket', 'type' => 'mobile_banking', 'sort_order' => 5],
        ];

        foreach ($methods as $method) {
            PaymentMethod::firstOrCreate(
                ['name' => $method['name']],
                array_merge($method, ['is_active' => true])
            );
        }
    }
}
