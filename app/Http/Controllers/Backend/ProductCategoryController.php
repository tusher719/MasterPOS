<?php
// app/Http/Controllers/Backend/ProductCategoryController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreProductCategoryRequest;
use App\Http\Requests\Backend\UpdateProductCategoryRequest;
use App\Models\ProductCategory;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;

class ProductCategoryController extends Controller
{
    use AuthorizesRequests;

    public function index(): Response
    {
        $this->authorize('viewAny', ProductCategory::class);

        $categories = ProductCategory::with('parent')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn($cat) => [
                'id'          => $cat->id,
                'name'        => $cat->name,
                'slug'        => $cat->slug,
                'parent_id'   => $cat->parent_id,
                'parent_name' => $cat->parent?->name,
                'image'       => $cat->image
                                    ? Storage::url($cat->image)
                                    : null,
                'description' => $cat->description,
                'sort_order'  => $cat->sort_order,
                'is_active'   => $cat->is_active,
                'product_count' => $cat->products()->count(),
            ]);

        // Only top-level categories available as parents
        $parents = ProductCategory::whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Backend/Products/Categories/Index', [
            'categories' => $categories,
            'parents'    => $parents,
        ]);
    }

    public function store(StoreProductCategoryRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Handle image upload
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')
                ->store('product-categories', 'public');
        }

        $data['is_active'] = $request->boolean('is_active', true);

        $category = ProductCategory::create($data);

        ActivityLogService::log(
            'product_category',
            'created',
            "Product category '{$category->name}' created",
            $category->id,
            $category->toArray()
        );

        return back()->with('success', 'Category created successfully.');
    }

    public function update(UpdateProductCategoryRequest $request, ProductCategory $productCategory): RedirectResponse
    {
        $data = $request->validated();

        // Prevent category from being its own parent
        if ((int) ($data['parent_id'] ?? null) === $productCategory->id) {
            return back()->withErrors(['parent_id' => 'A category cannot be its own parent.']);
        }

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image
            if ($productCategory->image) {
                Storage::disk('public')->delete($productCategory->image);
            }
            $data['image'] = $request->file('image')
                ->store('product-categories', 'public');
        }

        $data['is_active'] = $request->boolean('is_active');

        $productCategory->update($data);

        ActivityLogService::log(
            'product_category',
            'updated',
            "Product category '{$productCategory->name}' updated",
            $productCategory->id,
            $productCategory->toArray()
        );

        return back()->with('success', 'Category updated successfully.');
    }

    public function destroy(ProductCategory $productCategory): RedirectResponse
    {
        $this->authorize('delete', $productCategory);

        // Prevent delete if has children
        if ($productCategory->children()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete a category that has sub-categories.']);
        }

        // Prevent delete if has products
        if ($productCategory->products()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete a category that has products assigned.']);
        }

        // Delete image
        if ($productCategory->image) {
            Storage::disk('public')->delete($productCategory->image);
        }

        ActivityLogService::log(
            'product_category',
            'deleted',
            "Product category '{$productCategory->name}' deleted",
            $productCategory->id
        );

        $productCategory->delete();

        return back()->with('success', 'Category deleted successfully.');
    }
}
