<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerProfitEligibility;
use App\Services\PartnerEligibilityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PartnerEligibilityController extends Controller
{
    public function __construct(private PartnerEligibilityService $eligibilityService)
    {
    }

    // -----------------------------------------------------------------------
    // Store — create a new eligibility record
    // -----------------------------------------------------------------------

    public function store(Request $request, Partner $partner): RedirectResponse
    {
        abort_unless(Gate::allows('create', PartnerProfitEligibility::class), 403);

        $validated = $request->validate([
            'profit_start_date' => ['required', 'date'],
            'profit_end_date'   => ['nullable', 'date', 'after:profit_start_date'],
            'applies_to'        => ['required', 'in:capital,working,product,all'],
        ]);

        try {
            $this->eligibilityService->create($partner, $validated);
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->back()->with('success', 'Profit eligibility created successfully.');
    }

    // -----------------------------------------------------------------------
    // Pause — pause an active eligibility record
    // -----------------------------------------------------------------------

    public function pause(Request $request, Partner $partner, PartnerProfitEligibility $eligibility): RedirectResponse
    {
        abort_unless(Gate::allows('pause', PartnerProfitEligibility::class), 403);
        abort_unless($eligibility->partner_id === $partner->id, 404);

        $validated = $request->validate([
            'pause_reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        try {
            $this->eligibilityService->pause($eligibility, $validated['pause_reason']);
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->back()->with('success', 'Profit eligibility paused.');
    }

    // -----------------------------------------------------------------------
    // Resume — resume a paused eligibility record (creates new active record)
    // -----------------------------------------------------------------------

    public function resume(Request $request, Partner $partner, PartnerProfitEligibility $eligibility): RedirectResponse
    {
        abort_unless(Gate::allows('resume', PartnerProfitEligibility::class), 403);
        abort_unless($eligibility->partner_id === $partner->id, 404);

        $validated = $request->validate([
            'resume_date'    => ['required', 'date'],
            'profit_end_date' => ['nullable', 'date', 'after:resume_date'],
        ]);

        try {
            $this->eligibilityService->resume(
                $eligibility,
                $validated['resume_date'],
                $validated['profit_end_date'] ?? null,
            );
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->back()->with('success', 'Profit eligibility resumed. A new active record has been created.');
    }

    // -----------------------------------------------------------------------
    // End — end an active eligibility record
    // -----------------------------------------------------------------------

    public function end(Request $request, Partner $partner, PartnerProfitEligibility $eligibility): RedirectResponse
    {
        abort_unless(Gate::allows('end', PartnerProfitEligibility::class), 403);
        abort_unless($eligibility->partner_id === $partner->id, 404);

        try {
            $this->eligibilityService->end($eligibility);
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->back()->with('success', 'Profit eligibility ended.');
    }
}
