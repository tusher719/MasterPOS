<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\BusinessSetting;
use App\Models\Investment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class InvestorStatementController extends Controller
{
    public function index()
    {
        abort_unless(Gate::allows('investor_statement.view'), 403);

        $investors = Investment::with([
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
                    'id'               => $investment->id,
                    'investor_name'    => $investment->investor_name,
                    'title'            => $investment->title,
                    'investment_type'  => $investment->investmentType?->name,
                    'investment_date'  => $investment->investment_date,
                    'status'           => $investment->status,
                    'amount'           => (float) $investment->amount,
                    'capital' => [
                        'current_balance'   => (float) $capital?->current_balance ?? 0,
                        'total_deposited'   => (float) $capital?->total_deposited ?? 0,
                        'total_withdrawn'   => (float) $capital?->total_withdrawn ?? 0,
                        'total_reinvested'  => (float) $capital?->total_reinvested ?? 0,
                        'total_adjusted'    => (float) $capital?->total_adjusted ?? 0,
                    ],
                    'profit' => [
                        'pending_balance'   => (float) $profit?->pending_balance ?? 0,
                        'total_earned'      => (float) $profit?->total_earned ?? 0,
                        'total_paid'        => (float) $profit?->total_paid ?? 0,
                        'total_deferred'    => (float) $profit?->total_deferred ?? 0,
                        'total_reinvested'  => (float) $profit?->total_reinvested ?? 0,
                    ],
                ];
            });

        return Inertia::render('Backend/InvestorStatements/Index', [
            'investors' => $investors,
            'can' => [
                'view'   => Gate::allows('investor_statement.view'),
                'export' => Gate::allows('investor_statement.export'),
            ],
        ]);
    }

    public function show(Investment $investment)
    {
        abort_unless(Gate::allows('investor_statement.view'), 403);

        // Eager load all relations to avoid N+1
        $investment->load([
            'investmentType',
            'capitalBalance',
            'profitBalance',
            'capitalLedgerEntries' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
            'distributionItems' => function ($q) {
                $q->with([
                    'profitDistribution' => function ($q2) {
                        $q2->select(
                            'id',
                            'distribution_no',
                            'title',
                            'distribution_date',
                            'period_start',
                            'period_end',
                            'status'
                        );
                    },
                ])
                    ->whereHas('profitDistribution', function ($q2) {
                        $q2->whereIn('status', ['approved', 'distributed']);
                    })
                    ->orderBy('created_at', 'desc');
            },
        ]);

        $capital = $investment->capitalBalance;
        $profit  = $investment->profitBalance;

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
                'current_balance'  => (float) $capital?->current_balance ?? 0,
                'total_deposited'  => (float) $capital?->total_deposited ?? 0,
                'total_withdrawn'  => (float) $capital?->total_withdrawn ?? 0,
                'total_reinvested' => (float) $capital?->total_reinvested ?? 0,
                'total_adjusted'   => (float) $capital?->total_adjusted ?? 0,
            ],
            'profit_summary' => [
                'total_earned'     => (float) $profit?->total_earned ?? 0,
                'total_paid'       => (float) $profit?->total_paid ?? 0,
                'total_deferred'   => (float) $profit?->total_deferred ?? 0,
                'total_reinvested' => (float) $profit?->total_reinvested ?? 0,
                'pending_balance'  => (float) $profit?->pending_balance ?? 0,
            ],
            'distribution_history' => $investment->distributionItems->map(function ($item) {
                $dist = $item->profitDistribution;

                return [
                    'id'                => $item->id,
                    'distribution_no'   => $dist?->distribution_no,
                    'title'             => $dist?->title,
                    'distribution_date' => $dist?->distribution_date,
                    'period_start'      => $dist?->period_start,
                    'period_end'        => $dist?->period_end,
                    'distribution_status' => $dist?->status,
                    'share_percent'     => (float) $item->share_percent,
                    'share_amount'      => (float) $item->share_amount,
                    'deferred_amount'   => (float) $item->deferred_amount,
                    'reinvested_amount' => (float) $item->reinvested_amount,
                    'payment_status'    => $item->payment_status,
                    'note'              => $item->note,
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

    public function pdf(Investment $investment)
    {
        abort_unless(Gate::allows('investor_statement.export'), 403);

        // Same eager loading as show()
        $investment->load([
            'investmentType',
            'capitalBalance',
            'profitBalance',
            'capitalLedgerEntries' => fn($q) => $q->orderBy('created_at', 'desc'),
            'distributionItems' => function ($q) {
                $q->with([
                    'profitDistribution' => fn($q2) => $q2->select(
                        'id', 'distribution_no', 'title',
                        'distribution_date', 'period_start', 'period_end', 'status'
                    ),
                ])
                    ->whereHas('profitDistribution', fn($q2) => $q2->whereIn('status', ['approved', 'distributed']))
                    ->orderBy('created_at', 'desc');
            },
        ]);

        $capital = $investment->capitalBalance;
        $profit  = $investment->profitBalance;

        $data = [
            'investment'           => $investment,
            'investment_type_name' => $investment->investmentType?->name,
            'capital_summary'      => $capital,
            'profit_summary'       => $profit,
            'distribution_history' => $investment->distributionItems,
            'capital_transactions' => $investment->capitalLedgerEntries,
            'generated_at'         => now()->format('d M Y, h:i A'),
            'logo_path'            => $this->resolveLogoPath(),
        ];

        $pdf = Pdf::loadView('pdf.investor-statement', $data)
            ->setPaper('a4', 'portrait');

        $filename = 'investor-statement-' . str($investment->investor_name)->slug() . '-' . now()->format('Ymd') . '.pdf';

        return $pdf->download($filename);
    }

    private function resolveLogoPath(): ?string
    {
        $setting = BusinessSetting::where('key', 'logo')->first();
        if (!$setting || !$setting->value) {
            return null;
        }

        $path = public_path('storage/' . $setting->value);

        return file_exists($path) ? $path : null;
    }
}
