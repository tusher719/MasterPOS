<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\QuickLink;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class QuickLinkController extends Controller
{
    // ── Navbar JSON endpoint ──────────────────────────────────────────────────

    /**
     * GET /backend/quick-links/nav
     * Returns active quick links filtered by current user's roles.
     * Used by AppLauncherModal on initial load (shared via HandleInertiaRequests).
     */
    public function nav(): JsonResponse
    {
        $user      = Auth::user();
        $roleNames = $user && method_exists($user, 'getRoleNames')
            ? $user->getRoleNames()->toArray()
            : [];

        $links = QuickLink::active()
            ->get()
            ->filter(fn($link) => $link->isVisibleToRoles($roleNames))
            ->map(fn($link) => [
                'id'         => $link->id,
                'label'      => $link->label,
                'icon'       => $link->icon,
                'route_name' => $link->route_name,
                'sort_order' => $link->sort_order,
            ])
            ->values();

        return response()->json($links);
    }

    // ── Settings CRUD ─────────────────────────────────────────────────────────

    /**
     * GET /backend/quick-links
     * "View All" page — all active links visible to this user.
     */
    public function index(Request $request)
    {
        abort_unless(Gate::allows('quick_link.view'), 403);

        $user      = Auth::user();
        $roleNames = $user && method_exists($user, 'getRoleNames')
            ? $user->getRoleNames()->toArray()
            : [];

        $search = $request->input('search', '');

        $links = QuickLink::query()
            ->when($search, fn($q) => $q->where('label', 'like', "%{$search}%"))
            ->orderBy('sort_order')
            ->get()
            ->filter(fn($link) => $link->isVisibleToRoles($roleNames))
            ->values();

        $can = [
            'create' => Gate::allows('quick_link.create'),
            'edit'   => Gate::allows('quick_link.edit'),
        ];

        return inertia('Backend/QuickLinks/Index', [
            'links'  => $links,
            'search' => $search,
            'can'    => $can,
        ]);
    }

    /**
     * POST /backend/quick-links
     */
    public function store(Request $request): RedirectResponse
    {
        abort_unless(Gate::allows('quick_link.create'), 403);

        $data = $request->validate([
            'label'            => 'required|string|max:50',
            'icon'             => 'required|string|max:50',
            'route_name'       => 'required|string|max:100',
            'sort_order'       => 'nullable|integer|min:0|max:9999',
            'is_active'        => 'boolean',
            'visible_to_roles' => 'nullable|array',
            'visible_to_roles.*' => 'string',
        ]);

        $data['sort_order'] = $data['sort_order'] ?? QuickLink::max('sort_order') + 1;

        $link = QuickLink::create($data);

        ActivityLogService::log(
            'quick_links',
            'create',
            "Created quick link: {$link->label}",
            $link,
            ['label' => $link->label, 'route_name' => $link->route_name]
        );

        return back()->with('success', 'Quick link created.');
    }

    /**
     * PUT /backend/quick-links/{quickLink}
     */
    public function update(Request $request, QuickLink $quickLink): RedirectResponse
    {
        abort_unless(Gate::allows('quick_link.edit'), 403);

        $data = $request->validate([
            'label'            => 'required|string|max:50',
            'icon'             => 'required|string|max:50',
            'route_name'       => 'required|string|max:100',
            'sort_order'       => 'nullable|integer|min:0|max:9999',
            'is_active'        => 'boolean',
            'visible_to_roles' => 'nullable|array',
            'visible_to_roles.*' => 'string',
        ]);

        $quickLink->update($data);

        ActivityLogService::log(
            'quick_links',
            'update',
            "Updated quick link: {$quickLink->label}",
            $quickLink,
            ['label' => $quickLink->label, 'route_name' => $quickLink->route_name]
        );

        return back()->with('success', 'Quick link updated.');
    }

    /**
     * DELETE /backend/quick-links/{quickLink}
     */
    public function destroy(QuickLink $quickLink): RedirectResponse
    {
        abort_unless(Gate::allows('quick_link.edit'), 403);

        $label = $quickLink->label;
        $quickLink->delete();

        ActivityLogService::log(
            'quick_links',
            'delete',
            "Deleted quick link: {$label}",
            $quickLink,
            ['label' => $label]
        );

        return back()->with('success', 'Quick link deleted.');
    }

    /**
     * POST /backend/quick-links/reorder
     * Accepts [{id, sort_order}, ...] and bulk-updates sort_order.
     */
    public function reorder(Request $request): JsonResponse
    {
        abort_unless(Gate::allows('quick_link.edit'), 403);

        $items = $request->validate([
            'items'              => 'required|array',
            'items.*.id'         => 'required|integer|exists:quick_links,id',
            'items.*.sort_order' => 'required|integer|min:0',
        ])['items'];

        foreach ($items as $item) {
            QuickLink::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['success' => true]);
    }
}
