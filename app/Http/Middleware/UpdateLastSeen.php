<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastSeen
{
    public function handle(Request $request, Closure $next): Response
    {
        // Only update for authenticated web staff/users
        if (Auth::guard('web')->check()) {
            $user = Auth::guard('web')->user();

            if ($user instanceof \App\Models\User) {
                $cacheKey = "user_last_seen_{$user->id}";

                // Throttle: update DB at most once per minute per user
                // Cache acts as a gate — if key exists, skip the DB write
                if (!Cache::has($cacheKey)) {
                    $user->last_seen_at = now();
                    $user->save();

                    // Lock for 60 seconds — next update allowed after 1 minute
                    Cache::put($cacheKey, true, 60);
                }
            }
        }

        return $next($request);
    }
}
