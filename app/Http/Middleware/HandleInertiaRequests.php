<?php

namespace App\Http\Middleware;

use App\Services\SettingsService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],

            'auth' => [
                'user' => $request->user(),
            ],

            // Global notification data for the topbar
            'notifications' => fn () => $request->user()
                ? [
                    'unread_count' => $request->user()->unreadNotifications()->count(),

                    'latest' => $request->user()
                        ->notifications()
                        ->select([
                            'id',
                            'data',
                            'read_at',
                            'created_at',
                        ])
                        ->latest()
                        ->limit(8)
                        ->get()
                        ->map(fn ($notification) => [
                            'id'         => $notification->id,
                            'data'       => $notification->data,
                            'read_at'    => $notification->read_at,
                            'created_at' => $notification->created_at->diffForHumans(),
                        ]),
                ]
                : [
                    'unread_count' => 0,
                    'latest'       => [],
                ],
            // Global settings map — cache-backed, invalidated on every update
            'settings' => SettingsService::all(),
        ];
    }
}
