<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreInvestmentRequest;
use App\Http\Requests\Backend\UpdateInvestmentRequest;
use App\Models\Investment;
use App\Models\InvestmentType;
use App\Models\InvestorCapitalBalance;
use App\Models\InvestorProfitBalance;
use App\Models\CapitalLedgerEntry;
use App\Models\PartnerProfitBalance;
use App\Models\ProfitDistributionItem;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class InvestmentController extends Controller
{
    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        abort_unless(Gate::allows('investment.view'), 403);

        $query = Investment::with(['investmentType', 'creator'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = '%' . $request->search . '%';
                $q->where(function ($inner) use ($search) {
                    $inner->where('title', 'like', $search)
                        ->orWhere('investor_name', 'like', $search)
                        ->orWhere('reference', 'like', $search);
                });
            })
            ->when($request->filled('investment_type_id'), fn($q) =>
                $q->where('investment_type_id', $request->investment_type_id)
            )
            ->when($request->filled('status') && $request->status !== 'trashed', fn($q) =>
                $q->where('status', $request->status)
            )
            ->when($request->status === 'trashed', fn($q) =>
                $q->onlyTrashed()
            )
            ->when($request->filled('date_from'), fn($q) =>
                $q->whereDate('investment_date', '>=', $request->date_from)
            )
            ->when($request->filled('date_to'), fn($q) =>
                $q->whereDate('investment_date', '<=', $request->date_to)
            )
            ->when($request->filled('amount_min'), fn($q) =>
                $q->where('amount', '>=', $request->amount_min)
            )
            ->when($request->filled('amount_max'), fn($q) =>
                $q->where('amount', '<=', $request->amount_max)
            )
            ->latest('investment_date')
            ->latest('id');

        $investments = $query->paginate(15)->withQueryString();

        $investments->getCollection()->each(function ($investment) {
            $investment->append(['attachment_url']);
        });

        $stats           = $this->getStats();
        $investmentTypes = InvestmentType::orderBy('name')->get(['id', 'name']);

        $can = [
            'create'  => Gate::allows('investment.create'),
            'edit'    => Gate::allows('investment.edit'),
            'delete'  => Gate::allows('investment.delete'),
            'restore' => Gate::allows('investment.restore'),
        ];

        return Inertia::render('Backend/Investments/Index', [
            'investments'     => $investments,
            'stats'           => $stats,
            'investmentTypes' => $investmentTypes,
            'filters'         => $request->only([
                'search', 'investment_type_id', 'status',
                'date_from', 'date_to', 'amount_min', 'amount_max',
            ]),
            'can' => $can,
        ]);
    }

    // -------------------------------------------------------------------------
    // Store
    // -------------------------------------------------------------------------

    public function store(StoreInvestmentRequest $request): RedirectResponse
    {
        abort_unless(Gate::allows('investment.create'), 403);

        $data               = $request->validated();
        $data['created_by'] = Auth::id();

        if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment')
                ->store('investments', 'public');
        }

        $investment = Investment::create($data);

        ActivityLogService::log(
            'investment',
            'create',
            "Investment created: {$investment->title} by {$investment->investor_name} — Amount: {$investment->amount}",
            $investment,
            ['title' => $investment->title, 'investor_name' => $investment->investor_name, 'amount' => $investment->amount]
        );

        return back()->with('success', 'Investment created successfully.');
    }

    // -------------------------------------------------------------------------
    // Show
    // -------------------------------------------------------------------------

    public function show(int $id): Response
    {
        abort_unless(Gate::allows('investment.view'), 403);

        $investment = Investment::withTrashed()
            ->with([
                'investmentType',
                'creator',
                'updater',
                // Load linked partner with its profit balance (Gap 1.5 — optional card)
                'partner.profitBalance',
            ])
            ->findOrFail($id);

        // ── Capital Balance ────────────────────────────────────────────────────
        $capitalBalance = InvestorCapitalBalance::where('investment_id', $id)->first();

        if ($capitalBalance) {
            // Recompute lock status from live sales on every page load (Gap 4.1 pattern)
            $capitalBalance->computeAndSaveUnlockStatus(
                $investment->investment_date
            );
            $capitalBalance->refresh();
        }

        // ── Profit Balance (investment-based distributions only) ───────────────
        $profitBalance = InvestorProfitBalance::where('investment_id', $id)->first();

        // ── Recent Capital Ledger Entries (last 5) ────────────────────────────
        $recentCapitalEntries = CapitalLedgerEntry::where('investment_id', $id)
            ->whereIn('status', ['completed', 'approved'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get(['id', 'transaction_type', 'direction', 'amount',
                   'running_balance', 'reference_no', 'status', 'created_at']);

        // ── Recent Profit Distribution Payments (last 5, investment-based) ────
        $recentProfitItems = ProfitDistributionItem::where('investment_id', $id)
            ->whereNotIn('payment_status', ['pending', 'cancelled'])
            ->with(['profitDistribution:id,distribution_no,period_start,period_end,status'])
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get(['id', 'profit_distribution_id', 'share_percent',
                   'share_amount', 'payment_status', 'updated_at']);

        // ── Partner Profit Balance (if investment is linked to a partner) ──────
        $partnerProfitBalance = null;
        if ($investment->partner_id && $investment->partner) {
            $partnerProfitBalance = $investment->partner->profitBalance;
        }

        $can = [
            'edit'    => Gate::allows('investment.edit'),
            'delete'  => Gate::allows('investment.delete'),
            'restore' => Gate::allows('investment.restore'),
        ];

        return Inertia::render('Backend/Investments/Show', [
            'investment' => array_merge($investment->toArray(), [
                'attachment_url'       => $investment->attachment_url,
                'is_attachment_image'  => $investment->isAttachmentImage(),
                'attachment_extension' => $investment->attachment_extension,
            ]),
            'investmentTypes'      => InvestmentType::orderBy('name')->get(['id', 'name']),
            // Gap 1.5 — Financial Summary data
            'capitalBalance'       => $capitalBalance,
            'profitBalance'        => $profitBalance,
            'recentCapitalEntries' => $recentCapitalEntries,
            'recentProfitItems'    => $recentProfitItems,
            'partnerProfitBalance' => $partnerProfitBalance,
            'can'                  => $can,
        ]);
    }

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------

    public function update(UpdateInvestmentRequest $request, int $id): RedirectResponse
    {
        abort_unless(Gate::allows('investment.edit'), 403);

        $investment         = Investment::findOrFail($id);
        $data               = $request->validated();
        $data['updated_by'] = Auth::id();

        if ($request->hasFile('attachment')) {
            if ($investment->attachment) {
                Storage::disk('public')->delete($investment->attachment);
            }
            $data['attachment'] = $request->file('attachment')
                ->store('investments', 'public');
        } elseif ($request->input('remove_attachment') && $investment->attachment) {
            Storage::disk('public')->delete($investment->attachment);
            $data['attachment'] = null;
        }

        $investment->update($data);

        ActivityLogService::log(
            'investment',
            'update',
            "Investment updated: {$investment->title} by {$investment->investor_name} — Amount: {$investment->amount}",
            $investment,
            ['title' => $investment->title, 'investor_name' => $investment->investor_name, 'amount' => $investment->amount]
        );

        return back()->with('success', 'Investment updated successfully.');
    }

    // -------------------------------------------------------------------------
    // Destroy
    // -------------------------------------------------------------------------

    public function destroy(int $id): RedirectResponse
    {
        abort_unless(Gate::allows('investment.delete'), 403);

        $investment = Investment::findOrFail($id);

        ActivityLogService::log(
            'investment',
            'delete',
            "Investment deleted: {$investment->title} by {$investment->investor_name} — Amount: {$investment->amount}",
            $investment,
            ['title' => $investment->title, 'investor_name' => $investment->investor_name, 'amount' => $investment->amount]
        );

        $investment->delete();

        return back()->with('success', 'Investment deleted successfully.');
    }

    // -------------------------------------------------------------------------
    // Restore
    // -------------------------------------------------------------------------

    public function restore(int $id): RedirectResponse
    {
        abort_unless(Gate::allows('investment.restore'), 403);

        $investment = Investment::onlyTrashed()->findOrFail($id);
        $investment->restore();

        ActivityLogService::log(
            'investment',
            'restore',
            "Investment restored: {$investment->title} by {$investment->investor_name} — Amount: {$investment->amount}",
            $investment,
            ['title' => $investment->title, 'investor_name' => $investment->investor_name, 'amount' => $investment->amount]
        );

        return back()->with('success', 'Investment restored successfully.');
    }

    // -------------------------------------------------------------------------
    // Stats (private helper)
    // -------------------------------------------------------------------------

    private function getStats(): array
    {
        $base = Investment::query();

        return [
            'today' => (clone $base)
                ->whereDate('investment_date', today())
                ->sum('amount'),
            'this_week' => (clone $base)
                ->whereBetween('investment_date', [
                    now()->startOfWeek(),
                    now()->endOfWeek(),
                ])
                ->sum('amount'),
            'this_month' => (clone $base)
                ->whereMonth('investment_date', now()->month)
                ->whereYear('investment_date', now()->year)
                ->sum('amount'),
            'total_active' => (clone $base)
                ->where('status', 'active')
                ->sum('amount'),
            'total_withdrawn' => (clone $base)
                ->where('status', 'withdrawn')
                ->sum('amount'),
        ];
    }
}
