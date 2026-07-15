<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerProductAssignment;
use App\Services\ActivityLogService;
use App\Services\PartnerProductAssignmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PartnerProductAssignmentController extends Controller
{
    public function __construct(
        private PartnerProductAssignmentService $service
    ) {}

    public function store(Request $request, Partner $partner): RedirectResponse
    {
        abort_unless(Gate::allows('product_assignment.create'), 403);

        $validated = $request->validate([
            'assignable_id'        => ['required', 'integer', 'exists:products,id'],
            'effective_from'       => ['required', 'date'],
            'effective_to'         => ['nullable', 'date', 'after:effective_from'],
            'cost_return_enabled'  => ['boolean'],
            'profit_share_percent' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $assignment = $this->service->create($partner, $validated);

        ActivityLogService::log(
            'partner_product_assignment',
            'create',
            "Product assignment created for partner [{$partner->name}] — pending approval",
            $assignment,
            ['partner_id' => $partner->id, 'assignable_id' => $validated['assignable_id']]
        );

        return redirect()->back()->with('success', 'Product assignment created. Awaiting approval.');
    }

    public function update(Request $request, Partner $partner, PartnerProductAssignment $assignment): RedirectResponse
    {
        abort_unless(Gate::allows('product_assignment.edit'), 403);
        abort_unless($assignment->partner_id === $partner->id, 404);

        if ($assignment->is_approved) {
            return redirect()->back()->with('error', 'Approved assignments cannot be edited.');
        }

        $validated = $request->validate([
            'assignable_id'        => ['required', 'integer', 'exists:products,id'],
            'effective_from'       => ['required', 'date'],
            'effective_to'         => ['nullable', 'date', 'after:effective_from'],
            'cost_return_enabled'  => ['boolean'],
            'profit_share_percent' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $assignment = $this->service->update($assignment, $validated);

        ActivityLogService::log(
            'partner_product_assignment',
            'update',
            "Product assignment updated for partner [{$partner->name}]",
            $assignment,
            ['partner_id' => $partner->id]
        );

        return redirect()->back()->with('success', 'Product assignment updated.');
    }

    public function approve(Request $request, Partner $partner, PartnerProductAssignment $assignment): RedirectResponse
    {
        abort_unless(Gate::allows('product_assignment.approve'), 403);
        abort_unless($assignment->partner_id === $partner->id, 404);

        if ($assignment->is_approved) {
            return redirect()->back()->with('error', 'Assignment is already approved.');
        }

        $assignment = $this->service->approve($assignment);

        ActivityLogService::log(
            'partner_product_assignment',
            'approve',
            "Product assignment approved for partner [{$partner->name}]",
            $assignment,
            ['partner_id' => $partner->id, 'approved_by' => $assignment->approved_by]
        );

        return redirect()->back()->with('success', 'Product assignment approved successfully.');
    }

    public function destroy(Request $request, Partner $partner, PartnerProductAssignment $assignment): RedirectResponse
    {
        abort_unless(Gate::allows('product_assignment.edit'), 403);
        abort_unless($assignment->partner_id === $partner->id, 404);

        if ($assignment->is_approved) {
            return redirect()->back()->with('error', 'Approved assignments cannot be deleted.');
        }

        ActivityLogService::log(
            'partner_product_assignment',
            'delete',
            "Pending product assignment deleted for partner [{$partner->name}]",
            $assignment,
            ['partner_id' => $partner->id]
        );

        $this->service->delete($assignment);

        return redirect()->back()->with('success', 'Product assignment deleted.');
    }
}
