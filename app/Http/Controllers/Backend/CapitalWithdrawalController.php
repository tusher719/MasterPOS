<?php

// app/Http/Controllers/Backend/CapitalWithdrawalController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\CapitalLedgerEntry;
use App\Models\Investment;
use App\Models\InvestorCapitalBalance;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class CapitalWithdrawalController extends Controller
{
    // ─── Approve Withdrawal ───────────────────────────────────────────────────

    public function approve(CapitalLedgerEntry $entry): RedirectResponse
    {
        abort_unless(Gate::allows('approveWithdrawal', CapitalLedgerEntry::class), 403);

        abort_unless(
            $entry->transaction_type === 'withdrawal' && $entry->isPending(),
            422,
            'Only pending withdrawal requests can be approved.'
        );

        // AFTER
        DB::transaction(function () use ($entry) {
            $balance = InvestorCapitalBalance::where('investment_id', $entry->investment_id)
                ->lockForUpdate()
                ->firstOrFail();

            // Recompute unlock status from live sales before approval check
            $investment = Investment::withTrashed()->findOrFail($entry->investment_id);
            $balance->computeAndSaveUnlockStatus($investment->investment_date);

            $amount = (float) $entry->amount;

            // Double guard: check both current_balance AND unlocked principal
            if (! $balance->canWithdraw($amount)) {
                $available = number_format($balance->availableToWithdraw(), 2);
                $locked    = number_format((float) $balance->locked_amount, 2);
                $progress  = $balance->total_deposited > 0
                    ? round((float) $balance->unlocked_amount / (float) $balance->total_deposited * 100, 1)
                    : 0;

                abort(422,
                    "You can currently withdraw up to ৳{$available} BDT — " .
                    "৳{$locked} BDT is still locked " .
                    "({$progress}% of principal has been recovered through sales)."
                );
            }

            // Deduct balance — only happens here on approval
            $runningBalance = $balance->recordWithdrawal($amount);

            // Update entry: approved + store final running_balance
            $entry->markAsApproved(Auth::id());

            // Update running_balance to reflect actual deduction
            $entry->forceFill(['running_balance' => $runningBalance])->save();

            ActivityLogService::log(
                'capital_ledger',
                'withdrawal_approved',
                "Capital withdrawal of ৳{$entry->amount} approved for {$entry->investor_name}",
                $entry,
                [
                    'amount'       => $entry->amount,
                    'reference_no' => $entry->reference_no,
                    'approved_by'  => Auth::id(),
                ]
            );
        });

        return redirect()->back()->with('success', 'Withdrawal approved and balance updated.');
    }

    // ─── Reject Withdrawal ────────────────────────────────────────────────────

    public function reject(Request $request, CapitalLedgerEntry $entry): RedirectResponse
    {
        abort_unless(Gate::allows('approveWithdrawal', CapitalLedgerEntry::class), 403);

        abort_unless(
            $entry->transaction_type === 'withdrawal' && $entry->isPending(),
            422,
            'Only pending withdrawal requests can be rejected.'
        );

        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($entry, $request) {
            // Store rejection reason in the entry's reason field
            $entry->forceFill([
                'reason' => $request->input('reason'),
            ])->save();

            $entry->markAsRejected();

            // No balance change — withdrawal was never deducted

            ActivityLogService::log(
                'capital_ledger',
                'withdrawal_rejected',
                "Capital withdrawal of ৳{$entry->amount} rejected for {$entry->investor_name}",
                $entry,
                [
                    'amount'       => $entry->amount,
                    'reference_no' => $entry->reference_no,
                    'reason'       => $request->input('reason'),
                ]
            );
        });

        return redirect()->back()->with('success', 'Withdrawal request rejected.');
    }

    // ─── Cancel Withdrawal ────────────────────────────────────────────────────

    public function cancel(CapitalLedgerEntry $entry): RedirectResponse
    {
        abort_unless(
            optional(Auth::user())->can('cancelWithdrawal', $entry),
            403
        );

        abort_unless(
            $entry->transaction_type === 'withdrawal' && $entry->isPending(),
            422,
            'Only pending withdrawal requests can be cancelled.'
        );

        DB::transaction(function () use ($entry) {
            $entry->markAsCancelled();

            // No balance change — withdrawal was never deducted

            ActivityLogService::log(
                'capital_ledger',
                'withdrawal_cancelled',
                "Capital withdrawal request of ৳{$entry->amount} cancelled for {$entry->investor_name}",
                $entry,
                [
                    'amount'       => $entry->amount,
                    'reference_no' => $entry->reference_no,
                ]
            );
        });

        return redirect()->back()->with('success', 'Withdrawal request cancelled.');
    }
}
