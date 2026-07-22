<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <title>Partner Statement — {{ $partner->name }}</title>
    <style>
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

        /* ── Badges ── */
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

        .badge-inactive {
            background: #f3f4f6;
            color: #6b7280;
        }

        .badge-partner {
            background: #ede9fe;
            color: #7c3aed;
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

        /* ── Info Grid ── */
        .info-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0;
        }

        .info-cell {
            width: 25%;
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

        .summary-card-header-profit {
            background: #fffbeb;
            color: #b45309;
        }

        .summary-card-header-cost {
            background: #fff7ed;
            color: #c2410c;
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

        .summary-hero-value-profit {
            color: #b45309;
        }

        .summary-hero-value-cost {
            color: #c2410c;
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

        .color-orange {
            color: #c2410c;
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
                <div class="header-title">Partner Statement</div>
                <div class="header-subtitle">Master Business Suite — Confidential</div>
            </div>
        </div>
        <div class="header-right">
            <div class="label">Generated At</div>
            <div class="value">{{ $generated_at }}</div>
            <div style="margin-top: 6px;">
                <span class="badge badge-partner">{{ $type_label }}</span>
                &nbsp;
                <span class="badge {{ $partner->is_active ? 'badge-active' : 'badge-inactive' }}">
                    {{ $partner->is_active ? 'Active' : 'Inactive' }}
                </span>
            </div>
        </div>
    </div>

    {{-- ════════════════════════════════════════
 SECTION 1 — PARTNER INFORMATION
 ════════════════════════════════════════ --}}
    <div class="section">
        <div class="section-title">Partner Information</div>
        <div class="info-grid">
            <div class="info-cell">
                <div class="info-label">Partner Name</div>
                <div class="info-value">{{ $partner->name }}</div>
            </div>
            <div class="info-cell">
                <div class="info-label">Partner Code</div>
                <div class="info-value">{{ $partner->code ?? '—' }}</div>
            </div>
            <div class="info-cell">
                <div class="info-label">Partner Type</div>
                <div class="info-value">{{ $type_label }}</div>
            </div>
            <div class="info-cell">
                <div class="info-label">Status</div>
                <div class="info-value" style="margin-top: 4px;">
                    <span class="badge {{ $partner->is_active ? 'badge-active' : 'badge-inactive' }}">
                        {{ $partner->is_active ? 'Active' : 'Inactive' }}
                    </span>
                </div>
            </div>
        </div>
    </div>

    {{-- ════════════════════════════════════════
 SECTION 2 — PROFIT BALANCE SUMMARY
 ════════════════════════════════════════ --}}
    @php
        $totalPending = ($profit_balance?->pending_cost_balance ?? 0) + ($profit_balance?->pending_profit_balance ?? 0);
        $totalEarned = ($profit_balance?->total_cost_returned ?? 0) + ($profit_balance?->total_profit_earned ?? 0);
        $totalPaid = ($profit_balance?->total_cost_paid ?? 0) + ($profit_balance?->total_profit_paid ?? 0);
        $hasProduct =
            ($profit_balance?->total_cost_returned ?? 0) > 0 || ($profit_balance?->pending_cost_balance ?? 0) > 0;
    @endphp

    <div class="summary-row">

        {{-- Profit Summary --}}
        <div class="summary-card">
            <div class="summary-card-header summary-card-header-profit">Profit Summary</div>
            <div class="summary-hero">
                <div class="summary-hero-label">Total Pending Balance</div>
                <div class="summary-hero-value summary-hero-value-profit">
                    ৳{{ number_format($totalPending, 2) }}
                </div>
            </div>
            <div class="summary-row-item">
                <span class="summary-row-label">Total Earned</span>
                <span class="summary-row-value">
                    ৳{{ number_format($totalEarned, 2) }}
                </span>
            </div>
            <div class="summary-row-item">
                <span class="summary-row-label">Total Paid Out</span>
                <span class="summary-row-value color-green">
                    ৳{{ number_format($totalPaid, 2) }}
                </span>
            </div>
            <div class="summary-row-item">
                <span class="summary-row-label">Profit Share Pending</span>
                <span class="summary-row-value color-amber">
                    ৳{{ number_format($profit_balance?->pending_profit_balance ?? 0, 2) }}
                </span>
            </div>
            @if ($hasProduct)
                <div class="summary-row-item">
                    <span class="summary-row-label">Cost Return Pending</span>
                    <span class="summary-row-value color-orange">
                        ৳{{ number_format($profit_balance?->pending_cost_balance ?? 0, 2) }}
                    </span>
                </div>
            @endif
        </div>

        {{-- Cost Return Summary — product partners only --}}
        @if ($hasProduct)
            <div class="summary-card">
                <div class="summary-card-header summary-card-header-cost">Cost Return Summary</div>
                <div class="summary-hero">
                    <div class="summary-hero-label">Total Cost Returned</div>
                    <div class="summary-hero-value summary-hero-value-cost">
                        ৳{{ number_format($profit_balance?->total_cost_returned ?? 0, 2) }}
                    </div>
                </div>
                <div class="summary-row-item">
                    <span class="summary-row-label">Total Cost Paid</span>
                    <span class="summary-row-value color-green">
                        ৳{{ number_format($profit_balance?->total_cost_paid ?? 0, 2) }}
                    </span>
                </div>
                <div class="summary-row-item">
                    <span class="summary-row-label">Pending Cost Balance</span>
                    <span class="summary-row-value color-orange">
                        ৳{{ number_format($profit_balance?->pending_cost_balance ?? 0, 2) }}
                    </span>
                </div>
                <div class="summary-row-item">
                    <span class="summary-row-label">Profit Share Earned</span>
                    <span class="summary-row-value">
                        ৳{{ number_format($profit_balance?->total_profit_earned ?? 0, 2) }}
                    </span>
                </div>
                <div class="summary-row-item">
                    <span class="summary-row-label">Profit Share Paid</span>
                    <span class="summary-row-value color-green">
                        ৳{{ number_format($profit_balance?->total_profit_paid ?? 0, 2) }}
                    </span>
                </div>
            </div>
        @endif

    </div>

    {{-- ════════════════════════════════════════
 SECTION 3 — DISTRIBUTION HISTORY
 ════════════════════════════════════════ --}}
    <div class="section">
        <div class="section-title">Distribution History</div>

        @if ($distribution_history->isEmpty())
            <div class="empty-state">No distribution records found for this partner.</div>
        @else
            <table>
                <thead>
                    <tr>
                        <th>Distribution No</th>
                        <th>Period</th>
                        <th class="text-center">Dist. Status</th>
                        <th class="text-right">Share %</th>
                        <th class="text-right">Profit Share</th>
                        <th class="text-right">Cost Return</th>
                        <th class="text-right">Total</th>
                        <th class="text-center">Payment</th>
                    </tr>
                </thead>
                <tbody>
                    @php
                        $totalProfitShare = 0;
                        $totalCostReturn = 0;
                        $totalAmount = 0;
                    @endphp

                    @foreach ($distribution_history as $item)
                        @php
                            $dist = $item->profitDistribution;
                            $costReturn = (float) ($item->cost_return_amount ?? 0);
                            $profitShare = (float) $item->share_amount - $costReturn;

                            $totalProfitShare += $profitShare;
                            $totalCostReturn += $costReturn;
                            $totalAmount += (float) $item->share_amount;

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
                                <div style="font-weight: 600;">
                                    {{ $dist?->distribution_no ?? '—' }}
                                </div>
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
                            <td class="text-right">
                                {{ number_format($item->share_percent, 2) }}%
                            </td>
                            <td class="text-right color-indigo" style="font-weight: 600;">
                                ৳{{ number_format($profitShare, 2) }}
                            </td>
                            <td class="text-right">
                                @if ($costReturn > 0)
                                    <span class="color-orange">৳{{ number_format($costReturn, 2) }}</span>
                                @else
                                    <span class="muted">—</span>
                                @endif
                            </td>
                            <td class="text-right" style="font-weight: 700;">
                                ৳{{ number_format($item->share_amount, 2) }}
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
                        <td class="text-right color-indigo">
                            ৳{{ number_format($totalProfitShare, 2) }}
                        </td>
                        <td class="text-right color-orange">
                            {{ $totalCostReturn > 0 ? '৳' . number_format($totalCostReturn, 2) : '—' }}
                        </td>
                        <td class="text-right">
                            ৳{{ number_format($totalAmount, 2) }}
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        @endif
    </div>

    {{-- ════════════════════════════════════════
    PDF FOOTER
    ════════════════════════════════════════ --}}
    <div class="pdf-footer">
        <span>Generated: {{ $generated_at }} · Master Business Suite · Confidential</span>
        <span>Page <span class="pagenum"></span></span>
    </div>

</body>

</html>
