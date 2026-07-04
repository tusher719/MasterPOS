<?php

// app/Http/Controllers/Backend/PurchasePaymentController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StorePurchasePaymentRequest;
use App\Models\PaymentMethod;
use App\Models\Purchase;
use App\Models\PurchasePayment;
use App\Services\ActivityLogService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchasePaymentController extends Controller
{
    use AuthorizesRequests;

    // ─── Store Payment ────────────────────────────────────────────────────────

    public function store(StorePurchasePaymentRequest $request, Purchase $purchase): RedirectResponse
    {
        DB::transaction(function () use ($request, $purchase) {
            $validated = $request->validated();

            // Create payment record
            $payment = $purchase->payments()->create([
                'payment_method_id' => $validated['payment_method_id'] ?? null,
                'amount'            => $validated['amount'],
                'payment_date'      => $validated['payment_date'],
                'reference'         => $validated['reference'] ?? null,
                'note'              => $validated['note'] ?? null,
                'created_by'        => Auth::id(),
            ]);

            // Recalculate purchase paid_amount, due_amount, payment_status
            $totalPaid = $purchase->payments()->sum('amount');
            $dueAmount = max(0, $purchase->grand_total - $totalPaid);

            $purchase->update([
                'paid_amount'    => $totalPaid,
                'due_amount'     => $dueAmount,
                'payment_status' => $dueAmount <= 0
                    ? 'paid'
                    : ($totalPaid > 0 ? 'partial' : 'due'),
                'updated_by'     => Auth::id(),
            ]);

            ActivityLogService::log(
                'purchase',
                'payment_recorded',
                "Payment of {$validated['amount']} recorded for purchase {$purchase->reference_no}.",
                $purchase,
                [
                    'payment_id'   => $payment->id,
                    'amount'       => $validated['amount'],
                    'total_paid'   => $totalPaid,
                    'due_amount'   => $dueAmount,
                ]
            );
        });

        return back()->with('success', 'Payment recorded successfully.');
    }

    // ─── Index Payments ───────────────────────────────────────────────────────

    /**
     * Show payments for a purchase. Returns JSON for AJAX requests or an Inertia page for browser.
     *
     * @param  \App\Models\Purchase  $purchase
     * @return mixed
     */
    public function index(Purchase $purchase)
    {
        $this->authorize('view', $purchase);

        $payments = $purchase->payments()
            ->with(['paymentMethod', 'createdBy'])
            ->latest()
            ->get();

        // JSON চাইলে (axios modal fetch) — শুধু payments ডেটা রিটার্ন করো
        if (request()->wantsJson()) {
            return response()->json(['payments' => $payments]);
        }

        // Direct browser visit হলে (fallback) — পুরো Show page render করো
        $purchase->load([
            'supplier',
            'items.product:id,name,sku',
            'payments.paymentMethod:id,name',
            'payments.createdBy:id,name',
            'createdBy:id,name',
            'updatedBy:id,name',
        ]);

        return Inertia::render('Backend/Purchases/Show', [
            'purchase'         => $purchase,
            'purchaseStatuses' => Purchase::PURCHASE_STATUSES,
            'paymentStatuses'  => Purchase::PAYMENT_STATUSES,
            'paymentMethods'   => PaymentMethod::active()->select('id', 'name')->get(),
            'can' => [
                'edit'    => request()->user()->can('update', $purchase),
                'delete'  => request()->user()->can('delete', $purchase),
                'payment' => request()->user()->can('managePayment', $purchase),
            ],
        ]);
    }

    // ─── Destroy Payment ──────────────────────────────────────────────────────

    public function destroy(Purchase $purchase, PurchasePayment $payment): RedirectResponse
    {
        // Ensure payment belongs to this purchase
        if ($payment->purchase_id !== $purchase->id) {
            abort(403, 'Payment does not belong to this purchase.');
        }

        $this->authorize('managePayment', $purchase);

        DB::transaction(function () use ($purchase, $payment) {
            $amount = $payment->amount;

            $payment->delete();

            // Recalculate totals after deletion
            $totalPaid = $purchase->payments()->sum('amount');
            $dueAmount = max(0, $purchase->grand_total - $totalPaid);

            $purchase->update([
                'paid_amount'    => $totalPaid,
                'due_amount'     => $dueAmount,
                'payment_status' => $dueAmount <= 0
                    ? 'paid'
                    : ($totalPaid > 0 ? 'partial' : 'due'),
                'updated_by'     => Auth::id(),
            ]);

            ActivityLogService::log(
                'purchase',
                'payment_deleted',
                "Payment of {$amount} deleted from purchase {$purchase->reference_no}.",
                $purchase,          // ✅ fixed
                [
                    'deleted_amount' => $amount,
                    'total_paid'     => $totalPaid,
                    'due_amount'     => $dueAmount,
                ]
            );
        });

        return back()->with('success', 'Payment deleted successfully.');
    }
}
