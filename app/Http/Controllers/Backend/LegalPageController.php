<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\LegalPage;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LegalPageController extends Controller
{
    // -------------------------------------------------------------------------
    // Backend — called from Settings → Privacy & Terms tab
    // -------------------------------------------------------------------------

    /**
     * Return both legal pages as JSON for the Settings tab.
     * Used by HandleInertiaRequests shared props OR direct Settings render.
     */
    public function index(): \Illuminate\Http\JsonResponse
    {
        abort_unless(Gate::allows('legal_page.view'), 403);

        $pages = LegalPage::with('updatedBy:id,name')
            ->orderBy('type')
            ->get()
            ->map(fn ($page) => [
                'id'           => $page->id,
                'type'         => $page->type,
                'type_label'   => $page->type_label,
                'slug'         => $page->slug,
                'title'        => $page->title,
                'content'      => $page->content,
                'is_visible'   => $page->is_visible,
                'updated_by'   => $page->updatedBy?->name,
                'updated_at'   => $page->updated_at?->diffForHumans(),
            ]);

        return response()->json($pages);
    }

    /**
     * Save title, content, and is_visible for one legal page.
     */
    public function update(Request $request, LegalPage $legalPage): RedirectResponse
    {
        abort_unless(Gate::allows('legal_page.edit'), 403);

        $validated = $request->validate([
            'title'      => ['required', 'string', 'max:255'],
            'content'    => ['nullable', 'string'],
            'is_visible' => ['required', 'boolean'],
        ]);

        $legalPage->fill([
            'title'      => $validated['title'],
            'content'    => $validated['content'] ?? null,
            'is_visible' => $validated['is_visible'],
            'updated_by' => Auth::id(),
        ])->save();

        ActivityLogService::log(
            'legal_pages',
            'update',
            "Updated {$legalPage->type_label} — visible: " . ($legalPage->is_visible ? 'yes' : 'no'),
            $legalPage,
            ['type' => $legalPage->type, 'is_visible' => $legalPage->is_visible]
        );

        return back()->with('success', "{$legalPage->type_label} updated successfully.");
    }

    /**
     * Toggle is_visible only — quick action from the tab header.
     */
    public function toggleVisibility(Request $request, LegalPage $legalPage): RedirectResponse
    {
        abort_unless(Gate::allows('legal_page.edit'), 403);

        $legalPage->fill([
            'is_visible' => ! $legalPage->is_visible,
            'updated_by' => Auth::id(),
        ])->save();

        $state = $legalPage->is_visible ? 'visible' : 'hidden';

        ActivityLogService::log(
            'legal_pages',
            'update',
            "Toggled {$legalPage->type_label} visibility — now {$state}",
            $legalPage,
            ['is_visible' => $legalPage->is_visible]
        );

        return back()->with('success', "{$legalPage->type_label} is now {$state}.");
    }

    // -------------------------------------------------------------------------
    // Public — storefront routes (no auth required)
    // -------------------------------------------------------------------------

    /**
     * Show a public legal page by slug.
     * Slug: privacy-policy | terms-conditions
     */
    public function show(string $slug): Response|\Illuminate\Http\Response
    {
        $typeMap = [
            'privacy-policy'   => 'privacy_policy',
            'terms-conditions' => 'terms_conditions',
        ];

        // Unknown slug → 404
        abort_unless(isset($typeMap[$slug]), 404);

        $page = LegalPage::where('type', $typeMap[$slug])->firstOrFail();

        // Not visible → 404
        if (! $page->is_visible) {
            abort(404);
        }

        return Inertia::render('Legal/Show', [
            'page' => [
                'type'       => $page->type,
                'type_label' => $page->type_label,
                'title'      => $page->title,
                'content'    => $page->content,
                'updated_at' => $page->updated_at?->format('F j, Y'),
            ],
        ]);
    }
}
