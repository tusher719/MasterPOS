<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Investor Statement — {{ $investment->investor_name }}</title>
    <style>
        /* ── Base ── */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #1f2937;
            background: #ffffff;
            padding: 32px 36px;
        }

        /* ── Header ── */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .header-logo {
            width: 48px;
            height: 48px;
            object-fit: contain;
        }

        .header-title {
            font-size: 18px;
            font-weight: 700;
            color: #4f46e5;
        }

        .header-subtitle {
            font-size: 10px;
            color: #6b7280;
            margin-top: 2px;
        }

        .header-right {
            text-align: right;
        }

        .header-right .label {
            font-size: 9px;
            color: #9ca3af;
            text-transform: uppercase;
        }

        .header-right .value {
            font-size: 11px;
            color: #374151;
            margin-top: 1px;
        }

        /* ── Status Badge ── */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 99px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .badge-active {
            background: #dcfce7;
            color: #15803d;
        }

        .badge-withdrawn {
            background: #f3f4f6;
            color: #6b7280;
        }

        .badge-green {
            background: #dcfce7;
            color: #15803d;
        }

        .badge-blue {
            background: #dbeafe;
            color: #1d4ed8;
        }

        .badge-amber {
            background: #fef3c7;
            color: #b45309;
        }

        .badge-purple {
            background: #ede9fe;
            color: #7c3aed;
        }

        .badge-indigo {
            background: #e0e7ff;
            color: #4338ca;
        }

        .badge-red {
            background: #fee2e2;
            color: #b91c1c;
        }

        .badge-orange {
            background: #ffedd5;
            color: #c2410c;
        }

        .badge-gray {
            background: #f3f4f6;
            color: #6b7280;
        }

        /* ── Section ── */
        .section {
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 11px;
            font-weight: 700;
            color: #4f46e5;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            border-bottom: 1px solid #e0e7ff;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }

        /* ── Investment Info ── */
        .info-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0;
        }

        .info-cell {
            width: auto;
            padding: 6px 8px 6px 0;
        }

        .info-label {
            font-size: 9px;
            color: #9ca3af;
            text-transform: uppercase;
        }

        .info-value {
            font-size: 11px;
            color: #1f2937;
            margin-top: 2px;
            font-weight: 600;
        }

        /* ── Summary Cards ── */
        .summary-row {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }

        .summary-card {
            flex: 1;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            overflow: hidden;
        }

        .summary-card-header {
            padding: 8px 12px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .summary-card-header-capital {
            background: #eef2ff;
            color: #4338ca;
        }

        .summary-card-header-profit {
            background: #fffbeb;
            color: #b45309;
        }

        .summary-hero {
            padding: 10px 12px;
            border-bottom: 1px solid #f3f4f6;
        }

        .summary-hero-label {
            font-size: 9px;
            color: #9ca3af;
        }

        .summary-hero-value {
            font-size: 16px;
            font-weight: 700;
            margin-top: 2px;
        }

        .summary-hero-value-capital {
            color: #4338ca;
        }

        .summary-hero-value-profit {
            color: #b45309;
        }

        .summary-row-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 12px;
            border-bottom: 1px solid #f9fafb;
        }

        .summary-row-item:last-child {
            border-bottom: none;
        }

        .summary-row-label {
            font-size: 10px;
            color: #6b7280;
        }

        .summary-row-value {
            font-size: 10px;
            font-weight: 600;
        }

        .color-green {
            color: #16a34a;
        }

        .color-red {
            color: #dc2626;
        }

        .color-indigo {
            color: #4338ca;
        }

        .color-amber {
            color: #b45309;
        }

        .color-purple {
            color: #7c3aed;
        }

        .color-gray {
            color: #6b7280;
        }

        /* ── Tables ── */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }

        th {
            background: #f9fafb;
            color: #6b7280;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 6px 8px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
        }

        th.text-right {
            text-align: right;
        }

        th.text-center {
            text-align: center;
        }

        td {
            padding: 6px 8px;
            border-bottom: 1px solid #f3f4f6;
            color: #374151;
            vertical-align: top;
        }

        td.text-right {
            text-align: right;
        }

        td.text-center {
            text-align: center;
        }

        tr:last-child td {
            border-bottom: none;
        }

        .tfoot-row td {
            background: #f9fafb;
            font-weight: 700;
            border-top: 1px solid #e5e7eb;
            border-bottom: none;
        }

        .muted {
            color: #d1d5db;
        }

        .mono {
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 9px;
        }

        /* ── Empty State ── */
        .empty-state {
            text-align: center;
            padding: 16px;
            color: #9ca3af;
            font-size: 10px;
            font-style: italic;
            border: 1px dashed #e5e7eb;
            border-radius: 4px;
        }

        /* ── Footer ── */
        .pdf-footer {
            position: fixed;
            bottom: 20px;
            left: 36px;
            right: 36px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 6px;
            font-size: 9px;
            color: #9ca3af;
        }

        /* ── Page Break ── */
        .page-break {
            page-break-before: always;
        }
    </style>
</head>

<body>

    {{-- ════════════════════════════════════════
     HEADER
     ════════════════════════════════════════ --}}
    <div class="header">
        <div class="header-left">
            @if ($logo_path)
                <img src="{{ $logo_path }}" alt="Logo" class="header-logo" />
            @endif
            <div>
                <div class="header-title">Investor Statement</div>
                <div class="header-subtitle">Master Business Suite — Confidential</div>
            </div>
        </div>
        <div class="header-right">
            <div class="label">Generated At</div>
            <div class="value">{{ $generated_at }}</div>
            <div style="margin-top: 6px;">
                <span class="badge {{ $investment->status === 'active' ? 'badge-active' : 'badge-withdrawn' }}">
                    {{ ucfirst($investment->status) }}
                </span>
            </div>
        </div>
    </div>

    {{-- ════════════════════════════════════════
     SECTION 1 — INVESTMENT INFORMATION
     ════════════════════════════════════════ --}}
    <div class="section">
        <div class="section-title">Investment Information</div>
        <div class="info-grid">
            <div class="info-cell">
                <div class="info-label">Investor Name</div>
                <div class="info-value">{{ $investment->investor_name }}</div>
            </div>
            <div class="info-cell">
                <div class="info-label">Investment Title</div>
                <div class="info-value">{{ $investment->title }}</div>
            </div>
            <div class="info-cell">
                <div class="info-label">Investment Type</div>
                <div class="info-value">{{ $investment_type_name ?? '—' }}</div>
            </div>
            <div class="info-cell">
                <div class="info-label">Initial Amount</div>
                <div class="info-value" style="color: #4338ca;">
                    ৳{{ number_format($investment->amount, 2) }}
                </div>
            </div>
            <div class="info-cell">
                <div class="info-label">Investment Date</div>
                <div class="info-value">
                    {{ $investment->investment_date ? \Carbon\Carbon::parse($investment->investment_date)->format('d M Y') : '—' }}
                </div>
            </div>
            <div class="info-cell">
                <div class="info-label">Reference</div>
                <div class="info-value">{{ $investment->reference ?? '—' }}</div>
            </div>
            <div class="info-cell">
                <div class="info-label">Status</div>
                <div class="info-value" style="margin-top: 4px;">
                    <span class="badge {{ $investment->status === 'active' ? 'badge-active' : 'badge-withdrawn' }}">
                        {{ ucfirst($investment->status) }}
                    </span>
                </div>
            </div>
        </div>
    </div>

    {{-- ════════════════════════════════════════
    SECTION 2 — CAPITAL + PROFIT SUMMARY
    ════════════════════════════════════════ --}}
    <div class="summary-row">

        {{-- Capital Summary — only when capital data exists --}}
        @if ($capital_summary && $capital_summary->total_deposited > 0)
            <div class="summary-card">
                <div class="summary-card-header summary-card-header-capital">Capital Summary</div>
                <div class="summary-hero">
                    <div class="summary-hero-label">Current Capital Balance</div>
                    <div class="summary-hero-value summary-hero-value-capital">
                        ৳{{ number_format($capital_summary?->current_balance ?? 0, 2) }}
                    </div>
                </div>
                <div class="summary-row-item">
                    <span class="summary-row-label">Total Deposited</span>
                    <span class="summary-row-value color-green">
                        ৳{{ number_format($capital_summary?->total_deposited ?? 0, 2) }}
                    </span>
                </div>
                <div class="summary-row-item">
                    <span class="summary-row-label">Total Withdrawn</span>
                    <span class="summary-row-value color-red">
                        ৳{{ number_format($capital_summary?->total_withdrawn ?? 0, 2) }}
                    </span>
                </div>
                <div class="summary-row-item">
                    <span class="summary-row-label">Total Reinvested</span>
                    <span class="summary-row-value color-indigo">
                        ৳{{ number_format($capital_summary?->total_reinvested ?? 0, 2) }}
                    </span>
                </div>
                <div class="summary-row-item">
                    <span class="summary-row-label">Total Adjusted</span>
                    <span class="summary-row-value color-amber">
                        ৳{{ number_format($capital_summary?->total_adjusted ?? 0, 2) }}
                    </span>
                </div>
            </div>
        @endif

        {{-- Profit Summary --}}
        <div class="summary-card">
            <div class="summary-card-header summary-card-header-profit">Profit Summary</div>
            <div class="summary-hero">
                <div class="summary-hero-label">Pending Profit Balance</div>
                <div class="summary-hero-value summary-hero-value-profit">
                    ৳{{ number_format($profit_summary?->pending_balance ?? 0, 2) }}
                </div>
            </div>
            <div class="summary-row-item">
                <span class="summary-row-label">Total Earned</span>
                <span class="summary-row-value" style="color: #1f2937;">
                    ৳{{ number_format($profit_summary?->total_earned ?? 0, 2) }}
                </span>
            </div>
            <div class="summary-row-item">
                <span class="summary-row-label">Total Paid Out</span>
                <span class="summary-row-value color-green">
                    ৳{{ number_format($profit_summary?->total_paid ?? 0, 2) }}
                </span>
            </div>
            <div class="summary-row-item">
                <span class="summary-row-label">Total Deferred</span>
                <span class="summary-row-value color-purple">
                    ৳{{ number_format($profit_summary?->total_deferred ?? 0, 2) }}
                </span>
            </div>
            <div class="summary-row-item">
                <span class="summary-row-label">Total Reinvested</span>
                <span class="summary-row-value color-indigo">
                    ৳{{ number_format($profit_summary?->total_reinvested ?? 0, 2) }}
                </span>
            </div>
        </div>

    </div>

    {{-- ════════════════════════════════════════
     SECTION 3 — DISTRIBUTION HISTORY
     ════════════════════════════════════════ --}}
    <div class="section">
        <div class="section-title">Distribution History</div>

        @if ($distribution_history->isEmpty())
            <div class="empty-state">No distribution records found for this investor.</div>
        @else
            <table>
                <thead>
                    <tr>
                        <th>Distribution No</th>
                        <th>Period</th>
                        <th class="text-center">Dist. Status</th>
                        <th class="text-right">Share %</th>
                        <th class="text-right">Share Amount</th>
                        <th class="text-right">Deferred</th>
                        <th class="text-right">Reinvested</th>
                        <th class="text-center">Payment Status</th>
                    </tr>
                </thead>
                <tbody>
                    @php
                        $totalShare = 0;
                        $totalDeferred = 0;
                        $totalReinvested = 0;
                    @endphp

                    @foreach ($distribution_history as $item)
                        @php
                            $dist = $item->profitDistribution;
                            $totalShare += (float) $item->share_amount;
                            $totalDeferred += (float) $item->deferred_amount;
                            $totalReinvested += (float) $item->reinvested_amount;

                            $paymentBadge = match ($item->payment_status) {
                                'paid' => 'badge-green',
                                'partial' => 'badge-blue',
                                'deferred' => 'badge-purple',
                                'reinvested' => 'badge-indigo',
                                'cancelled' => 'badge-red',
                                'reopened' => 'badge-orange',
                                default => 'badge-amber',
                            };
                            $distBadge = $dist?->status === 'distributed' ? 'badge-green' : 'badge-blue';
                        @endphp
                        <tr>
                            <td>
                                <div style="font-weight: 600;">{{ $dist?->distribution_no ?? '—' }}</div>
                                <div style="font-size: 9px; color: #9ca3af; margin-top: 1px;">
                                    {{ $dist?->title ?? '' }}
                                </div>
                            </td>
                            <td style="font-size: 9px; color: #6b7280; white-space: nowrap;">
                                {{ $dist?->period_start ? \Carbon\Carbon::parse($dist->period_start)->format('d M Y') : '—' }}
                                →
                                {{ $dist?->period_end ? \Carbon\Carbon::parse($dist->period_end)->format('d M Y') : '—' }}
                            </td>
                            <td class="text-center">
                                <span class="badge {{ $distBadge }}">
                                    {{ ucfirst($dist?->status ?? '—') }}
                                </span>
                            </td>
                            <td class="text-right">{{ number_format($item->share_percent, 2) }}%</td>
                            <td class="text-right" style="font-weight: 600;">
                                ৳{{ number_format($item->share_amount, 2) }}
                            </td>
                            <td class="text-right">
                                @if ((float) $item->deferred_amount > 0)
                                    <span class="color-purple">৳{{ number_format($item->deferred_amount, 2) }}</span>
                                @else
                                    <span class="muted">—</span>
                                @endif
                            </td>
                            <td class="text-right">
                                @if ((float) $item->reinvested_amount > 0)
                                    <span
                                        class="color-indigo">৳{{ number_format($item->reinvested_amount, 2) }}</span>
                                @else
                                    <span class="muted">—</span>
                                @endif
                            </td>
                            <td class="text-center">
                                <span class="badge {{ $paymentBadge }}">
                                    {{ ucfirst($item->payment_status) }}
                                </span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr class="tfoot-row">
                        <td colspan="4">
                            Totals ({{ $distribution_history->count() }}
                            distribution{{ $distribution_history->count() !== 1 ? 's' : '' }})
                        </td>
                        <td class="text-right">৳{{ number_format($totalShare, 2) }}</td>
                        <td class="text-right color-purple">
                            {{ $totalDeferred > 0 ? '৳' . number_format($totalDeferred, 2) : '—' }}
                        </td>
                        <td class="text-right color-indigo">
                            {{ $totalReinvested > 0 ? '৳' . number_format($totalReinvested, 2) : '—' }}
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        @endif
    </div>

    {{-- ════════════════════════════════════════
     SECTION 4 — CAPITAL TRANSACTION HISTORY
     (page break before if distribution table was long)
     ════════════════════════════════════════ --}}
    @if ($capital_transactions->isNotEmpty())

        @if ($distribution_history->count() > 8)
            <div class="page-break"></div>
        @endif

        <div class="section">
            <div class="section-title">Capital Transaction History</div>

            @if ($capital_transactions->isEmpty())
                <div class="empty-state">No capital transactions found for this investor.</div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Reference</th>
                            <th class="text-center">Type</th>
                            <th class="text-right">Credit</th>
                            <th class="text-right">Debit</th>
                            <th class="text-right">Balance After</th>
                            <th class="text-center">Status</th>
                            <th>Reason / Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        @php
                            $totalCredit = 0;
                            $totalDebit = 0;
                            $latestBalance = null;
                        @endphp

                        @foreach ($capital_transactions as $entry)
                            @php
                                $typeBadge = match ($entry->transaction_type) {
                                    'deposit' => 'badge-green',
                                    'withdrawal' => 'badge-red',
                                    'reinvestment' => 'badge-indigo',
                                    'adjustment' => 'badge-amber',
                                    default => 'badge-gray',
                                };
                                $statusBadge = match ($entry->status) {
                                    'completed' => 'badge-green',
                                    'approved' => 'badge-blue',
                                    'pending' => 'badge-amber',
                                    'rejected' => 'badge-red',
                                    'cancelled' => 'badge-gray',
                                    default => 'badge-gray',
                                };
                                $isSettled = in_array($entry->status, ['completed', 'approved']);
                                $opacity = in_array($entry->status, ['cancelled', 'rejected']) ? 'opacity: 0.5;' : '';

                                if ($entry->direction === 'credit' && $isSettled) {
                                    $totalCredit += (float) $entry->amount;
                                }
                                if ($entry->direction === 'debit' && $isSettled) {
                                    $totalDebit += (float) $entry->amount;
                                }
                                if ($isSettled && $latestBalance === null) {
                                    $latestBalance = (float) $entry->running_balance;
                                }
                            @endphp
                            <tr style="{{ $opacity }}">
                                <td style="white-space: nowrap;">
                                    {{ \Carbon\Carbon::parse($entry->created_at)->format('d M Y') }}
                                </td>
                                <td>
                                    @if ($entry->reference_no)
                                        <span class="mono">{{ $entry->reference_no }}</span>
                                    @else
                                        <span class="muted">—</span>
                                    @endif
                                </td>
                                <td class="text-center">
                                    <span class="badge {{ $typeBadge }}">
                                        {{ ucfirst($entry->transaction_type) }}
                                    </span>
                                </td>
                                <td class="text-right">
                                    @if ($entry->direction === 'credit')
                                        <span class="color-green" style="font-weight: 600;">
                                            ৳{{ number_format($entry->amount, 2) }}
                                        </span>
                                    @else
                                        <span class="muted">—</span>
                                    @endif
                                </td>
                                <td class="text-right">
                                    @if ($entry->direction === 'debit')
                                        <span class="color-red" style="font-weight: 600;">
                                            ৳{{ number_format($entry->amount, 2) }}
                                        </span>
                                    @else
                                        <span class="muted">—</span>
                                    @endif
                                </td>
                                <td class="text-right">
                                    @if ($isSettled)
                                        <span style="font-weight: 700; color: #4338ca;">
                                            ৳{{ number_format($entry->running_balance, 2) }}
                                        </span>
                                    @else
                                        <span
                                            style="font-size: 9px; color: #d1d5db; font-style: italic;">pending</span>
                                    @endif
                                </td>
                                <td class="text-center">
                                    <span class="badge {{ $statusBadge }}">
                                        {{ ucfirst($entry->status) }}
                                    </span>
                                </td>
                                <td style="max-width: 140px;">
                                    @if ($entry->reason)
                                        <span style="font-size: 9px; color: #374151;">
                                            {{ \Illuminate\Support\Str::limit($entry->reason, 60) }}
                                        </span>
                                    @elseif ($entry->note)
                                        <span style="font-size: 9px; color: #9ca3af; font-style: italic;">
                                            {{ \Illuminate\Support\Str::limit($entry->note, 60) }}
                                        </span>
                                    @else
                                        <span class="muted">—</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                    <tfoot>
                        <tr class="tfoot-row">
                            <td colspan="3">
                                Completed Totals ({{ $capital_transactions->where('status', 'completed')->count() }}
                                of {{ $capital_transactions->count() }})
                            </td>
                            <td class="text-right color-green">
                                {{ $totalCredit > 0 ? '৳' . number_format($totalCredit, 2) : '—' }}
                            </td>
                            <td class="text-right color-red">
                                {{ $totalDebit > 0 ? '৳' . number_format($totalDebit, 2) : '—' }}
                            </td>
                            <td class="text-right" style="color: #4338ca;">
                                {{ $latestBalance !== null ? '৳' . number_format($latestBalance, 2) : '—' }}
                            </td>
                            <td colspan="2"></td>
                        </tr>
                    </tfoot>
                </table>
            @endif
        </div>
    @endif

    {{-- ════════════════════════════════════════
     PDF FOOTER — fixed position
     ════════════════════════════════════════ --}}
    <div class="pdf-footer">
        <span>Generated: {{ $generated_at }} · Master Business Suite · Confidential</span>
        <span>Page <span class="pagenum"></span></span>
    </div>

</body>

</html>
