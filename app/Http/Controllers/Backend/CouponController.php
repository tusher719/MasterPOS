<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCouponRequest;
use App\Http\Requests\UpdateCouponRequest;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Services\ActivityLogService;
use App\Services\CouponService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Coupon::class);

        $search  = $request->input('search');
        $status  = $request->input('status'); // 'active', 'inactive', 'expired'
        $type    = $request->input('type');   // 'percent', 'fixed'
        $trashed = $request->input('trashed', 'without'); // 'without', 'with', 'only'

        $query = Coupon::query()->with('creator:id,name');

        if ($trashed === 'only') {
            $query->onlyTrashed();
        } elseif ($trashed === 'with') {
            $query->withTrashed();
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($type)) {
            $query->where('type', $type);
        }

        if ($status === 'active') {
            $query->where('is_active', true)
                  ->where(function ($q) {
                      $q->whereNull('expires_at')->orWhere('expires_at', '>=', now());
                  });
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        } elseif ($status === 'expired') {
            $query->whereNotNull('expires_at')->where('expires_at', '<', now());
        }

        $coupons = $query->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($coupon) => [
                'id'                       => $coupon->id,
                'uuid'                     => $coupon->uuid,
                'code'                     => $coupon->code,
                'description'              => $coupon->description,
                'type'                     => $coupon->type,
                'value'                    => (float) $coupon->value,
                'min_order_amount'         => $coupon->min_order_amount !== null ? (float) $coupon->min_order_amount : null,
                'max_discount_amount'      => $coupon->max_discount_amount !== null ? (float) $coupon->max_discount_amount : null,
                'usage_limit'              => $coupon->usage_limit,
                'usage_limit_per_customer' => $coupon->usage_limit_per_customer,
                'used_count'               => (int) $coupon->used_count,
                'applicable_to'            => $coupon->applicable_to,
                'applicable_category_ids'  => $coupon->applicable_category_ids ?? [],
                'applicable_product_ids'   => $coupon->applicable_product_ids ?? [],
                'starts_at'                => $coupon->starts_at?->format('Y-m-d H:i:s'),
                'expires_at'               => $coupon->expires_at?->format('Y-m-d H:i:s'),
                'coupon_stackable'         => (bool) $coupon->coupon_stackable,
                'is_active'                => (bool) $coupon->is_active,
                'is_expired'               => $coupon->expires_at && now()->gt($coupon->expires_at),
                'creator_name'             => $coupon->creator?->name,
                'created_at'               => $coupon->created_at->format('Y-m-d H:i'),
                'deleted_at'               => $coupon->deleted_at?->format('Y-m-d H:i'),
                'can'                      => [
                    'edit'    => Gate::allows('update', $coupon),
                    'delete'  => Gate::allows('delete', $coupon),
                    'restore' => Gate::allows('restore', $coupon),
                ],
            ]);

        $stats = [
            'total'               => Coupon::count(),
            'active'              => Coupon::where('is_active', true)->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>=', now()))->count(),
            'total_usages'        => (int) CouponUsage::count(),
            'total_discount_given'=> (float) CouponUsage::sum('discount_amount'),
        ];

        $categories = ProductCategory::orderBy('name')->get(['id', 'name']);
        $products   = Product::orderBy('name')->get(['id', 'name', 'sku']);

        return Inertia::render('Backend/Coupons/Index', [
            'coupons'    => $coupons,
            'filters'    => [
                'search'  => $search,
                'status'  => $status,
                'type'    => $type,
                'trashed' => $trashed,
            ],
            'stats'      => $stats,
            'categories' => $categories,
            'products'   => $products,
            'can'        => [
                'create' => Gate::allows('create', Coupon::class),
            ],
        ]);
    }

    public function store(StoreCouponRequest $request): RedirectResponse
    {
        $this->authorize('create', Coupon::class);

        $data = $request->validated();
        $data['created_by'] = Auth::id();

        $coupon = Coupon::create($data);

        ActivityLogService::log(
            'coupon',
            'create',
            "Coupon '{$coupon->code}' created ({$coupon->type} - {$coupon->value})",
            $coupon,
            ['code' => $coupon->code, 'type' => $coupon->type, 'value' => $coupon->value]
        );

        return back()->with('success', "Coupon '{$coupon->code}' created successfully.");
    }

    public function update(UpdateCouponRequest $request, Coupon $coupon): RedirectResponse
    {
        $this->authorize('update', $coupon);

        $coupon->update($request->validated());

        ActivityLogService::log(
            'coupon',
            'update',
            "Coupon '{$coupon->code}' updated",
            $coupon,
            ['code' => $coupon->code, 'type' => $coupon->type, 'value' => $coupon->value]
        );

        return back()->with('success', "Coupon '{$coupon->code}' updated successfully.");
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        $this->authorize('delete', $coupon);

        $code = $coupon->code;
        $coupon->delete();

        ActivityLogService::log(
            'coupon',
            'delete',
            "Coupon '{$code}' moved to trash",
            $coupon,
            ['code' => $code]
        );

        return back()->with('success', "Coupon '{$code}' moved to trash.");
    }

    public function restore(int $id): RedirectResponse
    {
        $coupon = Coupon::withTrashed()->findOrFail($id);
        $this->authorize('restore', $coupon);

        $coupon->restore();

        ActivityLogService::log(
            'coupon',
            'restore',
            "Coupon '{$coupon->code}' restored from trash",
            $coupon,
            ['code' => $coupon->code]
        );

        return back()->with('success', "Coupon '{$coupon->code}' restored successfully.");
    }

    public function toggleStatus(Coupon $coupon): RedirectResponse
    {
        $this->authorize('update', $coupon);

        $coupon->update(['is_active' => ! $coupon->is_active]);

        $statusText = $coupon->is_active ? 'activated' : 'deactivated';

        ActivityLogService::log(
            'coupon',
            'update',
            "Coupon '{$coupon->code}' {$statusText}",
            $coupon,
            ['code' => $coupon->code, 'is_active' => $coupon->is_active]
        );

        return back()->with('success', "Coupon '{$coupon->code}' {$statusText}.");
    }

    public function usages(Coupon $coupon): JsonResponse
    {
        $this->authorize('view', $coupon);

        $usages = $coupon->usages()
            ->with([
                'customer:id,name,phone',
                'sale:id,reference_no,grand_total,sale_date',
            ])
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($usages);
    }

    /**
     * Live AJAX validation endpoint for POS counter and Checkout.
     */
    public function validateCoupon(Request $request, CouponService $couponService): JsonResponse
    {
        $validated = $request->validate([
            'code'           => ['required', 'string'],
            'subtotal'       => ['required', 'numeric', 'min:0'],
            'customer_id'    => ['nullable', 'integer'],
            'customer_phone' => ['nullable', 'string'],
            'items'          => ['nullable', 'array'],
        ]);

        $result = $couponService->validate(
            $validated['code'],
            (float) $validated['subtotal'],
            $validated['customer_id'] ?? null,
            $validated['customer_phone'] ?? null,
            $validated['items'] ?? []
        );

        return response()->json($result, $result['valid'] ? 200 : 422);
    }
}
