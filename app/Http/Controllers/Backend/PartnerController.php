<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Investment;
use App\Models\Partner;
use App\Models\PartnerInvestment;
use App\Models\PartnerProductAssignment;
use App\Models\PartnerProfitBalance;
use App\Models\PartnerProfitEligibility;
use App\Models\PartnerProfitRule;
use App\Models\PartnerSettlementConfig;
use App\Models\Product;
use App\Models\ProfitDistributionItem;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PartnerController extends Controller
{
    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        abort_unless(Gate::allows('viewAny', Partner::class), 403);

        $filters = $request->only(['search', 'type', 'status', 'trashed']);

        $query = Partner::query()
            ->with([
                'createdBy:id,name',
                'updatedBy:id,name',
            ])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->input('search');
                $q->where(function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('type'), function ($q) use ($request) {
                $type = $request->input('type');
                if ($type === 'capital') $q->where('partner_type_capital', true);
                if ($type === 'working') $q->where('partner_type_working', true);
                if ($type === 'product') $q->where('partner_type_product', true);
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                $status = $request->input('status');
                if ($status === 'active')   $q->where('is_active', true);
                if ($status === 'inactive') $q->where('is_active', false);
            })
            ->when(
                $request->filled('trashed') && $request->input('trashed') === '1',
                fn($q) => $q->onlyTrashed()
            );

        $partners = $query->orderBy('name')->paginate(15)->withQueryString();

        $stats = [
            'total'   => Partner::count(),
            'active'  => Partner::where('is_active', true)->count(),
            'capital' => Partner::where('partner_type_capital', true)->count(),
            'working' => Partner::where('partner_type_working', true)->count(),
            'product' => Partner::where('partner_type_product', true)->count(),
        ];

        $investmentOptions = Investment::where('status', 'active')
            ->orderBy('title')
            ->get(['id', 'title', 'investor_name', 'amount']);

        return Inertia::render('Backend/Partners/Index', [
            'partners'          => $partners,
            'filters'           => $filters,
            'stats'             => $stats,
            'investmentOptions' => $investmentOptions,
            'can'               => [
                'create'      => Gate::allows('create', Partner::class),
                'edit'        => Gate::allows('update', new Partner()),
                'delete'      => Gate::allows('delete', new Partner()),
                'restore'     => Gate::allows('restore', Partner::class),
                'forceDelete' => Auth::user()->hasRole('Super Admin'),
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Show
    // -------------------------------------------------------------------------

    public function show(Partner $partner): Response
    {
        abort_unless(Gate::allows('view', $partner), 403);

        $partner->load([
            'investments' => function ($q) {
                $q->withTrashed()
                    ->withPivot('id', 'is_primary', 'note')
                    ->select(
                        'investments.id',
                        'investments.title',
                        'investments.investor_name',
                        'investments.amount',
                        'investments.status',
                        'investments.investment_date'
                    );
            },
            'user:id,name,email',
            'createdBy:id,name',
            'updatedBy:id,name',
            'profitBalance',
        ]);

        $linkedIds = $partner->investments->pluck('id')->toArray();

        $investmentOptions = Investment::where('status', 'active')
            ->when(!empty($linkedIds), fn($q) => $q->whereNotIn('id', $linkedIds))
            ->orderBy('title')
            ->get(['id', 'title', 'investor_name', 'amount']);

        $profitRules = $partner->profitRules()
            ->with([
                'history' => fn($q) => $q->with(['changedBy:id,name,deleted_at']),
                'approvedBy:id,name,deleted_at',
                'createdBy:id,name,deleted_at',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->each(fn($rule) => $rule->append(['is_pending', 'is_approved', 'is_currently_active']));

        $eligibilities = $partner->eligibilities()
            ->with([
                'creator:id,name,deleted_at',
                'pausedBy:id,name,deleted_at',
                'resumedBy:id,name,deleted_at',
            ])
            ->orderBy('profit_start_date', 'desc')
            ->get();

        $settlementConfigs = $partner->settlementConfigs()
            ->with(['createdBy:id,name,deleted_at'])
            ->orderBy('created_at', 'desc')
            ->get();

        $productAssignments = $partner->productAssignments()
            ->with([
                'product:id,name,sku',
                'createdBy:id,name,deleted_at',
                'approvedBy:id,name,deleted_at',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->each(fn($a) => $a->append(['is_pending', 'is_approved', 'is_currently_active']));

        $products = Product::select('id', 'name', 'sku')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Gap 1.5 — recent profit distribution payments for this partner (last 5)
        $recentProfitItems = ProfitDistributionItem::where('partner_id', $partner->id)
            ->whereNotIn('payment_status', ['pending', 'cancelled'])
            ->with(['profitDistribution:id,distribution_no,period_start,period_end,status'])
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get([
                'id',
                'profit_distribution_id',
                'share_percent',
                'share_amount',
                'cost_return_amount',
                'payment_status',
                'updated_at',
            ]);

        return Inertia::render('Backend/Partners/Show', [
            'partner'            => $partner,
            'investmentOptions'  => $investmentOptions,
            'profitRules'        => $profitRules,
            'eligibilities'      => $eligibilities,
            'settlementConfigs'  => $settlementConfigs,
            'productAssignments' => $productAssignments,
            'products'           => $products,
            // Gap 4.2 — cost/profit balance split for this partner
            'profitBalance'      => $partner->profitBalance,
            // Gap 1.5 — recent profit payment history
            'recentProfitItems'  => $recentProfitItems,
            'can'                => [
                'edit'        => Gate::allows('update', $partner),
                'delete'      => Gate::allows('delete', $partner),
                'restore'     => Gate::allows('restore', Partner::class),
                'forceDelete' => Auth::user()->hasRole('Super Admin'),
            ],
            'profitRuleCan' => [
                'view'    => Gate::allows('viewAny', PartnerProfitRule::class),
                'create'  => Gate::allows('create', PartnerProfitRule::class),
                'edit'    => Gate::allows('edit', PartnerProfitRule::class),
                'approve' => Gate::allows('approve', PartnerProfitRule::class),
            ],
            'eligibilityCan' => [
                'view'   => Gate::allows('viewAny', PartnerProfitEligibility::class),
                'create' => Gate::allows('create', PartnerProfitEligibility::class),
                'pause'  => Gate::allows('pause', PartnerProfitEligibility::class),
                'resume' => Gate::allows('resume', PartnerProfitEligibility::class),
            ],
            'settlementConfigCan' => [
                'view'    => Gate::allows('viewAny', PartnerSettlementConfig::class),
                'create'  => Gate::allows('create', PartnerSettlementConfig::class),
                'edit'    => Gate::allows('edit', PartnerSettlementConfig::class),
                'approve' => Gate::allows('approve', PartnerSettlementConfig::class),
                'delete'  => Gate::allows('delete', PartnerSettlementConfig::class),
            ],
            'assignmentCan' => [
                'view'    => Gate::allows('viewAny', PartnerProductAssignment::class),
                'create'  => Gate::allows('create', PartnerProductAssignment::class),
                'edit'    => Gate::allows('edit', PartnerProductAssignment::class),
                'approve' => Gate::allows('approve', PartnerProductAssignment::class),
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Store
    // -------------------------------------------------------------------------

    public function store(Request $request): RedirectResponse
    {
        abort_unless(Gate::allows('create', Partner::class), 403);

        $validated = $request->validate([
            'name'                 => 'required|string|max:255',
            'partner_type_capital' => 'boolean',
            'partner_type_working' => 'boolean',
            'partner_type_product' => 'boolean',
            'phone'                => 'nullable|string|max:50',
            'email'                => 'nullable|email|max:255',
            'address'              => 'nullable|string',
            'user_id'              => 'nullable|exists:users,id',
            'note'                 => 'nullable|string',
            'is_active'            => 'boolean',
        ]);

        $partner = Partner::create([
            ...$validated,
            'code'       => Partner::generateCode(),
            'created_by' => Auth::id(),
        ]);

        ActivityLogService::log(
            'partners',
            'create',
            "Partner created: {$partner->name} ({$partner->code})",
            $partner,
            ['code' => $partner->code, 'types' => $partner->type_labels]
        );

        return redirect()->back()->with('success', 'Partner created successfully.');
    }

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------

    public function update(Request $request, Partner $partner): RedirectResponse
    {
        abort_unless(Gate::allows('update', $partner), 403);

        $validated = $request->validate([
            'name'                 => 'required|string|max:255',
            'partner_type_capital' => 'boolean',
            'partner_type_working' => 'boolean',
            'partner_type_product' => 'boolean',
            'phone'                => 'nullable|string|max:50',
            'email'                => 'nullable|email|max:255',
            'address'              => 'nullable|string',
            'user_id'              => 'nullable|exists:users,id',
            'note'                 => 'nullable|string',
            'is_active'            => 'boolean',
        ]);

        $partner->update([
            ...$validated,
            'updated_by' => Auth::id(),
        ]);

        ActivityLogService::log(
            'partners',
            'update',
            "Partner updated: {$partner->name} ({$partner->code})",
            $partner,
            ['code' => $partner->code]
        );

        return redirect()->back()->with('success', 'Partner updated successfully.');
    }

    // -------------------------------------------------------------------------
    // Destroy (Soft Delete)
    // -------------------------------------------------------------------------

    public function destroy(Partner $partner): RedirectResponse
    {
        abort_unless(Gate::allows('delete', $partner), 403);

        $partner->delete();

        ActivityLogService::log(
            'partners',
            'delete',
            "Partner deleted: {$partner->name} ({$partner->code})",
            $partner
        );

        return redirect()->back()->with('success', 'Partner deleted successfully.');
    }

    // -------------------------------------------------------------------------
    // Restore
    // -------------------------------------------------------------------------

    public function restore(int $id): RedirectResponse
    {
        abort_unless(Gate::allows('restore', Partner::class), 403);

        $partner = Partner::onlyTrashed()->findOrFail($id);
        $partner->restore();

        ActivityLogService::log(
            'partners',
            'restore',
            "Partner restored: {$partner->name} ({$partner->code})",
            $partner
        );

        return redirect()->back()->with('success', 'Partner restored successfully.');
    }

    // -------------------------------------------------------------------------
    // Force Delete
    // -------------------------------------------------------------------------

    public function forceDelete(int $id): RedirectResponse
    {
        abort_unless(Auth::user()->hasRole('Super Admin'), 403);

        $partner = Partner::onlyTrashed()->findOrFail($id);

        DB::transaction(function () use ($partner) {
            $partner->partnerInvestments()->delete();
            $partner->forceDelete();
        });

        ActivityLogService::log(
            'partners',
            'force_delete',
            "Partner permanently deleted: {$partner->name} ({$partner->code})",
            null,
            ['name' => $partner->name, 'code' => $partner->code]
        );

        return redirect()->route('backend.partners.index')
            ->with('success', 'Partner permanently deleted.');
    }

    // -------------------------------------------------------------------------
    // Bulk Action
    // -------------------------------------------------------------------------

    public function bulkAction(Request $request): RedirectResponse
    {
        $request->validate([
            'action' => 'required|in:delete,restore,force_delete',
            'ids'    => 'required|array|min:1',
            'ids.*'  => 'integer',
        ]);

        $action = $request->input('action');
        $ids    = $request->input('ids');

        match ($action) {
            'delete'       => $this->bulkDelete($ids),
            'restore'      => $this->bulkRestore($ids),
            'force_delete' => $this->bulkForceDelete($ids),
        };

        $label = match ($action) {
            'delete'       => 'deleted',
            'restore'      => 'restored',
            'force_delete' => 'permanently deleted',
        };

        return redirect()->back()
            ->with('success', count($ids) . " partner(s) {$label} successfully.");
    }

    private function bulkDelete(array $ids): void
    {
        abort_unless(Auth::user()->hasPermissionTo('partners.delete'), 403);

        $partners = Partner::whereIn('id', $ids)->get();

        foreach ($partners as $partner) {
            $partner->delete();

            ActivityLogService::log(
                'partners',
                'bulk_delete',
                "Partner bulk deleted: {$partner->name} ({$partner->code})",
                $partner
            );
        }
    }

    private function bulkRestore(array $ids): void
    {
        abort_unless(Auth::user()->hasPermissionTo('partners.restore'), 403);

        $partners = Partner::onlyTrashed()->whereIn('id', $ids)->get();

        foreach ($partners as $partner) {
            $partner->restore();

            ActivityLogService::log(
                'partners',
                'bulk_restore',
                "Partner bulk restored: {$partner->name} ({$partner->code})",
                $partner
            );
        }
    }

    private function bulkForceDelete(array $ids): void
    {
        abort_unless(Auth::user()->hasRole('Super Admin'), 403);

        $partners = Partner::onlyTrashed()->whereIn('id', $ids)->get();

        DB::transaction(function () use ($partners) {
            foreach ($partners as $partner) {
                $partner->partnerInvestments()->delete();
                $partner->forceDelete();

                ActivityLogService::log(
                    'partners',
                    'bulk_force_delete',
                    "Partner bulk permanently deleted: {$partner->name} ({$partner->code})",
                    null,
                    ['name' => $partner->name, 'code' => $partner->code]
                );
            }
        });
    }

    // -------------------------------------------------------------------------
    // Link Investment
    // -------------------------------------------------------------------------

    public function linkInvestment(Request $request, Partner $partner): RedirectResponse
    {
        abort_unless(Gate::allows('update', $partner), 403);

        $validated = $request->validate([
            'investment_id' => 'required|exists:investments,id',
            'is_primary'    => 'boolean',
            'note'          => 'nullable|string|max:500',
        ]);

        $alreadyLinked = PartnerInvestment::where('partner_id', $partner->id)
            ->where('investment_id', $validated['investment_id'])
            ->exists();

        if ($alreadyLinked) {
            return redirect()->back()
                ->with('error', 'This investment is already linked to this partner.');
        }

        if (!empty($validated['is_primary'])) {
            PartnerInvestment::where('partner_id', $partner->id)
                ->update(['is_primary' => false]);
        }

        PartnerInvestment::create([
            'partner_id'    => $partner->id,
            'investment_id' => $validated['investment_id'],
            'is_primary'    => $validated['is_primary'] ?? false,
            'note'          => $validated['note'] ?? null,
        ]);

        ActivityLogService::log(
            'partners',
            'link_investment',
            "Investment linked to partner: {$partner->name} ({$partner->code})",
            $partner,
            ['investment_id' => $validated['investment_id']]
        );

        return redirect()->back()->with('success', 'Investment linked successfully.');
    }

    // -------------------------------------------------------------------------
    // Unlink Investment
    // -------------------------------------------------------------------------

    public function unlinkInvestment(
        Partner $partner,
        PartnerInvestment $partnerInvestment
    ): RedirectResponse {
        abort_unless(Gate::allows('update', $partner), 403);

        $partnerInvestment->delete();

        ActivityLogService::log(
            'partners',
            'unlink_investment',
            "Investment unlinked from partner: {$partner->name} ({$partner->code})",
            $partner,
            ['investment_id' => $partnerInvestment->investment_id]
        );

        return redirect()->back()->with('success', 'Investment unlinked successfully.');
    }
}
