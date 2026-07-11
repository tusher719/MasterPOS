<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Investment;
use App\Models\InvestorProfitBalance;
use App\Models\ProfitDistributionItem;
use App\Models\ProfitDistributionItemPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class InvestorBalanceController extends Controller
{
    /**
     * GET /backend/investor-balances
     * List all investor profit balances.
     */
    public function index(Request $request): Response
    {
        abort_unless(
            Gate::allows('viewAny', InvestorProfitBalance::class),
            403,
            'You do not have permission to view investor balances.'
        );

        $balances = InvestorProfitBalance::with('investment:id,investor_name,amount,investment_date,status')
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->where('investor_name', 'like', '%' . $request->search . '%');
            })
            ->orderByDesc('pending_balance')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total_earned'     => (float) InvestorProfitBalance::sum('total_earned'),
            'total_paid'       => (float) InvestorProfitBalance::sum('total_paid'),
            'total_deferred'   => (float) InvestorProfitBalance::sum('total_deferred'),
            'total_reinvested' => (float) InvestorProfitBalance::sum('total_reinvested'),
            'total_pending'    => (float) InvestorProfitBalance::sum('pending_balance'),
            'investor_count'   => InvestorProfitBalance::count(),
        ];

        return Inertia::render('Backend/InvestorBalances/Index', [
            'balances' => [
                'data'  => $balances->items(),
                'meta'  => [
                    'current_page' => $balances->currentPage(),
                    'last_page'    => $balances->lastPage(),
                    'per_page'     => $balances->perPage(),
                    'total'        => $balances->total(),
                    'from'         => $balances->firstItem(),
                    'to'           => $balances->lastItem(),
                ],
                'links' => $balances->linkCollection()->toArray(),
            ],
            'stats'   => $stats,
            'filters' => $request->only(['search']),
            'can'     => [
                'view' => Auth::check() && Gate::allows('view', InvestorProfitBalance::class),
            ],
        ]);
    }

    /**
     * GET /backend/investor-balances/{investment}
     * Show full profit ledger for a single investor.
     */
    public function show(Request $request, Investment $investment): Response
    {
        abort_unless(
            Gate::allows('view', InvestorProfitBalance::class),
            403,
            'You do not have permission to view investor balances.'
        );

        $balance = InvestorProfitBalance::firstOrCreate(
            ['investment_id' => $investment->id],
            ['investor_name' => $investment->investor_name]
        );

        // All distribution items for this investor with payment history
        $items = ProfitDistributionItem::with([
            'payments.paidBy:id,name',
            'carriedFromDistribution',
        ])
        ->where('investment_id', $investment->id)
        ->orderByDesc('created_at')
        ->paginate(15, ['*'], 'items_page')
        ->withQueryString();

        // Load distribution with withTrashed() separately — eager load with
        // column select does not support withTrashed() in with() shorthand
        $items->getCollection()->load([
            'distribution' => fn ($q) => $q->withTrashed()
                ->select('id', 'distribution_no', 'title', 'period_start', 'period_end', 'status', 'distribution_date'),
        ]);

        // Payment summary by status
        $paymentSummary = ProfitDistributionItemPayment::whereHas(
                'distributionItem',
                fn ($q) => $q->where('investment_id', $investment->id)
            )
            ->selectRaw('payment_status, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('payment_status')
            ->get()
            ->mapWithKeys(fn ($row) => [
                $row->payment_status => [
                    'count' => $row->count,
                    'total' => (float) $row->total,
                    'label' => ProfitDistributionItemPayment::statusLabel($row->payment_status),
                ],
            ]);

        return Inertia::render('Backend/InvestorBalances/Show', [
            'investment' => [
                'id'              => $investment->id,
                'investor_name'   => $investment->investor_name,
                'title'           => $investment->title,
                'amount'          => (float) $investment->amount,
                'investment_date' => $investment->investment_date?->format('Y-m-d'),
                'status'          => $investment->status,
            ],
            'balance' => [
                'id'               => $balance->id,
                'total_earned'     => (float) $balance->total_earned,
                'total_paid'       => (float) $balance->total_paid,
                'total_deferred'   => (float) $balance->total_deferred,
                'total_reinvested' => (float) $balance->total_reinvested,
                'pending_balance'  => (float) $balance->pending_balance,
                'roi'              => $balance->roi(),
                'has_pending'      => $balance->hasPendingBalance(),
            ],
            'items' => [
                'data' => collect($items->items())->map(fn ($item) => [
                    'id'                    => $item->id,
                    'profit_distribution_id' => $item->profit_distribution_id,
                    'distribution_no'       => $item->distribution->distribution_no ?? '-',
                    'distribution_title'    => $item->distribution->title ?? '-',
                    'distribution_status'   => $item->distribution->status ?? '-',
                    'period_start'          => $item->distribution->period_start?->format('Y-m-d'),
                    'period_end'            => $item->distribution->period_end?->format('Y-m-d'),
                    'distribution_date'     => $item->distribution->distribution_date?->format('Y-m-d'),
                    'share_percent'         => (float) $item->share_percent,
                    'share_amount'          => (float) $item->share_amount,
                    'distribution_percent'  => (float) $item->distribution_percent,
                    'effective_amount'      => $item->effectiveAmount(),
                    'total_paid'            => $item->totalPaid(),
                    'remaining_amount'      => $item->remainingAmount(),
                    'deferred_amount'       => (float) $item->deferred_amount,
                    'reinvested_amount'     => (float) $item->reinvested_amount,
                    'payment_status'        => $item->payment_status,
                    'is_carried_forward'    => $item->isCarriedForward(),
                    'carried_from_no'       => $item->carriedFromDistribution?->distribution_no,
                    'payments'              => $item->payments->map(fn ($p) => [
                        'id'                    => $p->id,
                        'amount'                => (float) $p->amount,
                        'payment_status'        => $p->payment_status,
                        'payment_status_label'  => ProfitDistributionItemPayment::statusLabel($p->payment_status),
                        'payment_method'        => $p->payment_method,
                        'transaction_reference' => $p->transaction_reference,
                        'note'                  => $p->note,
                        'paid_by_name'          => $p->paidBy?->name,
                        'paid_at'               => $p->paid_at?->format('Y-m-d H:i'),
                    ]),
                ]),
                'meta' => [
                    'current_page' => $items->currentPage(),
                    'last_page'    => $items->lastPage(),
                    'per_page'     => $items->perPage(),
                    'total'        => $items->total(),
                ],
                'links' => $items->linkCollection()->toArray(),
            ],
            'payment_summary' => $paymentSummary,
            'can' => [
                'view' => Auth::check() && Gate::allows('view', InvestorProfitBalance::class),
            ],
        ]);
    }
}
