<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStorefrontBannerRequest;
use App\Http\Requests\UpdateStorefrontBannerRequest;
use App\Models\Coupon;
use App\Models\StorefrontBanner;
use App\Services\ActivityLogService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontBannerController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', StorefrontBanner::class);

        $search    = $request->input('search');
        $placement = $request->input('placement');
        $status    = $request->input('status'); // 'active', 'inactive', 'expired'
        $trashed   = $request->boolean('trashed');

        $query = StorefrontBanner::with('creator:id,name');

        if ($trashed) {
            $query->onlyTrashed();
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('subtitle', 'like', "%{$search}%")
                  ->orWhere('badge_text', 'like', "%{$search}%")
                  ->orWhere('coupon_code', 'like', "%{$search}%");
            });
        }

        if ($placement && in_array($placement, ['hero_slider', 'promo_strip', 'popup_banner'])) {
            $query->where('placement', $placement);
        }

        if ($status === 'active') {
            $query->where('is_active', true)
                  ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>=', now()));
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        } elseif ($status === 'expired') {
            $query->where('expires_at', '<', now());
        }

        $banners = $query->orderBy('sort_order', 'asc')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'total'       => StorefrontBanner::count(),
            'active'      => StorefrontBanner::active()->count(),
            'expired'     => StorefrontBanner::where('expires_at', '<', now())->count(),
            'hero_count'  => StorefrontBanner::where('placement', 'hero_slider')->count(),
            'promo_count' => StorefrontBanner::where('placement', 'promo_strip')->count(),
            'trashed'     => StorefrontBanner::onlyTrashed()->count(),
        ];

        // Active coupons for banner selection
        $coupons = Coupon::active()
            ->orderBy('code')
            ->get(['id', 'code', 'type', 'value', 'description']);

        return Inertia::render('Backend/StorefrontBanners/Index', [
            'banners' => $banners,
            'stats'   => $stats,
            'coupons' => $coupons,
            'filters' => [
                'search'    => $search,
                'placement' => $placement,
                'status'    => $status,
                'trashed'   => $trashed,
            ],
            'can' => [
                'create'  => $request->user()->can('create', StorefrontBanner::class),
                'edit'    => $request->user()->can('update', new StorefrontBanner()),
                'delete'  => $request->user()->can('delete', new StorefrontBanner()),
                'restore' => $request->user()->can('restore', new StorefrontBanner()),
            ],
        ]);
    }

    public function store(StoreStorefrontBannerRequest $request): RedirectResponse
    {
        $this->authorize('create', StorefrontBanner::class);

        $validated = $request->validated();

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('banners', 'public');
        }

        $validated['created_by'] = Auth::id();
        $validated['coupon_code'] = ! empty($validated['coupon_code']) ? strtoupper($validated['coupon_code']) : null;
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = $validated['sort_order'] ?? 0;

        $banner = StorefrontBanner::create($validated);

        ActivityLogService::log(
            'created',
            "Created storefront banner '{$banner->title}' ({$banner->placement})"
        );

        return redirect()->route('backend.storefront.banners.index')
            ->with('success', 'Banner created successfully.');
    }

    public function update(UpdateStorefrontBannerRequest $request, StorefrontBanner $banner): RedirectResponse
    {
        $this->authorize('update', $banner);

        $validated = $request->validated();

        if ($request->hasFile('image')) {
            // Delete old image
            if ($banner->image_path && Storage::disk('public')->exists($banner->image_path)) {
                Storage::disk('public')->delete($banner->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('banners', 'public');
        }

        $validated['coupon_code'] = ! empty($validated['coupon_code']) ? strtoupper($validated['coupon_code']) : null;
        $validated['is_active'] = $request->boolean('is_active', true);

        $banner->update($validated);

        ActivityLogService::log(
            'updated',
            "Updated storefront banner '{$banner->title}'"
        );

        return redirect()->route('backend.storefront.banners.index')
            ->with('success', 'Banner updated successfully.');
    }

    public function destroy(StorefrontBanner $banner): RedirectResponse
    {
        $this->authorize('delete', $banner);

        $banner->delete();

        ActivityLogService::log(
            'deleted',
            "Soft deleted storefront banner '{$banner->title}'"
        );

        return redirect()->route('backend.storefront.banners.index')
            ->with('success', 'Banner deleted successfully.');
    }

    public function restore(int $id): RedirectResponse
    {
        $this->authorize('restore', StorefrontBanner::class);

        $banner = StorefrontBanner::onlyTrashed()->findOrFail($id);
        $banner->restore();

        ActivityLogService::log(
            'restored',
            "Restored storefront banner '{$banner->title}'"
        );

        return redirect()->route('backend.storefront.banners.index')
            ->with('success', 'Banner restored successfully.');
    }

    public function toggleStatus(StorefrontBanner $banner): RedirectResponse
    {
        $this->authorize('update', $banner);

        $banner->update([
            'is_active' => ! $banner->is_active,
        ]);

        $statusStr = $banner->is_active ? 'activated' : 'deactivated';
        ActivityLogService::log(
            'updated',
            "{$statusStr} storefront banner '{$banner->title}'"
        );

        return redirect()->back()
            ->with('success', "Banner {$statusStr} successfully.");
    }

    public function reorder(Request $request): RedirectResponse
    {
        $this->authorize('update', StorefrontBanner::class);

        $request->validate([
            'orders'      => ['required', 'array'],
            'orders.*.id' => ['required', 'exists:storefront_banners,id'],
            'orders.*.sort_order' => ['required', 'integer'],
        ]);

        foreach ($request->input('orders') as $order) {
            StorefrontBanner::where('id', $order['id'])->update([
                'sort_order' => $order['sort_order'],
            ]);
        }

        return redirect()->back()->with('success', 'Banners reordered successfully.');
    }
}
