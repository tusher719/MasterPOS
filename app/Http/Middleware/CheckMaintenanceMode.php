<?php

namespace App\Http\Middleware;

use App\Services\SettingsService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    public function handle(Request $request, Closure $next): Response
    {
        $settings = SettingsService::all();
        $enabled  = ($settings['maintenance_mode_enabled'] ?? 'false') === 'true';

        if (! $enabled) {
            return $next($request);
        }

        // Super Admin (role name: 'Admin', id: 1) can still access.
        // Some installs do not include the roles package, so fall back to the
        // built-in admin id check when the helper method is unavailable.
        $user = Auth::user();
        if ($user && (
            $user->id === 1
            || (method_exists($user, 'hasRole') && $user->hasRole('Admin'))
        )) {
            return $next($request);
        }

        // JSON requests get a plain 503
        if ($request->expectsJson()) {
            return response()->json(['message' => 'Service Unavailable'], 503);
        }

        return Inertia::render('Maintenance/MaintenancePage', [
            'message' => $settings['maintenance_message']
                ?? 'We are currently performing scheduled maintenance.',
        ])
            ->toResponse($request)
            ->setStatusCode(503);
    }
}
