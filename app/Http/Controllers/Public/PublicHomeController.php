<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Services\SettingsService;
use Inertia\Inertia;
use Inertia\Response;

class PublicHomeController extends Controller
{
    public function index(): Response
    {
        $settings = SettingsService::all();

        // Featured products — active, in stock, max 8
        $featuredProducts = Product::with(['primaryImage', 'category:id,name,slug'])
            ->active()
            ->where('is_featured', true)
            // ->where('stock_qty', '>', 0)
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn(Product $p) => [
                'id'            => $p->id,
                'name'          => $p->name,
                'slug'          => $p->slug,
                'sale_price'    => (float) $p->sale_price,
                'discount_type'  => $p->discount_type,
                'discount_value' => $p->discount_value !== null ? (float) $p->discount_value : null,
                'stock_qty'     => (int) $p->stock_qty,
                'is_low_stock'  => $p->is_low_stock,
                'has_variants'  => $p->has_variants,
                'primary_image' => $p->primaryImage?->image_path,
                'category'      => $p->category ? [
                    'id'   => $p->category->id,
                    'name' => $p->category->name,
                    'slug' => $p->category->slug,
                ] : null,
            ]);

        // Latest products — active, max 8
        $latestProducts = Product::with(['primaryImage', 'category:id,name,slug'])
            ->active()
            // ->where('stock_qty', '>', 0)
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn(Product $p) => [
                'id'            => $p->id,
                'name'          => $p->name,
                'slug'          => $p->slug,
                'sale_price'    => (float) $p->sale_price,
                'discount_type'  => $p->discount_type,
                'discount_value' => $p->discount_value !== null ? (float) $p->discount_value : null,
                'stock_qty'     => (int) $p->stock_qty,
                'is_low_stock'  => $p->is_low_stock,
                'has_variants'  => $p->has_variants,
                'primary_image' => $p->primaryImage?->image_path,
                'category'      => $p->category ? [
                    'id'   => $p->category->id,
                    'name' => $p->category->name,
                    'slug' => $p->category->slug,
                ] : null,
            ]);

        // Top-level categories with product count
        $categories = ProductCategory::whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->limit(12)
            ->get()
            ->map(function (ProductCategory $c) {
                $childIds = ProductCategory::where('parent_id', $c->id)
                    ->pluck('id')
                    ->prepend($c->id);

                $count = Product::where('is_active', true)
                    ->whereNull('deleted_at')
                    ->whereIn('category_id', $childIds)
                    ->count();

                return [
                    'id'             => $c->id,
                    'name'           => $c->name,
                    'slug'           => $c->slug,
                    'image'          => $c->image,
                    'products_count' => $count,
                ];
            });

        return Inertia::render('Public/Home', [
            'featuredProducts' => $featuredProducts,
            'latestProducts'   => $latestProducts,
            'categories'       => $categories,
            'settings'         => [
                'business_name'    => $settings['business_name'] ?? 'Master Business Suite',
                'currency_symbol'  => $settings['currency_symbol'] ?? '৳',
                'logo_type'        => $settings['logo_type'] ?? 'text',
                'logo_image_path'  => $settings['logo_image_path'] ?? null,
                'logo_text_segments' => $settings['logo_text_segments'] ?? null,
            ],
        ]);
    }
}
