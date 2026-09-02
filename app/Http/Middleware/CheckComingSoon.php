<?php

namespace App\Http\Middleware;

use App\Services\SettingsService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckComingSoon
{
    public function handle(Request $request, Closure $next): Response
    {
        $settings = SettingsService::all();
        $enabled  = ($settings['coming_soon_mode_enabled'] ?? 'false') === 'true';

        if (! $enabled) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Coming Soon'], 503);
        }

        return Inertia::render('Maintenance/ComingSoonPage', [
            'message' => $settings['coming_soon_message'] ?? 'Our website is coming soon!',
        ])
            ->toResponse($request)
            ->setStatusCode(503);
    }
}
