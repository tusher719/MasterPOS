<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Services\SettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicCategoryController extends Controller
{
    public function show(Request $request, string $slug): Response
    {
        $settings = SettingsService::all();

        $category = ProductCategory::with(['children' => fn($q) => $q->where('is_active', true)])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        // Include child category IDs so products from subcategories show up
        $categoryIds = collect([$category->id]);
        if ($category->children->isNotEmpty()) {
            $categoryIds = $categoryIds->merge($category->children->pluck('id'));
        }

        $query = Product::with(['primaryImage', 'category:id,name,slug'])->active()->whereIn('category_id', $categoryIds);


        // Search within category
        if ($request->filled('q')) {
            $search = $request->q;
            $query->where(fn($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
            );
        }

        // In-stock filter
        if ($request->boolean('in_stock')) {
            $query->where('stock_qty', '>', 0);
        }

        // Price range
        if ($request->filled('min_price')) {
            $query->where('sale_price', '>=', (float) $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('sale_price', '<=', (float) $request->max_price);
        }

        // Sort
        match ($request->get('sort', 'newest')) {
            'price_asc'  => $query->orderBy('sale_price'),
            'price_desc' => $query->orderByDesc('sale_price'),
            'name_asc'   => $query->orderBy('name'),
            default      => $query->orderByDesc('created_at'),
        };

        $products = $query->paginate(16)->withQueryString();

        $mappedProducts = $products->through(fn(Product $p) => [
            'id'             => $p->id,
            'name'           => $p->name,
            'slug'           => $p->slug,
            'sale_price'     => (float) $p->sale_price,
            'discount_type'  => $p->discount_type,
            'discount_value' => $p->discount_value !== null ? (float) $p->discount_value : null,
            'stock_qty'      => (float) $p->stock_qty,
            'is_low_stock'   => $p->is_low_stock,
            'has_variants'   => $p->has_variants,
            'is_featured'    => $p->is_featured,
            'primary_image'  => $p->primaryImage?->image_path,
            'category'       => $p->category ? [
                'id'   => $p->category->id,
                'name' => $p->category->name,
                'slug' => $p->category->slug,
            ] : null,
        ]);

        // Sidebar — all active top-level categories
        $allCategories = ProductCategory::where('is_active', true)
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
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
                    'products_count' => $count,
                ];
            });

        $paginatedData = [
            'data'  => $mappedProducts->items(),
            'meta'  => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total(),
                'from'         => $products->firstItem(),
                'to'           => $products->lastItem(),
            ],
            'links' => [
                'first' => $products->url(1),
                'last'  => $products->url($products->lastPage()),
                'prev'  => $products->previousPageUrl(),
                'next'  => $products->nextPageUrl(),
            ],
        ];

        return Inertia::render('Public/Categories/Show', [
            'category'      => [
                'id'          => $category->id,
                'name'        => $category->name,
                'slug'        => $category->slug,
                'description' => $category->description,
                'image'       => $category->image,
                'children'    => $category->children->map(fn($c) => [
                    'id'   => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                ]),
            ],
            'products'      => $paginatedData,
            'allCategories' => $allCategories,
            'filters'       => [
                'q'         => $request->q ?? '',
                'sort'      => $request->get('sort', 'newest'),
                'in_stock'  => $request->boolean('in_stock'),
                'min_price' => $request->min_price ?? '',
                'max_price' => $request->max_price ?? '',
            ],
            'settings'      => [
                'business_name'      => $settings['business_name'] ?? 'Master Business Suite',
                'currency_symbol'    => $settings['currency_symbol'] ?? '৳',
                'logo_type'          => $settings['logo_type'] ?? 'text',
                'logo_image_path'    => $settings['logo_image_path'] ?? null,
                'logo_text_segments' => $settings['logo_text_segments'] ?? null,
            ],
        ]);
    }
}
