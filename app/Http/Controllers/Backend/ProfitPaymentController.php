<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\RecordPaymentRequest;
use App\Models\CapitalLedgerEntry;
use App\Models\InvestorCapitalBalance;
use App\Models\ProfitDistribution;
use App\Models\ProfitDistributionItem;
use App\Models\ProfitDistributionItemPayment;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ProfitPaymentController extends Controller
{
    /**
     * GET /backend/profit-distributions/{pd}/items/{item}/payments
     * List all payment transactions for a distribution item.
     */
    public function index(ProfitDistribution $pd, ProfitDistributionItem $item): JsonResponse
    {
        abort_unless(
            Gate::allows('view', $pd),
            403,
            'You do not have permission to view payment history.'
        );

        abort_unless(
            $item->profit_distribution_id === $pd->id,
            404,
            'Item does not belong to this distribution.'
        );

        $payments = $item->payments()
            ->with('paidBy:id,name')
            ->get()
            ->map(fn ($p) => [
                'id'                    => $p->id,
                'amount'                => (float) $p->amount,
                'payment_status'        => $p->payment_status,
                'payment_status_label'  => ProfitDistributionItemPayment::statusLabel($p->payment_status),
                'payment_method'        => $p->payment_method,
                'transaction_reference' => $p->transaction_reference,
                'note'                  => $p->note,
                'paid_by_name'          => $p->paidBy?->name,
                'paid_at'               => $p->paid_at?->format('Y-m-d H:i'),
                'created_at'            => $p->created_at->format('Y-m-d H:i'),
                'is_terminal'           => $p->isTerminal(),
                'can_be_reopened'       => $p->canBeReopened(),
            ]);

        return response()->json([
            'payments'     => $payments,
            'item_summary' => [
                'investor_name'     => $item->investor_name,
                'effective_amount'  => (float) $item->effectiveAmount(),
                'total_paid'        => (float) $item->totalPaid(),
                'remaining_amount'  => (float) $item->remainingAmount(),
                'payment_status'    => $item->payment_status,
                'deferred_amount'   => (float) $item->deferred_amount,
                'reinvested_amount' => (float) $item->reinvested_amount,
            ],
        ]);
    }

    /**
     * PATCH /backend/profit-distributions/{pd}/items/{item}/payments
     * Record a payment action: pay | defer | reinvest.
     */
    public function store(
        RecordPaymentRequest $request,
        ProfitDistribution $pd,
        ProfitDistributionItem $item
    ): JsonResponse {
        abort_unless(
            optional(Auth::user())->can('profit_distribution.payment'),
            403,
            'You do not have permission to record payments.'
        );

        abort_unless(
            $item->profit_distribution_id === $pd->id,
            404,
            'Item does not belong to this distribution.'
        );

        abort_unless(
            $pd->isApproved() || $pd->isDistributed(),
            422,
            'Payments can only be recorded on approved or distributed distributions.'
        );

        abort_unless(
            ! $item->isFullySettled(),
            422,
            'This item is already fully settled.'
        );

        $action = $request->input('action');

        try {
            DB::transaction(function () use ($request, $item, $pd, $action) {
                $payment = match ($action) {
                    'pay' => $item->markAsPaid(
                        amount:        (float) $request->input('amount'),
                        paymentMethod: $request->input('payment_method'),
                        reference:     $request->input('transaction_reference'),
                        note:          $request->input('note'),
                    ),
                    'defer' => $item->markAsDeferred(
                        note: $request->input('note'),
                    ),
                    'reinvest' => $item->markAsReinvested(
                        note: $request->input('note'),
                    ),
                };

                // ── Phase 2 Bridge: Profit → Capital ─────────────────────────
                // When action is reinvest, credit the capital ledger.
                // Phase 1 already debited InvestorProfitBalance.
                // Phase 2 now credits InvestorCapitalBalance.
                if ($action === 'reinvest') {
                    // Guard: partner-based items have no investment_id — skip capital bridge
                    if (! $item->investment_id) {
                        return;
                    }

                    $item->refresh();
                    $capitalAmount = (float) $item->reinvested_amount;

                    if ($capitalAmount > 0) {
                        $capitalBalance = InvestorCapitalBalance::where(
                            'investment_id', $item->investment_id
                        )->lockForUpdate()->first();

                        // Guard: capital balance record must exist
                        // (seeded from InvestorCapitalBalanceSeeder)
                        if ($capitalBalance) {
                            $runningBalance = $capitalBalance->recordReinvestment($capitalAmount);

                            $refNo = CapitalLedgerEntry::generateReferenceNo();

                            CapitalLedgerEntry::create([
                                'investment_id'    => $item->investment_id,
                                'partner_id'       => $item->partner_id ?? null,  // ← Added Phase 4H
                                'investor_name'    => $item->investor_name,
                                'transaction_type' => 'reinvestment',
                                'direction'        => 'credit',
                                'amount'           => $capitalAmount,
                                'running_balance'  => $runningBalance,
                                'reference_no'     => $refNo,
                                'source_type'      => ProfitDistributionItem::class,
                                'source_id'        => $item->id,
                                'reason'           => "Profit reinvested from distribution {$pd->distribution_no}",
                                'note'             => $request->input('note'),
                                'status'           => 'completed',
                                'requested_by'     => null,
                                'created_by'       => Auth::id(),
                            ]);
                        }
                    }
                }
                // ── End Phase 2 Bridge ────────────────────────────────────────

                ActivityLogService::log(
                    'profit_distribution',
                    'payment_' . $action,
                    ucfirst($action) . " recorded for investor {$item->investor_name} " .
                    "on distribution {$pd->distribution_no}. " .
                    "Amount: " . ($request->input('amount') ?? $item->remainingAmount()),
                    $pd,
                    [
                        'item_id'        => $item->id,
                        'investor_name'  => $item->investor_name,
                        'action'         => $action,
                        'amount'         => $request->input('amount') ?? $item->remainingAmount(),
                        'payment_status' => $item->fresh()->payment_status,
                    ]
                );
            });
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $item->refresh();

        return response()->json([
            'message'        => ucfirst($action) . ' recorded successfully.',
            'payment_status' => $item->payment_status,
            'remaining'      => (float) $item->remainingAmount(),
            'total_paid'     => (float) $item->totalPaid(),
        ]);
    }

    /**
     * DELETE /backend/profit-distributions/{pd}/items/{item}/payments/{payment}
     * Cancel a specific payment transaction.
     */
    public function cancel(
        ProfitDistribution $pd,
        ProfitDistributionItem $item,
        ProfitDistributionItemPayment $payment
    ): JsonResponse {
        abort_unless(
            optional(Auth::user())->can('profit_distribution.payment'),
            403,
            'You do not have permission to cancel payments.'
        );

        abort_unless(
            $item->profit_distribution_id === $pd->id,
            404,
            'Item does not belong to this distribution.'
        );

        abort_unless(
            $payment->profit_distribution_item_id === $item->id,
            404,
            'Payment does not belong to this item.'
        );

        abort_unless(
            ! $payment->isCancelled(),
            422,
            'Payment is already cancelled.'
        );

        try {
            DB::transaction(function () use ($item, $payment, $pd) {
                $item->cancelPayment($payment);

                ActivityLogService::log(
                    'profit_distribution',
                    'payment_cancelled',
                    "Payment cancelled for investor {$item->investor_name} " .
                    "on distribution {$pd->distribution_no}. Amount: {$payment->amount}",
                    $pd,
                    [
                        'item_id'       => $item->id,
                        'payment_id'    => $payment->id,
                        'investor_name' => $item->investor_name,
                        'amount'        => $payment->amount,
                    ]
                );
            });
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $item->refresh();

        return response()->json([
            'message'        => 'Payment cancelled successfully.',
            'payment_status' => $item->payment_status,
            'remaining'      => (float) $item->remainingAmount(),
        ]);
    }

    /**
     * PATCH /backend/profit-distributions/{pd}/items/{item}/payments/{payment}/reopen
     * Reopen a cancelled payment.
     */
    public function reopen(
        ProfitDistribution $pd,
        ProfitDistributionItem $item,
        ProfitDistributionItemPayment $payment
    ): JsonResponse {
        abort_unless(
            optional(Auth::user())->can('profit_distribution.payment'),
            403,
            'You do not have permission to reopen payments.'
        );

        abort_unless(
            $item->profit_distribution_id === $pd->id,
            404,
            'Item does not belong to this distribution.'
        );

        abort_unless(
            $payment->profit_distribution_item_id === $item->id,
            404,
            'Payment does not belong to this item.'
        );

        try {
            DB::transaction(function () use ($item, $payment, $pd) {
                $item->reopenPayment($payment);

                ActivityLogService::log(
                    'profit_distribution',
                    'payment_reopened',
                    "Payment reopened for investor {$item->investor_name} " .
                    "on distribution {$pd->distribution_no}. Amount: {$payment->amount}",
                    $pd,
                    [
                        'item_id'       => $item->id,
                        'payment_id'    => $payment->id,
                        'investor_name' => $item->investor_name,
                        'amount'        => $payment->amount,
                    ]
                );
            });
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $item->refresh();

        return response()->json([
            'message'        => 'Payment reopened successfully.',
            'payment_status' => $item->payment_status,
            'remaining'      => (float) $item->remainingAmount(),
        ]);
    }
}
