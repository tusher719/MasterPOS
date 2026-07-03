<?php
// database/seeders/UnitSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['name' => 'Piece',     'short_code' => 'pcs'],
            ['name' => 'Kilogram',  'short_code' => 'kg'],
            ['name' => 'Gram',      'short_code' => 'g'],
            ['name' => 'Litre',     'short_code' => 'ltr'],
            ['name' => 'Millilitre','short_code' => 'ml'],
            ['name' => 'Meter',     'short_code' => 'mtr'],
            ['name' => 'Box',       'short_code' => 'box'],
            ['name' => 'Dozen',     'short_code' => 'dz'],
        ];

        foreach ($units as $unit) {
            Unit::firstOrCreate(
                ['short_code' => $unit['short_code']],
                ['name' => $unit['name'], 'is_active' => true]
            );
        }
    }
}
