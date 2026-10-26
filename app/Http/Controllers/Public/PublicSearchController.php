<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicSearchController extends Controller
{
    public function index(Request $request)
    {
        // ── JSON / Ajax request — live search dropdown ────────────────────────
        if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            $q = $request->input('q', '');

            $hits = Product::with([
                'category:id,name',
                'images' => fn($q2) => $q2->where('is_primary', true)->select('id', 'product_id', 'image_path'),
            ])
                ->where('is_active', true)
                ->whereNull('deleted_at')
                ->where(function ($query) use ($q) {
                    $query->where('name', 'like', "%{$q}%")
                          ->orWhere('sku', 'like', "%{$q}%")
                          ->orWhere('description', 'like', "%{$q}%");
                })
                ->orderBy('name')
                ->limit(6)
                ->get();

            $mapped = $hits->map(fn($p) => $this->mapProduct($p));
            $hitIds = $hits->pluck('id')->toArray();

            // Related: same category products excluding hits
            $related      = collect();
            $relatedLabel = '';

            if ($hits->isNotEmpty()) {
                // Most common category among hits
                $categoryId = $hits->whereNotNull('category_id')
                    ->groupBy('category_id')
                    ->sortByDesc(fn($g) => $g->count())
                    ->keys()
                    ->first();

                if ($categoryId) {
                    $catName = $hits->firstWhere('category_id', $categoryId)?->category?->name;

                    $related = Product::with([
                        'category:id,name',
                        'images' => fn($q2) => $q2->where('is_primary', true)->select('id', 'product_id', 'image_path'),
                    ])
                        ->where('is_active', true)
                        ->whereNull('deleted_at')
                        ->where('category_id', $categoryId)
                        ->whereNotIn('id', $hitIds)
                        ->orderByDesc('is_featured')
                        ->orderBy('sort_order')
                        ->limit(6)
                        ->get()
                        ->map(fn($p) => $this->mapProduct($p));

                    $relatedLabel = $catName ? "More from {$catName}" : 'Related products';
                }
            }

            // Fallback: top/featured products when no related found
            if ($related->isEmpty()) {
                $related = Product::with([
                    'category:id,name',
                    'images' => fn($q2) => $q2->where('is_primary', true)->select('id', 'product_id', 'image_path'),
                ])
                    ->where('is_active', true)
                    ->whereNull('deleted_at')
                    ->whereNotIn('id', $hitIds)
                    ->orderByDesc('is_featured')
                    ->orderBy('sort_order')
                    ->limit(6)
                    ->get()
                    ->map(fn($p) => $this->mapProduct($p));

                $relatedLabel = 'Top Products';
            }

            return response()->json([
                'products'      => ['data' => $mapped],
                'related'       => $related,
                'related_label' => $relatedLabel,
            ]);
        }

        // ── Full page render ──────────────────────────────────────────────────
        $query      = $request->input('q', '');
        $categoryId = $request->input('category');
        $minPrice   = $request->input('min_price');
        $maxPrice   = $request->input('max_price');
        $sort       = $request->input('sort', 'latest');

        $productsQuery = Product::with([
            'category:id,name',
            'images' => fn($q) => $q->where('is_primary', true)->select('id', 'product_id', 'image_path'),
        ])
            ->where('is_active', true)
            ->whereNull('deleted_at');

        // Search: name, SKU, description
        if ($query !== '') {
            $productsQuery->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('sku', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            });
        }

        // Category filter — manual childIds (Rule: never withCount on public)
        if ($categoryId) {
            $childIds = ProductCategory::where('parent_id', $categoryId)
                ->pluck('id')
                ->toArray();
            $allIds = array_merge([(int) $categoryId], $childIds);
            $productsQuery->whereIn('category_id', $allIds);
        }

        // Price filters
        if ($minPrice !== null && $minPrice !== '') {
            $productsQuery->where('sale_price', '>=', (float) $minPrice);
        }
        if ($maxPrice !== null && $maxPrice !== '') {
            $productsQuery->where('sale_price', '<=', (float) $maxPrice);
        }

        // Sort
        match ($sort) {
            'price_asc'  => $productsQuery->orderBy('sale_price', 'asc'),
            'price_desc' => $productsQuery->orderBy('sale_price', 'desc'),
            'name_asc'   => $productsQuery->orderBy('name', 'asc'),
            default      => $productsQuery->orderBy('created_at', 'desc'),
        };

        $paginator = $productsQuery->paginate(16)->withQueryString();

        // Manual paginator — Rule: never ->through() on public controllers
        $paginatedData = [
            'data'  => collect($paginator->items())->map(fn($p) => $this->mapProduct($p))->toArray(),
            'meta'  => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'from'         => $paginator->firstItem(),
                'to'           => $paginator->lastItem(),
            ],
            'links' => [
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ],
        ];

        // Categories for filter sidebar (top-level only)
        $categories = ProductCategory::where('is_active', true)
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get(['id', 'name']);

        // Featured products — only when no results found
        $featuredProducts = [];
        if ($paginator->total() === 0) {
            $featuredProducts = Product::with([
                'images' => fn($q) => $q->where('is_primary', true)->select('id', 'product_id', 'image_path'),
            ])
                ->where('is_active', true)
                ->where('is_featured', true)
                ->whereNull('deleted_at')
                ->orderBy('sort_order')
                ->limit(8)
                ->get()
                ->map(fn($p) => $this->mapProduct($p));
        }

        return Inertia::render('Public/Search', [
            'products'         => $paginatedData,
            'categories'       => $categories,
            'featuredProducts' => $featuredProducts,
            'filters'          => [
                'q'         => $query,
                'category'  => $categoryId ? (int) $categoryId : null,
                'min_price' => $minPrice,
                'max_price' => $maxPrice,
                'sort'      => $sort,
            ],
        ]);
    }

    // ── Private helper — maps a Product model to array for frontend ───────────
    private function mapProduct($product): array
    {
        $primary = $product->images->first();

        return [
            'id'            => $product->id,
            'name'          => $product->name,
            'slug'          => $product->slug,
            'sale_price'    => $product->sale_price,
            'stock_qty'     => $product->stock_qty,
            'low_stock_threshold' => $product->low_stock_threshold,
            'is_featured'   => $product->is_featured,
            'has_variants'  => $product->has_variants,
            'is_low_stock'  => $product->stock_qty > 0 && $product->stock_qty <= $product->low_stock_threshold,
            'discount_type'  => $product->discount_type,
            'discount_value' => $product->discount_value,
            'primary_image' => $primary?->image_path,
            'category'      => $product->category
                ? ['id' => $product->category->id, 'name' => $product->category->name, 'slug' => '']
                : null,
        ];
    }
}
