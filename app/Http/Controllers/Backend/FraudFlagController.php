<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreFraudFlagRequest;
use App\Http\Requests\Backend\ReviewFraudFlagRequest;
use App\Models\Customer;
use App\Models\FraudFlag;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FraudFlagController extends Controller
{
    // -------------------------------------------------------------------------
    // Index — paginated list with filters
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        abort_unless(Gate::allows('viewAny', FraudFlag::class), 403);

        $query = FraudFlag::query()
            ->with([
                'customer:id,name,phone',
                'flaggedBy:id,name',
                'reviewedBy:id,name',
            ]);

        // Filter: status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter: trigger_type
        if ($request->filled('trigger_type')) {
            $query->where('trigger_type', $request->trigger_type);
        }

        // Filter: reason
        if ($request->filled('reason')) {
            $query->where('reason', $request->reason);
        }

        // Filter: phone (normalized search)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('phone', 'like', "%{$search}%")
                  ->orWhere('full_name_snapshot', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $flags = $query
            ->orderByDesc('flagged_at')
            ->paginate(20)
            ->withQueryString();

        $flags->getCollection()->each(
            fn($flag) => $flag->append(['is_pending', 'is_confirmed', 'is_cleared'])
        );

        // Stats for header cards
        $stats = [
            'total'           => FraudFlag::count(),
            'pending_review'  => FraudFlag::pendingReview()->count(),
            'confirmed_fraud' => FraudFlag::confirmedFraud()->count(),
            'cleared'         => FraudFlag::cleared()->count(),
        ];

        $filters = $request->only(['search', 'status', 'trigger_type', 'reason']);

        return Inertia::render('Backend/FraudFlags/Index', [
            'flags'   => $flags,
            'stats'   => $stats,
            'filters' => $filters,
            'can'     => [
                'flag'   => Gate::allows('flag', FraudFlag::class),
                'review' => Gate::allows('review', FraudFlag::class),
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Store — manual flag creation by Admin / Fraud Manager
    // -------------------------------------------------------------------------

    public function store(StoreFraudFlagRequest $request): RedirectResponse
    {
        abort_unless(Gate::allows('flag', FraudFlag::class), 403);

        $data = $request->validated();

        // Resolve snapshot fields from customer if customer_id provided
        if (!empty($data['customer_id'])) {
            $customer = Customer::findOrFail($data['customer_id']);
            $data['full_name_snapshot'] = $data['full_name_snapshot'] ?? $customer->name;
            $data['phone']              = $data['phone'] ?? $customer->phone;
            $data['email']              = $data['email'] ?? $customer->email;
            $data['address_snapshot']   = $data['address_snapshot'] ?? $customer->address;
        }

        $flag = FraudFlag::create([
            ...$data,
            'trigger_type' => 'manual',
            'status'       => 'pending_review',
            'flagged_by'   => Auth::id(),
            'flagged_at'   => now(),
        ]);

        ActivityLogService::log(
            'fraud_flags',
            'create',
            "Manual fraud flag created for phone: {$flag->phone}",
            $flag,
            ['reason' => $flag->reason, 'trigger_type' => 'manual']
        );

        return redirect()->back()->with('success', 'Fraud flag created successfully.');
    }

    // -------------------------------------------------------------------------
    // Review — confirm or clear a flag
    // -------------------------------------------------------------------------

    public function review(ReviewFraudFlagRequest $request, FraudFlag $fraudFlag): RedirectResponse
    {
        abort_unless(Gate::allows('review', FraudFlag::class), 403);

        if (!$fraudFlag->is_pending) {
            return redirect()->back()->with('error', 'This flag has already been reviewed.');
        }

        $action = $request->validated('action');
        $note   = $request->validated('review_note');

        if ($action === 'confirm') {
            $fraudFlag->confirmFraud(Auth::id(), $note);
            $logAction = 'confirm';
            $message   = 'Fraud flag confirmed.';
        } else {
            $fraudFlag->clearFlag(Auth::id(), $note);
            $logAction = 'clear';
            $message   = 'Fraud flag cleared.';
        }

        ActivityLogService::log(
            'fraud_flags',
            $logAction,
            "Fraud flag {$logAction}ed for phone: {$fraudFlag->phone}",
            $fraudFlag,
            ['review_note' => $note]
        );

        return redirect()->back()->with('success', $message);
    }
}
