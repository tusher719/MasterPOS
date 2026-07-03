<?php
// app/Http/Controllers/Backend/ProductController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreProductRequest;
use App\Http\Requests\Backend\UpdateProductRequest;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductImage;
use App\Models\Unit;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    use AuthorizesRequests;

    public function index(): Response
    {
        $this->authorize('viewAny', Product::class);

        $products = Product::with(['category', 'unit', 'primaryImage'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn($product) => [
                'id'                  => $product->id,
                'name'                => $product->name,
                'sku'                 => $product->sku,
                'barcode'             => $product->barcode,
                'category_id'         => $product->category_id,
                'category_name'       => $product->category?->name,
                'unit_id'             => $product->unit_id,
                'unit_short_code'     => $product->unit?->short_code,
                'cost_price'          => $product->cost_price,
                'sale_price'          => $product->sale_price,
                'stock_qty'           => $product->stock_qty,
                'low_stock_threshold' => $product->low_stock_threshold,
                'is_low_stock'        => $product->is_low_stock,
                'is_featured'         => $product->is_featured,
                'is_active'           => $product->is_active,
                'primary_image'       => $product->primaryImage?->image_url,
            ]);

        // Stats
        $stats = [
            'total'     => Product::count(),
            'active'    => Product::where('is_active', true)->count(),
            'low_stock' => Product::whereColumn('stock_qty', '<=', 'low_stock_threshold')->count(),
            'featured'  => Product::where('is_featured', true)->count(),
        ];

        return Inertia::render('Backend/Products/Index', [
            'products' => $products,
            'stats'    => $stats,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Product::class);

        return Inertia::render('Backend/Products/Create', [
            'categories' => $this->categoryOptions(),
            'units'      => $this->unitOptions(),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Cast booleans
        foreach (['is_taxable', 'has_variants', 'is_featured', 'is_active'] as $bool) {
            $data[$bool] = $request->boolean($bool, $bool === 'is_active');
        }

        DB::transaction(function () use ($data, $request) {
            $product = Product::create($data);

            // Handle image uploads
            if ($request->hasFile('images')) {
                $primaryIndex = (int) ($data['primary_image_index'] ?? 0);

                foreach ($request->file('images') as $index => $file) {
                    $path = $file->store('products', 'public');

                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_path' => $path,
                        'is_primary' => $index === $primaryIndex,
                        'sort_order' => $index,
                    ]);
                }
            }

            ActivityLogService::log(
                'product',
                'created',
                "Product '{$product->name}' (SKU: {$product->sku}) created",
                $product->id,
                $product->toArray()
            );
        });

        return redirect()
            ->route('backend.products.index')
            ->with('success', 'Product created successfully.');
    }

    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);

        $product->load(['category', 'unit', 'images']);

        return Inertia::render('Backend/Products/Edit', [
            'product'    => [
                'id'                  => $product->id,
                'name'                => $product->name,
                'sku'                 => $product->sku,
                'barcode'             => $product->barcode,
                'category_id'         => $product->category_id,
                'unit_id'             => $product->unit_id,
                'cost_price'          => $product->cost_price,
                'sale_price'          => $product->sale_price,
                'is_taxable'          => $product->is_taxable,
                'tax_id'              => $product->tax_id,
                'discount_type'       => $product->discount_type,
                'discount_value'      => $product->discount_value,
                'stock_qty'           => $product->stock_qty,
                'low_stock_threshold' => $product->low_stock_threshold,
                'min_sale_qty'        => $product->min_sale_qty,
                'has_variants'        => $product->has_variants,
                'weight'              => $product->weight,
                'weight_unit'         => $product->weight_unit,
                'is_featured'         => $product->is_featured,
                'sort_order'          => $product->sort_order,
                'meta_title'          => $product->meta_title,
                'meta_description'    => $product->meta_description,
                'description'         => $product->description,
                'is_active'           => $product->is_active,
                'images'              => $product->images->map(fn($img) => [
                    'id'         => $img->id,
                    'image_url'  => $img->image_url,
                    'is_primary' => $img->is_primary,
                    'sort_order' => $img->sort_order,
                ]),
            ],
            'categories' => $this->categoryOptions(),
            'units'      => $this->unitOptions(),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();

        foreach (['is_taxable', 'has_variants', 'is_featured', 'is_active'] as $bool) {
            $data[$bool] = $request->boolean($bool, $bool === 'is_active');
        }

        DB::transaction(function () use ($data, $request, $product) {
            $product->update($data);

            // Delete removed images
            if (!empty($data['deleted_image_ids'])) {
                $toDelete = ProductImage::whereIn('id', $data['deleted_image_ids'])
                    ->where('product_id', $product->id)
                    ->get();

                foreach ($toDelete as $img) {
                    Storage::disk('public')->delete($img->image_path);
                    $img->delete();
                }
            }

            // Set primary image from existing images
            if (!empty($data['primary_image_id'])) {
                ProductImage::where('product_id', $product->id)
                    ->update(['is_primary' => false]);

                ProductImage::where('id', $data['primary_image_id'])
                    ->where('product_id', $product->id)
                    ->update(['is_primary' => true]);
            }

            // Upload new images
            if ($request->hasFile('images')) {
                $existingCount = $product->images()->count();
                $primaryIndex  = (int) ($data['primary_image_index'] ?? -1);

                // If no existing primary, first new image becomes primary
                $hasPrimary = $product->images()->where('is_primary', true)->exists();

                foreach ($request->file('images') as $index => $file) {
                    $path = $file->store('products', 'public');

                    $isPrimary = !$hasPrimary && $index === 0
                        ? true
                        : $index === $primaryIndex;

                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_path' => $path,
                        'is_primary' => $isPrimary,
                        'sort_order' => $existingCount + $index,
                    ]);

                    if ($isPrimary) {
                        $hasPrimary = true;
                    }
                }
            }

            ActivityLogService::log(
                'product',
                'updated',
                "Product '{$product->name}' (SKU: {$product->sku}) updated",
                $product->id,
                $product->toArray()
            );
        });

        return redirect()
            ->route('backend.products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);

        DB::transaction(function () use ($product) {
            // Delete all images from storage
            foreach ($product->images as $img) {
                Storage::disk('public')->delete($img->image_path);
            }

            ActivityLogService::log(
                'product',
                'deleted',
                "Product '{$product->name}' (SKU: {$product->sku}) deleted",
                $product->id
            );

            $product->delete(); // soft delete; images cascade
        });

        return back()->with('success', 'Product deleted successfully.');
    }

    public function destroyImage(Product $product, ProductImage $image): RedirectResponse
    {
        $this->authorize('update', $product);

        if ($image->product_id !== $product->id) {
            abort(403);
        }

        Storage::disk('public')->delete($image->image_path);
        $wasPrimary = $image->is_primary;
        $image->delete();

        // Promote next image to primary if deleted image was primary
        if ($wasPrimary) {
            $next = $product->images()->orderBy('sort_order')->first();
            $next?->update(['is_primary' => true]);
        }

        return back()->with('success', 'Image removed.');
    }

    public function setPrimaryImage(Product $product, ProductImage $image): RedirectResponse
    {
        $this->authorize('update', $product);

        if ($image->product_id !== $product->id) {
            abort(403);
        }

        ProductImage::where('product_id', $product->id)
            ->update(['is_primary' => false]);

        $image->update(['is_primary' => true]);

        return back()->with('success', 'Primary image updated.');
    }

    // --- Helpers ---

    private function categoryOptions(): \Illuminate\Support\Collection
    {
        // Returns flat list with parent name for grouping in UI
        return ProductCategory::with('parent')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn($cat) => [
                'id'          => $cat->id,
                'name'        => $cat->name,
                'parent_id'   => $cat->parent_id,
                'parent_name' => $cat->parent?->name,
            ]);
    }

    private function unitOptions(): \Illuminate\Support\Collection
    {
        return Unit::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'short_code']);
    }
}
