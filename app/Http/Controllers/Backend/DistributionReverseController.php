<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\ReverseDistributionRequest;
use App\Models\ProfitDistribution;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class DistributionReverseController extends Controller
{
    /**
     * POST /backend/profit-distributions/{id}/reverse
     * Reverse an approved or distributed distribution back to draft.
     */
    public function __invoke(
        ReverseDistributionRequest $request,
        int $id
    ): RedirectResponse {
        abort_unless(
            Gate::allows('profit_distribution.reverse'),
            403,
            'You do not have permission to reverse distributions.'
        );

        // Use withTrashed so soft-deleted distributions can still be found
        // if needed, but in practice only active records should be reversible.
        $distribution = ProfitDistribution::withoutTrashed()->findOrFail($id);

        abort_unless(
            $distribution->canBeReversed(),
            422,
            'Only approved or distributed distributions can be reversed.'
        );

        $reason = $request->input('reason');

        try {
            DB::transaction(function () use ($distribution, $reason) {
                $distribution->reverse($reason);

                ActivityLogService::log(
                    'profit_distribution',
                    'reversed',
                    "Distribution {$distribution->distribution_no} reversed back to draft. " .
                    "Reason: {$reason}",
                    $distribution,
                    [
                        'distribution_no'  => $distribution->distribution_no,
                        'previous_status'  => $distribution->getOriginal('status'),
                        'reason'           => $reason,
                        'items_count'      => $distribution->items()->count(),
                    ]
                );
            });
        } catch (\RuntimeException $e) {
            return back()->withErrors([
                'reverse' => $e->getMessage(),
            ]);
        }

        return redirect()
            ->route('backend.profit-distributions.show', $distribution->id)
            ->with('success', "Distribution {$distribution->distribution_no} has been reversed to draft.");
    }
}
