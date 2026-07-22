<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\BusinessSetting;
use App\Models\Investment;
use App\Models\Partner;
use App\Models\ProfitDistributionItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class InvestorStatementController extends Controller
{
    // -------------------------------------------------------------------------
    // INDEX — all investors + standalone partners
    // -------------------------------------------------------------------------

    public function index()
    {
        abort_unless(Gate::allows('investor_statement.view'), 403);

        // --- Investment-based rows ---
        $investmentRows = Investment::with([
            'capitalBalance',
            'profitBalance',
            'investmentType',
        ])
            ->withTrashed()
            ->orderBy('investor_name')
            ->get()
            ->map(function (Investment $investment) {
                $capital = $investment->capitalBalance;
                $profit  = $investment->profitBalance;

                return [
                    'id'              => $investment->id,
                    'type'            => 'investment',
                    'investor_name'   => $investment->investor_name,
                    'title'           => $investment->title,
                    'investment_type' => $investment->investmentType?->name,
                    'investment_date' => $investment->investment_date,
                    'status'          => $investment->status,
                    'amount'          => (float) $investment->amount,
                    'capital' => [
                        'current_balance'  => (float) ($capital?->current_balance ?? 0),
                        'total_deposited'  => (float) ($capital?->total_deposited ?? 0),
                        'total_withdrawn'  => (float) ($capital?->total_withdrawn ?? 0),
                        'total_reinvested' => (float) ($capital?->total_reinvested ?? 0),
                        'total_adjusted'   => (float) ($capital?->total_adjusted ?? 0),
                    ],
                    'profit' => [
                        'pending_balance'  => (float) ($profit?->pending_balance ?? 0),
                        'total_earned'     => (float) ($profit?->total_earned ?? 0),
                        'total_paid'       => (float) ($profit?->total_paid ?? 0),
                        'total_deferred'   => (float) ($profit?->total_deferred ?? 0),
                        'total_reinvested' => (float) ($profit?->total_reinvested ?? 0),
                    ],
                ];
            });

        // --- Partner-based rows ---
        // Partners with no linked investment AND at least 1 distribution item
        $partnerRows = Partner::with(['profitBalance'])
            ->whereDoesntHave('investments')
            ->whereHas('distributionItems')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function (Partner $partner) {
                $profit = $partner->profitBalance;

                return [
                    'id'              => $partner->id,
                    'type'            => 'partner',
                    'investor_name'   => $partner->name,
                    'title'           => $partner->code ?? '—',
                    'investment_type' => $this->partnerTypeLabel($partner),
                    'investment_date' => null,
                    'status'          => 'active',
                    'amount'          => 0.0,
                    'capital' => [
                        'current_balance'  => 0.0,
                        'total_deposited'  => 0.0,
                        'total_withdrawn'  => 0.0,
                        'total_reinvested' => 0.0,
                        'total_adjusted'   => 0.0,
                    ],
                    'profit' => [
                        'pending_balance'  => (float) (($profit?->pending_cost_balance ?? 0) + ($profit?->pending_profit_balance ?? 0)),
                        'total_earned'     => (float) (($profit?->total_cost_returned ?? 0) + ($profit?->total_profit_earned ?? 0)),
                        'total_paid'       => (float) (($profit?->total_cost_paid ?? 0) + ($profit?->total_profit_paid ?? 0)),
                        'total_deferred'   => 0.0,
                        'total_reinvested' => 0.0,
                    ],
                ];
            });

        $investors = $investmentRows->concat($partnerRows)->values();

        return Inertia::render('Backend/InvestorStatements/Index', [
            'investors' => $investors,
            'can' => [
                'view'   => Gate::allows('investor_statement.view'),
                'export' => Gate::allows('investor_statement.export'),
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // SHOW — investment-based
    // Includes partner_based items if investment has a linked partner_id
    // -------------------------------------------------------------------------

    public function show(Investment $investment)
    {
        abort_unless(Gate::allows('investor_statement.view'), 403);

        $investment->load([
            'investmentType',
            'capitalBalance',
            'profitBalance',
            'capitalLedgerEntries' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
        ]);

        $capital = $investment->capitalBalance;
        $profit  = $investment->profitBalance;

        // Fetch distribution items by investment_id OR partner_id (if linked)
        $distributionItems = ProfitDistributionItem::with([
            'profitDistribution' => function ($q) {
                $q->select(
                    'id', 'distribution_no', 'title',
                    'distribution_date', 'period_start', 'period_end', 'status'
                );
            },
        ])
            ->where(function ($q) use ($investment) {
                $q->where('investment_id', $investment->id);

                // Also include partner_based items for this investment's linked partner
                if ($investment->partner_id) {
                    $q->orWhere(function ($q2) use ($investment) {
                        $q2->where('partner_id', $investment->partner_id)
                            ->whereNull('investment_id');
                    });
                }
            })
            ->whereHas('profitDistribution', function ($q) {
                $q->whereIn('status', ['approved', 'distributed']);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $statement = [
            'investment' => [
                'id'              => $investment->id,
                'investor_name'   => $investment->investor_name,
                'title'           => $investment->title,
                'investment_type' => $investment->investmentType?->name,
                'investment_date' => $investment->investment_date,
                'reference'       => $investment->reference,
                'status'          => $investment->status,
                'amount'          => (float) $investment->amount,
            ],
            'capital_summary' => [
                'current_balance'  => (float) ($capital?->current_balance ?? 0),
                'total_deposited'  => (float) ($capital?->total_deposited ?? 0),
                'total_withdrawn'  => (float) ($capital?->total_withdrawn ?? 0),
                'total_reinvested' => (float) ($capital?->total_reinvested ?? 0),
                'total_adjusted'   => (float) ($capital?->total_adjusted ?? 0),
            ],
            'profit_summary' => [
                'total_earned'     => (float) ($profit?->total_earned ?? 0),
                'total_paid'       => (float) ($profit?->total_paid ?? 0),
                'total_deferred'   => (float) ($profit?->total_deferred ?? 0),
                'total_reinvested' => (float) ($profit?->total_reinvested ?? 0),
                'pending_balance'  => (float) ($profit?->pending_balance ?? 0),
            ],
            'distribution_history' => $distributionItems->map(function ($item) {
                $dist = $item->profitDistribution;

                return [
                    'id'                  => $item->id,
                    'distribution_no'     => $dist?->distribution_no,
                    'title'               => $dist?->title,
                    'distribution_date'   => $dist?->distribution_date,
                    'period_start'        => $dist?->period_start,
                    'period_end'          => $dist?->period_end,
                    'distribution_status' => $dist?->status,
                    'share_percent'       => (float) $item->share_percent,
                    'share_amount'        => (float) $item->share_amount,
                    'cost_return_amount'  => (float) ($item->cost_return_amount ?? 0),
                    'deferred_amount'     => (float) $item->deferred_amount,
                    'reinvested_amount'   => (float) $item->reinvested_amount,
                    'payment_status'      => $item->payment_status,
                    'note'                => $item->note,
                ];
            }),
            'capital_transactions' => $investment->capitalLedgerEntries->map(function ($entry) {
                return [
                    'id'               => $entry->id,
                    'reference_no'     => $entry->reference_no,
                    'transaction_type' => $entry->transaction_type,
                    'direction'        => $entry->direction,
                    'amount'           => (float) $entry->amount,
                    'running_balance'  => (float) $entry->running_balance,
                    'reason'           => $entry->reason,
                    'note'             => $entry->note,
                    'status'           => $entry->status,
                    'created_at'       => $entry->created_at?->toDateString(),
                ];
            }),
        ];

        return Inertia::render('Backend/InvestorStatements/Show', [
            'statement' => $statement,
            'can' => [
                'view'   => Gate::allows('investor_statement.view'),
                'export' => Gate::allows('investor_statement.export'),
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // SHOW PARTNER — partner-based statement
    // -------------------------------------------------------------------------

    public function showPartner(Partner $partner)
    {
        abort_unless(Gate::allows('investor_statement.view'), 403);

        $profitBalance = $partner->profitBalance;

        $distributionItems = ProfitDistributionItem::with([
            'profitDistribution' => function ($q) {
                $q->select(
                    'id', 'distribution_no', 'title',
                    'distribution_date', 'period_start', 'period_end', 'status'
                );
            },
        ])
            ->where('partner_id', $partner->id)
            ->whereHas('profitDistribution', function ($q) {
                $q->whereIn('status', ['approved', 'distributed']);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $statement = [
            'partner' => [
                'id'         => $partner->id,
                'name'       => $partner->name,
                'code'       => $partner->code,
                'type_label' => $this->partnerTypeLabel($partner),
                'is_capital' => (bool) $partner->partner_type_capital,
                'is_working' => (bool) $partner->partner_type_working,
                'is_product' => (bool) $partner->partner_type_product,
                'is_active'  => (bool) $partner->is_active,
            ],
            'profit_balance' => [
                'total_cost_returned'    => (float) ($profitBalance?->total_cost_returned ?? 0),
                'total_cost_paid'        => (float) ($profitBalance?->total_cost_paid ?? 0),
                'pending_cost_balance'   => (float) ($profitBalance?->pending_cost_balance ?? 0),
                'total_profit_earned'    => (float) ($profitBalance?->total_profit_earned ?? 0),
                'total_profit_paid'      => (float) ($profitBalance?->total_profit_paid ?? 0),
                'pending_profit_balance' => (float) ($profitBalance?->pending_profit_balance ?? 0),
            ],
            'distribution_history' => $distributionItems->map(function ($item) {
                $dist = $item->profitDistribution;

                return [
                    'id'                  => $item->id,
                    'distribution_no'     => $dist?->distribution_no,
                    'title'               => $dist?->title,
                    'distribution_date'   => $dist?->distribution_date,
                    'period_start'        => $dist?->period_start,
                    'period_end'          => $dist?->period_end,
                    'distribution_status' => $dist?->status,
                    'share_percent'       => (float) $item->share_percent,
                    'share_amount'        => (float) $item->share_amount,
                    'cost_return_amount'  => (float) ($item->cost_return_amount ?? 0),
                    'payment_status'      => $item->payment_status,
                    'note'                => $item->note,
                ];
            }),
        ];

        return Inertia::render('Backend/InvestorStatements/PartnerShow', [
            'statement' => $statement,
            'can' => [
                'view'   => Gate::allows('investor_statement.view'),
                'export' => Gate::allows('investor_statement.export'),
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // PDF — investment-based
    // Includes partner_based items if investment has a linked partner_id
    // -------------------------------------------------------------------------

    public function pdf(Investment $investment)
    {
        abort_unless(Gate::allows('investor_statement.export'), 403);

        $investment->load([
            'investmentType',
            'capitalBalance',
            'profitBalance',
            'capitalLedgerEntries' => fn($q) => $q->orderBy('created_at', 'desc'),
        ]);

        // Same OR query as show()
        $distributionItems = ProfitDistributionItem::with([
            'profitDistribution' => fn($q) => $q->select(
                'id', 'distribution_no', 'title',
                'distribution_date', 'period_start', 'period_end', 'status'
            ),
        ])
            ->where(function ($q) use ($investment) {
                $q->where('investment_id', $investment->id);

                if ($investment->partner_id) {
                    $q->orWhere(function ($q2) use ($investment) {
                        $q2->where('partner_id', $investment->partner_id)
                            ->whereNull('investment_id');
                    });
                }
            })
            ->whereHas('profitDistribution', fn($q) => $q->whereIn('status', ['approved', 'distributed']))
            ->orderBy('created_at', 'desc')
            ->get();

        $data = [
            'investment'           => $investment,
            'investment_type_name' => $investment->investmentType?->name,
            'capital_summary'      => $investment->capitalBalance,
            'profit_summary'       => $investment->profitBalance,
            'distribution_history' => $distributionItems,
            'capital_transactions' => $investment->capitalLedgerEntries,
            'generated_at'         => now()->format('d M Y, h:i A'),
            'logo_path'            => $this->resolveLogoPath(),
        ];

        $pdf = Pdf::loadView('pdf.investor-statement', $data)
            ->setPaper('a4', 'portrait');

        $filename = 'investor-statement-'
            . str($investment->investor_name)->slug()
            . '-' . now()->format('Ymd') . '.pdf';

        return $pdf->download($filename);
    }

    // -------------------------------------------------------------------------
    // PDF PARTNER — partner-based
    // -------------------------------------------------------------------------

    public function pdfPartner(Partner $partner)
    {
        abort_unless(Gate::allows('investor_statement.export'), 403);

        $profitBalance = $partner->profitBalance;

        $distributionItems = ProfitDistributionItem::with([
            'profitDistribution' => fn($q) => $q->select(
                'id', 'distribution_no', 'title',
                'distribution_date', 'period_start', 'period_end', 'status'
            ),
        ])
            ->where('partner_id', $partner->id)
            ->whereHas('profitDistribution', fn($q) => $q->whereIn('status', ['approved', 'distributed']))
            ->orderBy('created_at', 'desc')
            ->get();

        $data = [
            'partner'              => $partner,
            'type_label'           => $this->partnerTypeLabel($partner),
            'profit_balance'       => $profitBalance,
            'distribution_history' => $distributionItems,
            'generated_at'         => now()->format('d M Y, h:i A'),
            'logo_path'            => $this->resolveLogoPath(),
        ];

        $pdf = Pdf::loadView('pdf.partner-statement', $data)
            ->setPaper('a4', 'portrait');

        $filename = 'partner-statement-'
            . str($partner->name)->slug()
            . '-' . now()->format('Ymd') . '.pdf';

        return $pdf->download($filename);
    }

    // -------------------------------------------------------------------------
    // PRIVATE HELPERS
    // -------------------------------------------------------------------------

    private function resolveLogoPath(): ?string
    {
        $setting = BusinessSetting::where('key', 'logo')->first();
        if (!$setting || !$setting->value) {
            return null;
        }

        $path = public_path('storage/' . $setting->value);

        return file_exists($path) ? $path : null;
    }

    private function partnerTypeLabel(Partner $partner): string
    {
        $types = [];
        if ($partner->partner_type_capital) $types[] = 'Capital';
        if ($partner->partner_type_working) $types[] = 'Working';
        if ($partner->partner_type_product) $types[] = 'Product';

        return empty($types) ? 'Partner' : implode(' + ', $types);
    }
}
