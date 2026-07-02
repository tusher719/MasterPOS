<?php

namespace Database\Seeders;

use App\Models\BusinessSetting;
use Illuminate\Database\Seeder;

class BusinessSettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            // Business info group
            ['key' => 'business_name',    'value' => 'My POS Shop',   'group' => 'business'],
            ['key' => 'business_email',   'value' => '',               'group' => 'business'],
            ['key' => 'business_phone',   'value' => '',               'group' => 'business'],
            ['key' => 'business_address', 'value' => '',               'group' => 'business'],
            ['key' => 'business_logo',    'value' => null,             'group' => 'business'],

            // Currency group
            ['key' => 'business_currency', 'value' => 'BDT',    'group' => 'currency'],
            ['key' => 'currency_symbol',   'value' => '৳',      'group' => 'currency'],
            ['key' => 'currency_position', 'value' => 'before',  'group' => 'currency'],
            ['key' => 'decimal_places',    'value' => '2',       'group' => 'currency'],

            // Tax group
            ['key' => 'tax_enabled',   'value' => 'false', 'group' => 'tax'],
            ['key' => 'tax_name',      'value' => 'VAT',   'group' => 'tax'],
            ['key' => 'tax_rate',      'value' => '15',    'group' => 'tax'],
            ['key' => 'tax_inclusive', 'value' => 'false', 'group' => 'tax'],

            // Notification group
            ['key' => 'notify_on_sale',      'value' => 'true', 'group' => 'notification'],
            ['key' => 'notify_low_stock',    'value' => 'true', 'group' => 'notification'],
            ['key' => 'notify_on_expense',   'value' => 'false','group' => 'notification'],
            ['key' => 'low_stock_threshold', 'value' => '10',   'group' => 'notification'],
        ];

        foreach ($defaults as $setting) {
            BusinessSetting::firstOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value'], 'group' => $setting['group']]
            );
        }
    }
}
