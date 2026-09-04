<?php
// app/Http/Controllers/Backend/FeatureAnnouncementController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\FeatureAnnouncement;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class FeatureAnnouncementController extends Controller
{
    // ── Index — JSON endpoint for Settings tab ────────────────────────────────
    // GET /backend/feature-announcements
    public function index()
    {
        abort_unless(Gate::allows('feature_announcement.view'), 403);

        $announcements = FeatureAnnouncement::orderBy('show_until', 'desc')
            ->get()
            ->map(fn ($a) => [
                'id'          => $a->id,
                'label'       => $a->label,
                'route_name'  => $a->route_name,
                'badge_type'  => $a->badge_type,
                'badge_text'  => $a->badge_text,
                'badge_label' => $a->badge_label,   // computed accessor
                'show_until'  => $a->show_until->toDateString(),
                'is_active'   => $a->is_active,
                'is_expired'  => $a->is_expired,    // computed accessor
            ]);

        return response()->json($announcements);
    }

    // ── Store ─────────────────────────────────────────────────────────────────
    // POST /backend/feature-announcements
    public function store(Request $request)
    {
        abort_unless(Gate::allows('feature_announcement.create'), 403);

        $data = $request->validate([
            'label'      => ['required', 'string', 'max:60'],
            'route_name' => ['required', 'string', 'max:120'],
            'badge_type' => ['required', Rule::in(['new', 'hot', 'beta', 'custom'])],
            'badge_text' => ['nullable', 'string', 'max:20', 'required_if:badge_type,custom'],
            'show_until' => ['required', 'date', 'after_or_equal:today'],
            'is_active'  => ['boolean'],
        ]);

        $announcement = FeatureAnnouncement::create($data);

        ActivityLogService::log(
            'feature_announcements',
            'create',
            "Created feature announcement: {$announcement->label}",
            $announcement,
        );

        return back()->with('success', 'Announcement created.');
    }

    // ── Update ────────────────────────────────────────────────────────────────
    // PUT /backend/feature-announcements/{featureAnnouncement}
    public function update(Request $request, FeatureAnnouncement $featureAnnouncement)
    {
        abort_unless(Gate::allows('feature_announcement.edit'), 403);

        $data = $request->validate([
            'label'      => ['required', 'string', 'max:60'],
            'route_name' => ['required', 'string', 'max:120'],
            'badge_type' => ['required', Rule::in(['new', 'hot', 'beta', 'custom'])],
            'badge_text' => ['nullable', 'string', 'max:20', 'required_if:badge_type,custom'],
            'show_until' => ['required', 'date'],
            'is_active'  => ['boolean'],
        ]);

        $featureAnnouncement->update($data);

        ActivityLogService::log(
            'feature_announcements',
            'update',
            "Updated feature announcement: {$featureAnnouncement->label}",
            $featureAnnouncement,
        );

        return back()->with('success', 'Announcement updated.');
    }

    // ── Destroy ───────────────────────────────────────────────────────────────
    // DELETE /backend/feature-announcements/{featureAnnouncement}
    public function destroy(FeatureAnnouncement $featureAnnouncement)
    {
        abort_unless(Gate::allows('feature_announcement.delete'), 403);

        ActivityLogService::log(
            'feature_announcements',
            'delete',
            "Deleted feature announcement: {$featureAnnouncement->label}",
            $featureAnnouncement,
        );

        $featureAnnouncement->delete();

        return back()->with('success', 'Announcement deleted.');
    }
}
