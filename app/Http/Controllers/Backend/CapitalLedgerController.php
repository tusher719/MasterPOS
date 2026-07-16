<?php

// app/Http/Controllers/Backend/CapitalLedgerController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\CapitalLedgerEntry;
use App\Models\Investment;
use App\Models\InvestorCapitalBalance;
use App\Services\ActivityLogService;
use App\Services\InvestmentFundUsageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CapitalLedgerController extends Controller
{
    // ─── Index — All Investors Capital Summary ────────────────────────────────

    public function index(): Response
    {
        abort_unless(Gate::allows('view', \App\Models\CapitalLedgerEntry::class), 403);

        $balances = InvestorCapitalBalance::with([
            'investment:id,investment_date,status',
        ])
            ->orderByDesc('current_balance')
            ->paginate(20)
            ->through(fn($b) => [
                'id'               => $b->id,
                'investment_id'    => $b->investment_id,
                'investor_name'    => $b->investor_name,
                'investment_date'  => optional($b->investment)->investment_date,
                'investment_status'=> optional($b->investment)->status,
                'total_deposited'  => $b->total_deposited,
                'total_withdrawn'  => $b->total_withdrawn,
                'total_reinvested' => $b->total_reinvested,
                'total_adjusted'   => $b->total_adjusted,
                'current_balance'  => $b->current_balance,
            ]);

        // Pending withdrawals count for header alert
        $pendingWithdrawalsCount = CapitalLedgerEntry::pendingWithdrawals()->count();

        return Inertia::render('Backend/CapitalLedger/Index', [
            'balances'                => $balances,
            'pendingWithdrawalsCount' => $pendingWithdrawalsCount,
            'can' => [
                'view'               => optional(Auth::user())->can('view', CapitalLedgerEntry::class),
                'deposit'            => optional(Auth::user())->can('deposit', CapitalLedgerEntry::class),
                'adjust'             => optional(Auth::user())->can('adjust', CapitalLedgerEntry::class),
                'request_withdrawal' => optional(Auth::user())->can('requestWithdrawal', CapitalLedgerEntry::class),
                'approve_withdrawal' => optional(Auth::user())->can('approveWithdrawal', CapitalLedgerEntry::class),
            ],
        ]);
    }

    // ─── Show — Per-Investor Ledger ───────────────────────────────────────────

    public function show(int $investmentId, InvestmentFundUsageService $fundUsageService): Response
    {
        abort_unless(Gate::allows('view', CapitalLedgerEntry::class), 403);

        $investment = Investment::withTrashed()->findOrFail($investmentId);

        $balance = InvestorCapitalBalance::where('investment_id', $investmentId)
            ->firstOrFail();

        $entries = CapitalLedgerEntry::forInvestment($investmentId)
            ->orderByDesc('id')
            ->paginate(25);

        // Load relations after pagination (withTrashed support)
        $entries->getCollection()->load([
            'createdBy:id,name',
            'requestedBy:id,name',
            'approvedBy:id,name',
        ]);

        // Pending withdrawals for this investor
        $pendingWithdrawals = CapitalLedgerEntry::forInvestment($investmentId)
            ->pendingWithdrawals()
            ->get(['id', 'amount', 'note', 'created_at']);

        // ── Fund Usage data — approved withdrawals only ────────────────────────
        $approvedWithdrawals = CapitalLedgerEntry::forInvestment($investmentId)
            ->where('transaction_type', 'withdrawal')
            ->where('status', 'approved')
            ->orderByDesc('id')
            ->get();

        $fundUsageData = $approvedWithdrawals->map(function (CapitalLedgerEntry $entry) use ($fundUsageService) {
            return [
                'entry_id'         => $entry->id,
                'reference_no'     => $entry->reference_no,
                'amount'           => $entry->amount,
                'linked_amount'    => $fundUsageService->linkedAmount($entry),
                'remaining_amount' => $fundUsageService->remainingAmount($entry),
                'usages'           => $fundUsageService->getUsagesForEntry($entry),
            ];
        });

        // Available purchases + expenses for link modal
        $availablePurchases = $fundUsageService->getAvailablePurchases();
        $availableExpenses  = $fundUsageService->getAvailableExpenses();

        return Inertia::render('Backend/CapitalLedger/Show', [
            'investment' => [
                'id'              => $investment->id,
                'investor_name'   => $investment->investor_name,
                'investment_date' => $investment->investment_date,
                'status'          => $investment->status,
                'amount'          => $investment->amount,
            ],
            'balance' => [
                'total_deposited'   => $balance->total_deposited,
                'total_withdrawn'   => $balance->total_withdrawn,
                'total_reinvested'  => $balance->total_reinvested,
                'total_adjusted'    => $balance->total_adjusted,
                'current_balance'   => $balance->current_balance,
            ],
            'entries'              => $entries,
            'pendingWithdrawals'   => $pendingWithdrawals,
            'fundUsageData'        => $fundUsageData,
            'availablePurchases'   => $availablePurchases,
            'availableExpenses'    => $availableExpenses,
            'can' => [
                'deposit'            => optional(Auth::user())->can('deposit', CapitalLedgerEntry::class),
                'adjust'             => optional(Auth::user())->can('adjust', CapitalLedgerEntry::class),
                'request_withdrawal' => optional(Auth::user())->can('requestWithdrawal', CapitalLedgerEntry::class),
                'approve_withdrawal' => optional(Auth::user())->can('approveWithdrawal', CapitalLedgerEntry::class),
                'fund_usage_create'  => optional(Auth::user())->hasPermissionTo('fund_usage.create'),
                'fund_usage_delete'  => optional(Auth::user())->hasPermissionTo('fund_usage.delete'),
            ],
        ]);
    }

    // ─── Store — Deposit / Adjustment / Withdrawal Request ───────────────────

    public function store(Request $request): RedirectResponse
    {
        $type = $request->input('transaction_type');

        // Authorization per type
        match ($type) {
            'deposit'    => abort_unless(Gate::allows('deposit', CapitalLedgerEntry::class), 403),
            'adjustment' => abort_unless(Gate::allows('adjust', CapitalLedgerEntry::class), 403),
            'withdrawal' => abort_unless(Gate::allows('requestWithdrawal', CapitalLedgerEntry::class), 403),
            default      => abort(422, 'Invalid transaction type.'),
        };

        // Validation rules
        $rules = [
            'investment_id'    => ['required', 'integer', 'exists:investments,id'],
            'transaction_type' => ['required', 'in:deposit,adjustment,withdrawal'],
            'amount'           => ['required', 'numeric', 'min:0.01'],
            'note'             => ['nullable', 'string', 'max:500'],
        ];

        if ($type === 'adjustment') {
            $rules['reason']    = ['required', 'string', 'max:500'];
            $rules['direction'] = ['required', 'in:credit,debit'];
        }

        $validated = $request->validate($rules);

        DB::transaction(function () use ($validated, $type, $request) {
            $balance = InvestorCapitalBalance::where('investment_id', $validated['investment_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $amount    = (float) $validated['amount'];
            $userId    = Auth::id();
            $refNo     = CapitalLedgerEntry::generateReferenceNo();

            if ($type === 'deposit') {
                $runningBalance = $balance->recordDeposit($amount);

                $entry = CapitalLedgerEntry::create([
                    'investment_id'    => $validated['investment_id'],
                    'investor_name'    => $balance->investor_name,
                    'transaction_type' => 'deposit',
                    'direction'        => 'credit',
                    'amount'           => $amount,
                    'running_balance'  => $runningBalance,
                    'reference_no'     => $refNo,
                    'note'             => $validated['note'] ?? null,
                    'status'           => 'completed',
                    'created_by'       => $userId,
                ]);

                ActivityLogService::log(
                    'capital_ledger',
                    'deposit',
                    "Capital deposit of ৳{$amount} recorded for {$balance->investor_name}",
                    $entry,
                    ['amount' => $amount, 'reference_no' => $refNo]
                );
            }

            elseif ($type === 'adjustment') {
                $direction = $validated['direction'];

                $runningBalance = $direction === 'credit'
                    ? $balance->recordPositiveAdjustment($amount)
                    : $balance->recordNegativeAdjustment($amount);

                $entry = CapitalLedgerEntry::create([
                    'investment_id'    => $validated['investment_id'],
                    'investor_name'    => $balance->investor_name,
                    'transaction_type' => 'adjustment',
                    'direction'        => $direction,
                    'amount'           => $amount,
                    'running_balance'  => $runningBalance,
                    'reference_no'     => $refNo,
                    'reason'           => $validated['reason'],
                    'note'             => $validated['note'] ?? null,
                    'status'           => 'completed',
                    'created_by'       => $userId,
                ]);

                ActivityLogService::log(
                    'capital_ledger',
                    'adjustment',
                    "Capital adjustment ({$direction}) of ৳{$amount} for {$balance->investor_name}",
                    $entry,
                    ['amount' => $amount, 'direction' => $direction, 'reason' => $validated['reason']]
                );
            }

            elseif ($type === 'withdrawal') {
                // Guard: cannot request more than current balance
                abort_unless(
                    $balance->canWithdraw($amount),
                    422,
                    'Withdrawal amount exceeds current capital balance.'
                );

                // Withdrawal: pending until approved — balance NOT deducted yet
                $entry = CapitalLedgerEntry::create([
                    'investment_id'    => $validated['investment_id'],
                    'investor_name'    => $balance->investor_name,
                    'transaction_type' => 'withdrawal',
                    'direction'        => 'debit',
                    'amount'           => $amount,
                    'running_balance'  => (float) $balance->current_balance, // unchanged until approval
                    'reference_no'     => $refNo,
                    'note'             => $validated['note'] ?? null,
                    'status'           => 'pending',
                    'requested_by'     => $userId,
                    'created_by'       => $userId,
                ]);

                ActivityLogService::log(
                    'capital_ledger',
                    'withdrawal_requested',
                    "Capital withdrawal request of ৳{$amount} for {$balance->investor_name}",
                    $entry,
                    ['amount' => $amount, 'reference_no' => $refNo]
                );
            }
        });

        return redirect()->back()->with('success', match ($type) {
            'deposit'    => 'Capital deposit recorded successfully.',
            'adjustment' => 'Capital adjustment recorded successfully.',
            'withdrawal' => 'Withdrawal request submitted. Awaiting approval.',
        });
    }
}
