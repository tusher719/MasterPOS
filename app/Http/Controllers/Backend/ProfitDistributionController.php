<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreProfitDistributionRequest;
use App\Http\Requests\Backend\UpdateProfitDistributionRequest;
use App\Models\Expense;
use App\Models\Investment;
use App\Models\ProfitDistribution;
use App\Models\ProfitDistributionItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\ActivityLogService;
use App\Services\PartnerProfitBalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ProfitDistributionController extends Controller
{
    public function __construct(
        private PartnerProfitBalanceService $partnerBalanceService
    ) {}

    // -----------------------------------------------------------------------
    // Index
    // -----------------------------------------------------------------------

    public function index(Request $request): Response
    {
        abort_unless(Gate::allows('profit_distribution.view'), 403);

        $query = ProfitDistribution::with(['creator'])
            ->withCount('items');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('distribution_no', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($year = $request->input('year')) {
            $query->whereYear('distribution_date', $year);
        }

        $distributions = $query
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'total'             => ProfitDistribution::count(),
            'draft'             => ProfitDistribution::where('status', 'draft')->count(),
            'approved'          => ProfitDistribution::where('status', 'approved')->count(),
            'distributed'       => ProfitDistribution::where('status', 'distributed')->count(),
            'total_distributed' => ProfitDistribution::where('status', 'distributed')
                                    ->sum('distributable_amount'),
        ];

        $can = [
            'create'      => optional(Auth::user())->can('profit_distribution.create'),
            'edit'        => optional(Auth::user())->can('profit_distribution.edit'),
            'delete'      => optional(Auth::user())->can('profit_distribution.delete'),
            'restore'     => optional(Auth::user())->can('profit_distribution.restore'),
            'approve'     => optional(Auth::user())->can('profit_distribution.approve'),
            'reverse'     => optional(Auth::user())->can('profit_distribution.reverse'),
            'payment'     => optional(Auth::user())->can('profit_distribution.payment'),
            'eligibility' => optional(Auth::user())->can('profit_distribution.eligibility'),
        ];

        return Inertia::render('Backend/ProfitDistributions/Index', [
            'distributions' => $distributions,
            'stats'         => $stats,
            'filters'       => $request->only(['search', 'status', 'year']),
            'can'           => $can,
        ]);
    }

    // -----------------------------------------------------------------------
    // Create
    // -----------------------------------------------------------------------

    public function create(): Response
    {
        abort_unless(optional(Auth::user())->can('profit_distribution.create'), 403);

        return Inertia::render('Backend/ProfitDistributions/Create', [
            'can' => ['create' => true],
        ]);
    }

    // -----------------------------------------------------------------------
    // Calculate Preview (AJAX)
    // -----------------------------------------------------------------------

    public function calculatePreview(Request $request): JsonResponse
    {
        abort_unless(optional(Auth::user())->can('profit_distribution.create')
            || optional(Auth::user())->can('profit_distribution.edit'), 403);

        $request->validate([
            'period_start'         => ['required', 'date'],
            'period_end'           => ['required', 'date', 'after_or_equal:period_start'],
            'distribution_percent' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $start = $request->input('period_start');
        $end   = $request->input('period_end');
        $pct   = (float) $request->input('distribution_percent', 100);

        $totalRevenue = Sale::whereBetween('sale_date', [$start, $end])->sum('grand_total');

        $totalCogs = SaleItem::whereHas('sale', function ($q) use ($start, $end) {
                $q->whereBetween('sale_date', [$start, $end]);
            })
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->selectRaw('SUM(sale_items.quantity * products.average_cost) as cogs')
            ->value('cogs') ?? 0;

        $totalExpenses = Expense::whereBetween('expense_date', [$start, $end])->sum('amount');

        $grossProfit         = $totalRevenue - $totalCogs;
        $netProfit           = $grossProfit - $totalExpenses;
        $distributableAmount = round($netProfit * ($pct / 100), 2);

        $investments     = Investment::with('investmentType')->where('status', 'active')->get();
        $totalInvestment = $investments->sum('amount');

        $items = $investments->map(function ($inv) use ($totalInvestment, $distributableAmount) {
            $sharePercent = $totalInvestment > 0
                ? round(($inv->amount / $totalInvestment) * 100, 4)
                : 0;
            $shareAmount = round(($sharePercent / 100) * $distributableAmount, 2);

            return [
                'investment_id'    => $inv->id,
                'investor_name'    => $inv->investor_name,
                'investment_title' => $inv->title,
                'investment_type'  => $inv->investmentType?->name ?? '—',
                'invested_amount'  => $inv->amount,
                'share_percent'    => $sharePercent,
                'share_amount'     => $shareAmount,
                'note'             => null,
            ];
        });

        return response()->json([
            'total_revenue'        => round((float) $totalRevenue, 2),
            'total_cogs'           => round((float) $totalCogs, 2),
            'total_expenses'       => round((float) $totalExpenses, 2),
            'total_investment'     => round((float) $totalInvestment, 2),
            'gross_profit'         => round((float) $grossProfit, 2),
            'net_profit'           => round((float) $netProfit, 2),
            'distribution_percent' => $pct,
            'distributable_amount' => max(0, $distributableAmount),
            'items'                => $items,
        ]);
    }

    // -----------------------------------------------------------------------
    // Store
    // -----------------------------------------------------------------------

    public function store(StoreProfitDistributionRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $sourceType = $validated['source_type'] ?? 'investment_based';
        if ($sourceType === 'partner_based') {
            $eligibleCheck = array_filter(
                $validated['items'],
                fn($item) => ($item['is_eligible'] ?? true) !== false
                            && (float) ($item['share_amount'] ?? 0) > 0
            );
            if (empty($eligibleCheck)) {
                return back()
                    ->withErrors(['items' => 'No eligible partners with payable amounts found for this period. All partners may have already been paid.'])
                    ->withInput();
            }
        }

        DB::transaction(function () use ($validated) {
            $distributionNo = ProfitDistribution::generateDistributionNo();

            $distribution = ProfitDistribution::create([
                'distribution_no'      => $distributionNo,
                'title'                => $validated['title'],
                'distribution_date'    => $validated['distribution_date'],
                'period_start'         => $validated['period_start'],
                'period_end'           => $validated['period_end'],
                'total_revenue'        => $validated['total_revenue'],
                'total_cogs'           => $validated['total_cogs'],
                'total_expenses'       => $validated['total_expenses'],
                'total_investment'     => $validated['total_investment'],
                'gross_profit'         => $validated['gross_profit'],
                'net_profit'           => $validated['net_profit'],
                'distribution_percent' => $validated['distribution_percent'],
                'distributable_amount' => $validated['distributable_amount'],
                'note'                 => $validated['note'] ?? null,
                'status'               => 'draft',
                'is_locked'            => false,
                'created_by'           => Auth::id(),
                'updated_by'           => Auth::id(),
            ]);

            $eligibleItems = array_filter(
                $validated['items'],
                fn($item) => ($item['is_eligible'] ?? true) !== false
                            && (float) ($item['share_amount'] ?? 0) > 0
            );

            $items = array_map(fn($item) => [
                'profit_distribution_id' => $distribution->id,
                'investment_id'          => $item['investment_id'] ?? null,
                'investor_name'          => $item['investor_name'] ?? ($item['partner_name'] ?? null),
                'investment_title'       => $item['investment_title'] ?? ($item['partner_code'] ?? null),
                'investment_type'        => $item['investment_type'] ?? ($item['rule_type'] ?? 'partner_based'),
                'invested_amount'        => $item['invested_amount'] ?? null,
                'partner_id'             => $item['partner_id'] ?? null,
                'profit_rule_snapshot'   => isset($item['profit_rule_snapshot'])
                    ? json_encode($item['profit_rule_snapshot'])
                    : null,
                'settlement_type'        => $item['settlement_type'] ?? null,
                'share_percent'          => $item['share_percent'],
                'share_amount'           => $item['share_amount'],
                // Gap 4.2 — persist cost return portion separately
                'cost_return_amount'     => $item['cost_return_amount'] ?? 0,
                'note'                   => $item['note'] ?? null,
                'payment_status'         => 'pending',
                'created_at'             => now(),
                'updated_at'             => now(),
            ], $eligibleItems);

            ProfitDistributionItem::insert(array_values($items));

            ActivityLogService::log(
                'profit_distribution',
                'create',
                "Profit Distribution {$distribution->distribution_no} created as draft.",
                $distribution,
                ['distribution_no' => $distribution->distribution_no]
            );
        });

        return redirect()
            ->route('backend.profit-distributions.index')
            ->with('success', 'Profit Distribution created successfully.');
    }

    // -----------------------------------------------------------------------
    // Show
    // -----------------------------------------------------------------------

    public function show(ProfitDistribution $profitDistribution): Response
    {
        abort_unless(optional(Auth::user())->can('profit_distribution.view'), 403);

        $profitDistribution->load([
            'items.paidByUser',
            'items.payments.paidBy',
            'eligibilities',
            'creator',
            'updater',
            'approver',
            'distributor',
        ]);

        $profitDistribution->append([
            'paid_items_count',
            'pending_items_count',
            'total_paid_amount',
        ]);

        $profitDistribution->items->each(function ($item) {
            $item->append([]);
            $item->setAttribute('remaining_amount', (float) $item->remainingAmount());
            $item->setAttribute('effective_amount', (float) $item->effectiveAmount());
            $item->setAttribute('total_paid',       (float) $item->totalPaid());
            $item->setAttribute('isFullySettled',   $item->isFullySettled());
        });

        $can = [
            'edit'           => optional(Auth::user())->can('profit_distribution.edit')
                                    && ! $profitDistribution->is_locked,
            'delete'         => optional(Auth::user())->can('profit_distribution.delete')
                                    && ! $profitDistribution->is_locked,
            'approve'        => optional(Auth::user())->can('profit_distribution.approve')
                                    && $profitDistribution->status === 'draft',
            'distribute'     => optional(Auth::user())->can('profit_distribution.approve')
                                    && $profitDistribution->status === 'approved',
            'update_payment' => optional(Auth::user())->can('profit_distribution.approve')
                                    && in_array($profitDistribution->status, ['approved', 'distributed']),
            'reverse'        => optional(Auth::user())->can('profit_distribution.reverse')
                                    && $profitDistribution->canBeReversed(),
            'payment'        => optional(Auth::user())->can('profit_distribution.payment')
                                    && in_array($profitDistribution->status, ['approved', 'distributed']),
            'eligibility'    => optional(Auth::user())->can('profit_distribution.eligibility')
                                    && ! $profitDistribution->is_locked,
        ];

        return Inertia::render('Backend/ProfitDistributions/Show', [
            'distribution' => $profitDistribution,
            'can'          => $can,
        ]);
    }

    // -----------------------------------------------------------------------
    // Edit
    // -----------------------------------------------------------------------

    public function edit(ProfitDistribution $profitDistribution): Response
    {
        abort_unless(
            optional(Auth::user())->can('profit_distribution.edit')
            && ! $profitDistribution->is_locked,
            403
        );

        $profitDistribution->load('items');

        return Inertia::render('Backend/ProfitDistributions/Edit', [
            'distribution' => $profitDistribution,
            'can'          => ['edit' => true],
        ]);
    }

    // -----------------------------------------------------------------------
    // Update
    // -----------------------------------------------------------------------

    public function update(
        UpdateProfitDistributionRequest $request,
        ProfitDistribution $profitDistribution
    ): RedirectResponse {
        abort_unless(
            optional(Auth::user())->can('profit_distribution.edit')
            && ! $profitDistribution->is_locked,
            403
        );

        $validated = $request->validated();

        DB::transaction(function () use ($validated, $profitDistribution) {
            $profitDistribution->update([
                'title'                => $validated['title'],
                'distribution_date'    => $validated['distribution_date'],
                'period_start'         => $validated['period_start'],
                'period_end'           => $validated['period_end'],
                'total_revenue'        => $validated['total_revenue'],
                'total_cogs'           => $validated['total_cogs'],
                'total_expenses'       => $validated['total_expenses'],
                'total_investment'     => $validated['total_investment'],
                'gross_profit'         => $validated['gross_profit'],
                'net_profit'           => $validated['net_profit'],
                'distribution_percent' => $validated['distribution_percent'],
                'distributable_amount' => $validated['distributable_amount'],
                'source_type'          => $validated['source_type'] ?? $profitDistribution->source_type,
                'note'                 => $validated['note'] ?? null,
                'updated_by'           => Auth::id(),
            ]);

            $profitDistribution->items()->delete();

            $eligibleItems = array_filter(
                $validated['items'],
                fn($item) => ($item['is_eligible'] ?? true) !== false
                            && (float) ($item['share_amount'] ?? 0) > 0
            );

            if (empty($eligibleItems)) {
                throw new \RuntimeException('No eligible partners found. Cannot save distribution with zero items.');
            }

            $items = array_map(fn($item) => [
                'profit_distribution_id' => $profitDistribution->id,
                'investment_id'          => $item['investment_id'] ?? null,
                'investor_name'          => $item['investor_name'] ?? ($item['partner_name'] ?? null),
                'investment_title'       => $item['investment_title'] ?? ($item['partner_code'] ?? null),
                'investment_type'        => $item['investment_type'] ?? ($item['rule_type'] ?? 'partner_based'),
                'invested_amount'        => $item['invested_amount'] ?? null,
                'partner_id'             => $item['partner_id'] ?? null,
                'profit_rule_snapshot'   => isset($item['profit_rule_snapshot'])
                    ? json_encode($item['profit_rule_snapshot'])
                    : null,
                'settlement_type'        => $item['settlement_type'] ?? null,
                'share_percent'          => $item['share_percent'],
                'share_amount'           => $item['share_amount'],
                // Gap 4.2 — persist cost return portion separately
                'cost_return_amount'     => $item['cost_return_amount'] ?? 0,
                'note'                   => $item['note'] ?? null,
                'payment_status'         => 'pending',
                'created_at'             => now(),
                'updated_at'             => now(),
            ], $eligibleItems);

            ProfitDistributionItem::insert(array_values($items));

            ActivityLogService::log(
                'profit_distribution',
                'update',
                "Profit Distribution {$profitDistribution->distribution_no} updated.",
                $profitDistribution,
                ['distribution_no' => $profitDistribution->distribution_no]
            );
        });

        return redirect()
            ->route('backend.profit-distributions.show', $profitDistribution->id)
            ->with('success', 'Profit Distribution updated successfully.');
    }

    // -----------------------------------------------------------------------
    // Approve
    // -----------------------------------------------------------------------

    public function approve(Request $request, int $id): RedirectResponse
    {
        $distribution = ProfitDistribution::findOrFail($id);

        abort_unless(
            optional(Auth::user())->can('profit_distribution.approve')
            && $distribution->status === 'draft',
            403
        );

        try {
            DB::transaction(function () use ($distribution) {
                $distribution->generateEligibilities();
                $distribution->approve(Auth::id());

                // Gap 4.2 — credit PartnerProfitBalance for partner-based items
                if ($distribution->source_type === 'partner_based') {
                    $distribution->load('items');
                    foreach ($distribution->items as $item) {
                        $this->partnerBalanceService->creditEarned($item);
                    }
                }

                ActivityLogService::log(
                    'profit_distribution',
                    'approve',
                    "Profit Distribution {$distribution->distribution_no} approved.",
                    $distribution,
                    ['distribution_no' => $distribution->distribution_no]
                );
            });
        } catch (\Throwable $e) {
            Log::error('Approve failed: ' . $e->getMessage(), [
                'distribution_id' => $id,
                'trace'           => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['approve' => 'Approval failed: ' . $e->getMessage()]);
        }

        return back()->with('success', 'Distribution approved successfully.');
    }

    // -----------------------------------------------------------------------
    // Distribute
    // -----------------------------------------------------------------------

    public function distribute(Request $request, int $id): RedirectResponse
    {
        $distribution = ProfitDistribution::findOrFail($id);

        abort_unless(
            optional(Auth::user())->can('profit_distribution.approve')
            && $distribution->status === 'approved',
            403
        );

        try {
            $distribution->distribute(Auth::id());
        } catch (\RuntimeException $e) {
            return back()->withErrors(['distribute' => $e->getMessage()]);
        }

        ActivityLogService::log(
            'profit_distribution',
            'distribute',
            "Profit Distribution {$distribution->distribution_no} marked as distributed.",
            $distribution,
            ['distribution_no' => $distribution->distribution_no]
        );

        return back()->with('success', 'Distribution marked as distributed.');
    }

    // -----------------------------------------------------------------------
    // Item Payment Update
    // -----------------------------------------------------------------------

    public function updateItemPayment(Request $request, int $id, int $itemId): RedirectResponse
    {
        $distribution = ProfitDistribution::findOrFail($id);

        abort_unless(
            optional(Auth::user())->can('profit_distribution.approve')
            && in_array($distribution->status, ['approved', 'distributed']),
            403
        );

        $item = ProfitDistributionItem::where('profit_distribution_id', $id)
            ->findOrFail($itemId);

        $request->validate([
            'payment_status'        => ['required', 'in:paid,cancelled'],
            'payment_method'        => ['nullable', 'string', 'max:100'],
            'transaction_reference' => ['nullable', 'string', 'max:255'],
        ]);

        $newStatus = $request->input('payment_status');

        if ($newStatus === 'paid' && ! $item->isFullySettled()) {
            $item->markAsPaid(
                amount:        $item->remainingAmount(),
                paymentMethod: $request->input('payment_method') ?? 'Cash',
                reference:     $request->input('transaction_reference'),
                note:          null,
            );

            ActivityLogService::log(
                'profit_distribution',
                'payment',
                "Item payment marked as paid for {$item->investor_name} in {$distribution->distribution_no}.",
                $distribution,
                [
                    'item_id'       => $item->id,
                    'investor_name' => $item->investor_name,
                    'share_amount'  => $item->share_amount,
                ]
            );
        } elseif ($newStatus === 'cancelled' && $item->isPending()) {
            foreach ($item->payments as $payment) {
                if (! $payment->isCancelled()) {
                    $item->cancelPayment($payment);
                }
            }

            ActivityLogService::log(
                'profit_distribution',
                'payment',
                "Item payment cancelled for {$item->investor_name} in {$distribution->distribution_no}.",
                $distribution,
                [
                    'item_id'       => $item->id,
                    'investor_name' => $item->investor_name,
                ]
            );
        }

        return back()->with('success', 'Payment status updated.');
    }

    // -----------------------------------------------------------------------
    // Destroy
    // -----------------------------------------------------------------------

    public function destroy(ProfitDistribution $profitDistribution): RedirectResponse
    {
        abort_unless(
            optional(Auth::user())->can('profit_distribution.delete')
            && ! $profitDistribution->is_locked,
            403
        );

        ActivityLogService::log(
            'profit_distribution',
            'delete',
            "Profit Distribution {$profitDistribution->distribution_no} moved to trash.",
            $profitDistribution,
            ['distribution_no' => $profitDistribution->distribution_no]
        );

        $profitDistribution->delete();

        return redirect()
            ->route('backend.profit-distributions.index')
            ->with('success', 'Profit Distribution deleted successfully.');
    }

    // -----------------------------------------------------------------------
    // Restore
    // -----------------------------------------------------------------------

    public function restore(int $id): RedirectResponse
    {
        abort_unless(optional(Auth::user())->can('profit_distribution.restore'), 403);

        $distribution = ProfitDistribution::onlyTrashed()->findOrFail($id);
        $distribution->restore();

        ActivityLogService::log(
            'profit_distribution',
            'restore',
            "Profit Distribution {$distribution->distribution_no} restored from trash.",
            $distribution,
            ['distribution_no' => $distribution->distribution_no]
        );

        return back()->with('success', 'Profit Distribution restored successfully.');
    }

    // -----------------------------------------------------------------------
    // Override Eligibility
    // -----------------------------------------------------------------------

    public function overrideEligibility(
        Request $request,
        int $pd,
        int $eligibility
    ): RedirectResponse {
        abort_unless(
            optional(Auth::user())->can('profit_distribution.eligibility'),
            403,
            'You do not have permission to override eligibility.'
        );

        $distribution = ProfitDistribution::findOrFail($pd);

        abort_unless(
            ! $distribution->is_locked,
            422,
            'Cannot override eligibility on a locked distribution.'
        );

        $record = $distribution->eligibilities()->findOrFail($eligibility);

        $request->validate([
            'is_eligible'        => ['required', 'boolean'],
            'eligibility_reason' => ['required', 'string', 'max:500'],
        ]);

        $record->update([
            'is_eligible'        => $request->boolean('is_eligible'),
            'eligibility_reason' => $request->input('eligibility_reason'),
            'override_by'        => Auth::id(),
            'override_at'        => now(),
        ]);

        ActivityLogService::log(
            'profit_distribution',
            'eligibility_override',
            "Eligibility overridden for {$record->investor_name} in {$distribution->distribution_no}. " .
            "Set to: " . ($request->boolean('is_eligible') ? 'Eligible' : 'Ineligible') . ". " .
            "Reason: {$request->input('eligibility_reason')}",
            $distribution,
            [
                'eligibility_id' => $record->id,
                'investor_name'  => $record->investor_name,
                'is_eligible'    => $request->boolean('is_eligible'),
                'reason'         => $request->input('eligibility_reason'),
            ]
        );

        return back()->with('success', 'Eligibility updated successfully.');
    }
}
