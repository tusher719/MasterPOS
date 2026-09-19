<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Services\SettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicProductController extends Controller
{
    public function index(Request $request): Response
    {
        $settings = SettingsService::all();

        // $query = Product::with(['primaryImage', 'category:id,name,slug'])
        //     ->active()
        //     ->where('stock_qty', '>', 0);
        $query = Product::with(['primaryImage', 'category:id,name,slug'])->active();

        // Search
        if ($request->filled('q')) {
            $search = $request->q;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->filled('category')) {
            $category = ProductCategory::where('slug', $request->category)
                ->where('is_active', true)
                ->first();

            if ($category) {
                // Include products from child categories too
                $categoryIds = ProductCategory::where('parent_id', $category->id)
                    ->pluck('id')
                    ->prepend($category->id);

                $query->whereIn('category_id', $categoryIds);
            }
        }

        // Price range
        if ($request->filled('min_price')) {
            $query->where('sale_price', '>=', (float) $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('sale_price', '<=', (float) $request->max_price);
        }

        // Featured filter
        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
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
            'discount_value' => $p->discount_value ? (float) $p->discount_value : null,
            'stock_qty'      => (int) $p->stock_qty,
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

        // All active top-level categories for sidebar
        $categories = ProductCategory::where('is_active', true)
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function (ProductCategory $c) {
                // Child category IDs include self
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

        return Inertia::render('Public/Products/Index', [
            'products'   => $paginatedData,
            'categories' => $categories,
            'filters'    => [
                'q'         => $request->q ?? '',
                'category'  => $request->category ?? '',
                'min_price' => $request->min_price ?? '',
                'max_price' => $request->max_price ?? '',
                'sort'      => $request->get('sort', 'newest'),
                'featured'  => $request->boolean('featured'),
            ],
            'settings'   => [
                'business_name'   => $settings['business_name'] ?? 'Master Business Suite',
                'currency_symbol' => $settings['currency_symbol'] ?? '৳',
                'logo_type'        => $settings['logo_type'] ?? 'text',
                'logo_image_path'  => $settings['logo_image_path'] ?? null,
                'logo_text_segments' => $settings['logo_text_segments'] ?? null,
            ],
        ]);
    }

    public function show(string $slug): Response
    {
        $settings = SettingsService::all();

        $product = Product::with([
            'images',
            'primaryImage',
            'category:id,name,slug',
            'unit:id,name,short_code',
            'activeVariants',
        ])
        ->active()
        ->where('slug', $slug)
        ->firstOrFail();

        // Related products — same category, exclude current
        $related = Product::with(['primaryImage'])
            ->active()
            ->where('stock_qty', '>', 0)
            ->where('id', '!=', $product->id)
            ->when($product->category_id, fn($q) => $q->where('category_id', $product->category_id))
            ->limit(4)
            ->get()
            ->map(fn(Product $p) => [
                'id'            => $p->id,
                'name'          => $p->name,
                'slug'          => $p->slug,
                'sale_price'    => (float) $p->sale_price,
                'discount_type'  => $p->discount_type,
                'discount_value' => $p->discount_value !== null ? (float) $p->discount_value : null,
                'primary_image' => $p->primaryImage?->image_path,
            ]);

        return Inertia::render('Public/Products/Show', [
        'product' => [
            'id'              => $product->id,
            'name'            => $product->name,
            'slug'            => $product->slug,
            'description'     => $product->description,
            'sku'             => $product->sku,
            'sale_price'      => (float) $product->sale_price,
            'cost_price'      => (float) $product->cost_price,
            'discount_type'   => $product->discount_type,
            'discount_value'  => $product->discount_value !== null ? (float) $product->discount_value : null,
            'stock_qty'       => (float) $product->stock_qty,
            'low_stock_threshold' => (float) $product->low_stock_threshold,
            'is_low_stock'    => $product->is_low_stock,
            'has_variants'    => (bool) $product->has_variants,
            'is_featured'     => (bool) $product->is_featured,
            'meta_title'      => $product->meta_title,
            'meta_description' => $product->meta_description,
            'weight'          => $product->weight ? (float) $product->weight : null,
            'weight_unit'     => $product->weight_unit,
            'images'          => $product->images->map(fn($img) => [
                'id'         => $img->id,
                'image_path' => $img->image_path,
                'is_primary' => (bool) $img->is_primary,
            ]),
            'primary_image'  => $product->primaryImage?->image_path,
            'category'       => $product->category ? [
                'id'   => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
            ] : null,
            'unit'           => $product->unit ? [
                'id'         => $product->unit->id,
                'name'       => $product->unit->name,
                'short_code' => $product->unit->short_code,
            ] : null,
            'variants'       => $product->activeVariants->map(fn($v) => [
                'id'                  => $v->id,
                'sku'                 => $v->sku,
                'attributes'          => $v->attributes,
                'stock_qty'           => (float) $v->stock_qty,
                'price_override'      => $v->price_override !== null ? (float) $v->price_override : null,
                'cost_price_override' => $v->cost_price_override !== null ? (float) $v->cost_price_override : null,
                'is_active'           => (bool) $v->is_active,
            ]),
        ],
        'related'  => $related,
        'settings' => [
            'business_name'      => $settings['business_name'] ?? 'Master Business Suite',
            'currency_symbol'    => $settings['currency_symbol'] ?? '৳',
            'logo_type'          => $settings['logo_type'] ?? 'text',
            'logo_image_path'    => $settings['logo_image_path'] ?? null,
            'logo_text_segments' => $settings['logo_text_segments'] ?? null,
        ],
    ]);
    }
}
