<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerProfitRule;
use App\Services\ActivityLogService;
use App\Services\PartnerRuleResolutionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class PartnerProfitRuleController extends Controller
{
    public function __construct(
        private readonly PartnerRuleResolutionService $resolutionService,
    ) {}

    // -------------------------------------------------------------------------
    // Store — Create a new profit rule for a partner
    // -------------------------------------------------------------------------

    public function store(Request $request, Partner $partner): RedirectResponse
    {
        abort_unless(Gate::allows('create', PartnerProfitRule::class), 403);

        $validated = $request->validate([
            'rule_type'      => ['required', 'in:fixed_percent,product_based,capital_based,mixed'],
            'profit_source'  => ['required', 'in:capital_share,working_share,product_share,custom'],
            'share_percent'  => ['required', 'numeric', 'min:0', 'max:100'],
            'effective_from' => ['required', 'date'],
            'reason'         => ['nullable', 'string', 'max:500'],
        ]);

        // Gap 2.1 — Partner type ↔ profit source validation
        $typeError = $this->resolutionService->validateProfitSourceForPartner(
            $partner,
            $validated['profit_source']
        );

        if ($typeError) {
            return back()
                ->withErrors(['profit_source' => $typeError])
                ->withInput();
        }

        DB::transaction(function () use ($validated, $partner) {
            $user = Auth::user();

            $rule = PartnerProfitRule::create([
                'partner_id'     => $partner->id,
                'rule_type'      => $validated['rule_type'],
                'profit_source'  => $validated['profit_source'],
                'share_percent'  => $validated['share_percent'],
                'effective_from' => $validated['effective_from'],
                'effective_to'   => null,
                'is_active'      => true,
                'reason'         => $validated['reason'] ?? null,
                'created_by'     => $user->id,
            ]);

            $rule->recordCreatedHistory($user);

            ActivityLogService::log(
                'partner_profit_rule',
                'create',
                "Profit rule created for partner: {$partner->name} (pending approval)",
                $rule,
                ['partner_id' => $partner->id, 'share_percent' => $rule->share_percent]
            );
        });

        return redirect()
            ->route('backend.partners.show', $partner)
            ->with('success', 'Profit rule created. Awaiting Super Admin approval.');
    }

    // -------------------------------------------------------------------------
    // Update — Edit a pending (unapproved) rule only
    // -------------------------------------------------------------------------

    public function update(Request $request, Partner $partner, PartnerProfitRule $profitRule): RedirectResponse
    {
        abort_unless(Gate::allows('edit', PartnerProfitRule::class), 403);

        // Only pending rules can be edited
        if ($profitRule->is_approved) {
            return redirect()
                ->route('backend.partners.show', $partner)
                ->with('error', 'Approved rules cannot be edited. Create a new rule instead.');
        }

        $validated = $request->validate([
            'rule_type'      => ['required', 'in:fixed_percent,product_based,capital_based,mixed'],
            'profit_source'  => ['required', 'in:capital_share,working_share,product_share,custom'],
            'share_percent'  => ['required', 'numeric', 'min:0', 'max:100'],
            'effective_from' => ['required', 'date'],
            'reason'         => ['nullable', 'string', 'max:500'],
        ]);

        // Gap 2.1 — Partner type ↔ profit source validation
        $typeError = $this->resolutionService->validateProfitSourceForPartner(
            $partner,
            $validated['profit_source']
        );

        if ($typeError) {
            return back()
                ->withErrors(['profit_source' => $typeError])
                ->withInput();
        }

        DB::transaction(function () use ($validated, $partner, $profitRule) {
            $user = Auth::user();

            // Capture previous values before update
            $previousValues = [
                'rule_type'      => $profitRule->rule_type,
                'profit_source'  => $profitRule->profit_source,
                'share_percent'  => $profitRule->share_percent,
                'effective_from' => $profitRule->effective_from->toDateString(),
                'reason'         => $profitRule->reason,
            ];

            $profitRule->update([
                'rule_type'      => $validated['rule_type'],
                'profit_source'  => $validated['profit_source'],
                'share_percent'  => $validated['share_percent'],
                'effective_from' => $validated['effective_from'],
                'reason'         => $validated['reason'] ?? null,
            ]);

            $profitRule->recordUpdatedHistory($user, $previousValues);

            ActivityLogService::log(
                'partner_profit_rule',
                'update',
                "Pending profit rule updated for partner: {$partner->name}",
                $profitRule,
                ['partner_id' => $partner->id, 'previous' => $previousValues]
            );
        });

        return redirect()
            ->route('backend.partners.show', $partner)
            ->with('success', 'Profit rule updated.');
    }

    // -------------------------------------------------------------------------
    // Approve — Super Admin only
    // -------------------------------------------------------------------------

    public function approve(Request $request, Partner $partner, PartnerProfitRule $profitRule): RedirectResponse
    {
        abort_unless(Gate::allows('approve', PartnerProfitRule::class), 403);

        if ($profitRule->is_approved) {
            return redirect()
                ->route('backend.partners.show', $partner)
                ->with('error', 'This rule has already been approved.');
        }

        DB::transaction(function () use ($partner, $profitRule) {
            $user = Auth::user();

            $profitRule->approve($user);

            ActivityLogService::log(
                'partner_profit_rule',
                'approve',
                "Profit rule approved for partner: {$partner->name}",
                $profitRule,
                [
                    'partner_id'     => $partner->id,
                    'share_percent'  => $profitRule->share_percent,
                    'effective_from' => $profitRule->effective_from->toDateString(),
                ]
            );
        });

        return redirect()
            ->route('backend.partners.show', $partner)
            ->with('success', 'Profit rule approved and is now active.');
    }

    // -------------------------------------------------------------------------
    // Destroy — Delete a pending rule only (no soft delete — rules not soft-deleted)
    // -------------------------------------------------------------------------

    public function destroy(Partner $partner, PartnerProfitRule $profitRule): RedirectResponse
    {
        abort_unless(Gate::allows('edit', PartnerProfitRule::class), 403);

        if ($profitRule->is_approved) {
            return redirect()
                ->route('backend.partners.show', $partner)
                ->with('error', 'Approved rules cannot be deleted.');
        }

        DB::transaction(function () use ($partner, $profitRule) {
            ActivityLogService::log(
                'partner_profit_rule',
                'delete',
                "Pending profit rule deleted for partner: {$partner->name}",
                $profitRule,
                ['partner_id' => $partner->id, 'share_percent' => $profitRule->share_percent]
            );

            // History records cascade via restrictOnDelete — log before delete
            $profitRule->delete();
        });

        return redirect()
            ->route('backend.partners.show', $partner)
            ->with('success', 'Pending profit rule deleted.');
    }
}
