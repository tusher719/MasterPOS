<?php

namespace App\Http\Middleware;

use App\Models\FeatureAnnouncement;
use App\Models\QuickLink;
use App\Models\UserPreference;
use App\Services\SettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user(),
            ],

            // Ziggy may be installed under either namespace/version, so guard for both.
            'ziggy' => function () use ($request) {
                $ziggy = null;

                if (class_exists('Tighten\\Ziggy\\Ziggy')) {
                    $ziggy = new \Tighten\Ziggy\Ziggy();
                } elseif (class_exists('Tightenco\\Ziggy\\Ziggy')) {
                    $ziggy = new \Tightenco\Ziggy\Ziggy();
                }

                return [
                    ...($ziggy ? $ziggy->toArray() : []),
                    'location' => $request->url(),
                ];
            },

            'settings' => fn () => SettingsService::all(),

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],

            // Per-user theme + UI preferences
            'userPreferences' => function () use ($request) {
                if (! $request->user()) {
                    return [
                        'theme' => UserPreference::DEFAULT_THEME,
                        'ui'    => UserPreference::DEFAULT_UI,
                    ];
                }

                $pref = UserPreference::findOrCreateForUser(
                    $request->user()->id
                );

                return [
                    'theme' => $pref->getTheme(),
                    'ui'    => $pref->getUi(),
                ];
            },

            // Bell dropdown — unread count + latest 8 notifications
            'notifications' => function () use ($request) {
                if (! $request->user()) {
                    return [
                        'unread_count' => 0,
                        'latest'       => [],
                    ];
                }

                return [
                    'unread_count' => $request->user()
                        ->unreadNotifications()
                        ->count(),
                    'latest' => $request->user()
                        ->notifications()
                        ->latest()
                        ->take(8)
                        ->get()
                        ->map(fn ($n) => [
                            'id'         => $n->id,
                            'data'       => $n->data,
                            'read_at'    => $n->read_at,
                            'created_at' => $n->created_at
                                ? $n->created_at->diffForHumans()
                                : null,
                        ])
                        ->toArray(),
                ];
            },

            // App Launcher — active links filtered by current user's roles
            // quickLinks  : for AppLauncherModal popup (role-filtered)
            // allQuickLinks: for Settings QuickLinksTab (all links, admin view)
                        'quickLinks'    => fn () => $this->resolveQuickLinks($request),
            'allQuickLinks' => fn () => $request->user()
                ? QuickLink::orderBy('sort_order')->get()->toArray()
                : [],

            // ── Item 1.18 — Navbar Badges ─────────────────────────────────────
            // featureAnnouncements: active + non-expired badge definitions
            //   keyed by route_name for O(1) lookup in sidebar nav
            // navCounts: live counts for Order Tasks + Pre-Orders badges
            'featureAnnouncements' => fn () => $this->resolveFeatureAnnouncements(),
            'navCounts'            => fn () => $this->resolveNavCounts($request),
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Returns active quick links visible to the current user's roles.
     * Used by AppLauncherModal on every page load.
     */
    private function resolveQuickLinks(Request $request): array
    {
        if (! $request->user()) {
            return [];
        }

        $roleNames = $request->user()->getRoleNames()->toArray();

        return QuickLink::active()
            ->get()
            ->filter(fn ($link) => $link->isVisibleToRoles($roleNames))
            ->map(fn ($link) => [
                'id'         => $link->id,
                'label'      => $link->label,
                'icon'       => $link->icon,
                'route_name' => $link->route_name,
                'sort_order' => $link->sort_order,
            ])
            ->values()
            ->toArray();
    }

     /**
     * Returns visible feature announcements keyed by route_name.
     * sidebar nav uses this for O(1) badge lookup per nav item.
     * No auth check — announcements are role-agnostic for now.
     */
    private function resolveFeatureAnnouncements(): array
    {
        return FeatureAnnouncement::visible()
            ->get()
            ->keyBy('route_name')
            ->map(fn ($a) => [
                'badge_label' => $a->badge_label,
                'badge_type'  => $a->badge_type,
            ])
            ->toArray();
    }

    /**
     * Returns live counts for nav badge dots.
     * Currently tracks:
     *   - order_tasks: pending + claimed count
     *   - pre_orders:  pending count
     *
     * Returns empty array when user is not authenticated.
     * Counts are only fetched when user is logged in — no extra query for guests.
     */
    private function resolveNavCounts(Request $request): array
    {
        if (! $request->user()) {
            return [];
        }

        return [
            // Order Tasks — pending + claimed need attention
            'order_tasks' => \App\Models\OrderTask::whereIn('status', ['pending', 'claimed'])
                ->whereNull('deleted_at')
                ->count(),

            // Pre-Orders — pending need confirmation
            'pre_orders' => \App\Models\PreOrder::where('status', 'pending')
                ->whereNull('deleted_at')
                ->count(),
        ];
    }

}
