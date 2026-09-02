<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        \App\Http\Middleware\HandleInertiaRequests::class,
        \App\Http\Middleware\SecurityHeaders::class,
        \App\Http\Middleware\ValidateSortColumn::class,
        \App\Http\Middleware\UpdateLastSeen::class,
    ]);

    // Route middleware aliases — applied selectively per route group
    $middleware->alias([
        'maintenance' => \App\Http\Middleware\CheckMaintenanceMode::class,
        'coming.soon' => \App\Http\Middleware\CheckComingSoon::class,
    ]);

        $middleware->validateCsrfTokens(except: [
            // No exemptions — POS sales use Inertia (auto CSRF), not raw axios
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {

        // Helper — detect surface from request URL path
        $resolveSurface = function (string $path): string {
            if (str_starts_with($path, '/backend/pos')) return 'pos';
            if (str_starts_with($path, '/backend')) return 'backend';
            return 'public';
        };

        // 404 — Not Found
        $exceptions->render(function (NotFoundHttpException $e, Request $request) use ($resolveSurface) {
            if ($request->expectsJson()) return null;

            $surface = $resolveSurface($request->getPathInfo());

            if ($surface === 'public') {
                return Inertia::render('Error/PublicNotFound')
                    ->toResponse($request)
                    ->setStatusCode(404);
            }

            return Inertia::render('Error/NotFound', ['surface' => $surface])
                ->toResponse($request)
                ->setStatusCode(404);
        });

        // 405 — Method Not Allowed (correct route, wrong HTTP verb)
        $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) use ($resolveSurface) {
            if ($request->expectsJson()) return null;

            $surface = $resolveSurface($request->getPathInfo());

            if ($surface === 'public') {
                return Inertia::render('Error/PublicNotFound')
                    ->toResponse($request)
                    ->setStatusCode(405);
            }

            return Inertia::render('Error/NotFound', ['surface' => $surface])
                ->toResponse($request)
                ->setStatusCode(405);
        });

        // 500 — Internal Server Error (and other unhandled exceptions)
        $exceptions->render(function (\Throwable $e, Request $request) use ($resolveSurface) {
            // Only handle 500-level errors — let Laravel handle the rest normally
            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
            if ($status < 500) return null;
            if ($request->expectsJson()) return null;

            $surface = $resolveSurface($request->getPathInfo());

            return Inertia::render('Error/ServerError', ['surface' => $surface])
                ->toResponse($request)
                ->setStatusCode($status);
        });

    })->create();
