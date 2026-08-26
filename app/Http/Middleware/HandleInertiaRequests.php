<?php

namespace App\Http\Middleware;

use App\Services\SettingsService;
use App\Models\UserPreference;
use Illuminate\Http\Request;
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
                        'theme' => \App\Models\UserPreference::DEFAULT_THEME,
                        'ui'    => \App\Models\UserPreference::DEFAULT_UI,
                    ];
                }

                $pref = \App\Models\UserPreference::findOrCreateForUser(
                    $request->user()->id
                );

                return [
                    'theme' => $pref->getTheme(),
                    'ui'    => $pref->getUi(),
                ];
            },
        ]);
    }
}
