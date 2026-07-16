<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\CapitalLedgerEntry;
use App\Models\InvestmentFundUsage;
use App\Services\InvestmentFundUsageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class InvestmentFundUsageController extends Controller
{
    public function __construct(
        private readonly InvestmentFundUsageService $service
    ) {}

    // ─── Store ────────────────────────────────────────────────────

    public function store(Request $request, CapitalLedgerEntry $capitalLedgerEntry): RedirectResponse
    {
        abort_unless(Gate::allows('fund_usage.create'), 403);

        $validated = $request->validate([
            'usable_type' => ['required', 'string', 'in:purchase,expense'],
            'usable_id'   => ['required', 'integer', 'min:1'],
            'amount'      => ['required', 'numeric', 'min:0.01'],
            'note'        => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $this->service->create($capitalLedgerEntry, $validated);

            return redirect()
                ->back()
                ->with('success', 'Fund usage linked successfully.');

        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    // ─── Destroy ──────────────────────────────────────────────────

    public function destroy(
        CapitalLedgerEntry $capitalLedgerEntry,
        InvestmentFundUsage $investmentFundUsage
    ): RedirectResponse {
        abort_unless(Gate::allows('fund_usage.delete'), 403);

        // Cross-entry guard
        abort_unless(
            $investmentFundUsage->capital_ledger_entry_id === $capitalLedgerEntry->id,
            404
        );

        try {
            $this->service->delete($investmentFundUsage);

            return redirect()
                ->back()
                ->with('success', 'Fund usage unlinked successfully.');

        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }
}
