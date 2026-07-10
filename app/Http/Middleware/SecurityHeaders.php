<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        $isLocal = app()->environment('local');

        $scriptSrc = $isLocal
            ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://[::1]:* ws://localhost:* ws://[::1]:* blob:"
            : "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:";

        $styleSrc = $isLocal
            ? "style-src 'self' 'unsafe-inline' https://fonts.bunny.net https://fonts.googleapis.com"
            : "style-src 'self' 'unsafe-inline' https://fonts.bunny.net https://fonts.googleapis.com";

        $response->headers->set(
            'Content-Security-Policy',
            implode('; ', [
                "default-src 'self'",
                $scriptSrc,
                $styleSrc,
                "img-src 'self' data: blob:",
                "font-src 'self' data: https://fonts.bunny.net https://fonts.gstatic.com",
                "connect-src 'self'" . ($isLocal ? " ws://localhost:* ws://[::1]:* http://localhost:* http://[::1]:*" : ""),
                "frame-ancestors 'self'",
                "form-action 'self'",
                "base-uri 'self'",
            ])
        );

        return $response;
    }
}
