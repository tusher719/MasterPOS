<?php
// database/seeders/ProductCategorySeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductCategory;
use Illuminate\Support\Str;

class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name'        => 'Electronics',
                'description' => 'Electronic devices and accessories',
                'children'    => ['Mobile Phones', 'Laptops', 'Accessories'],
            ],
            [
                'name'        => 'Food & Beverage',
                'description' => 'Food items and drinks',
                'children'    => ['Snacks', 'Beverages', 'Dairy'],
            ],
            [
                'name'        => 'Clothing',
                'description' => 'Apparel and garments',
                'children'    => ['Men', 'Women', 'Kids'],
            ],
            [
                'name'        => 'Stationery',
                'description' => 'Office and school supplies',
                'children'    => ['Pens & Pencils', 'Notebooks', 'Printing'],
            ],
        ];

        foreach ($categories as $index => $item) {
            $parent = ProductCategory::firstOrCreate(
                ['slug' => Str::slug($item['name'])],
                [
                    'name'        => $item['name'],
                    'description' => $item['description'],
                    'sort_order'  => $index,
                    'is_active'   => true,
                ]
            );

            foreach ($item['children'] as $childIndex => $childName) {
                ProductCategory::firstOrCreate(
                    ['slug' => Str::slug($childName)],
                    [
                        'name'       => $childName,
                        'parent_id'  => $parent->id,
                        'sort_order' => $childIndex,
                        'is_active'  => true,
                    ]
                );
            }
        }
    }
}
