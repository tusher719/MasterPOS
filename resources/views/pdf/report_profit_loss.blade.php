<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            color: #1f2937;
            background: #ffffff;
        }

        /* ── Header ── */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 16px 20px;
            border-bottom: 2px solid #4f46e5;
            margin-bottom: 14px;
        }
        .header-left .company {
            font-size: 16px;
            font-weight: 700;
            color: #4f46e5;
        }
        .header-left .report-title {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            margin-top: 2px;
        }
        .header-right {
            text-align: right;
            color: #6b7280;
            font-size: 9px;
            line-height: 1.6;
        }

        /* ── Two-column layout ── */
        .two-col {
            display: flex;
            gap: 16px;
            padding: 0 20px;
        }
        .col-main  { flex: 2; }
        .col-side  { flex: 1; }

        /* ── Section ── */
        .section {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            margin-bottom: 10px;
            overflow: hidden;
        }
        .section-head {
            background: #f3f4f6;
            padding: 6px 10px;
            font-size: 8px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e5e7eb;
        }
        .section-body { padding: 0 10px; }

        /* ── Statement rows ── */
        .stmt-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
            border-bottom: 1px solid #f9fafb;
            font-size: 9px;
        }
        .stmt-row:last-child { border-bottom: none; }
        .stmt-label         { color: #374151; }
        .stmt-label.muted   { color: #9ca3af; font-size: 8px; }
        .stmt-label.bold    { font-weight: 700; color: #111827; }
        .stmt-value         { font-weight: 600; color: #111827; }
        .stmt-value.neg     { color: #dc2626; }
        .stmt-value.muted   { color: #9ca3af; font-weight: 400; }

        /* ── Result boxes ── */
        .result-box {
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 10px;
        }
        .result-box.green { background: #f0fdf4; border: 2px solid #86efac; }
        .result-box.red   { background: #fef2f2; border: 2px solid #fca5a5; }
        .result-label {
            font-size: 9px;
            font-weight: 700;
            color: #374151;
            margin-bottom: 3px;
        }
        .result-value {
            font-size: 15px;
            font-weight: 700;
        }
        .result-value.green { color: #15803d; }
        .result-value.red   { color: #b91c1c; }
        .result-margin {
            font-size: 8px;
            margin-top: 2px;
        }
        .result-margin.green { color: #16a34a; }
        .result-margin.red   { color: #dc2626; }

        /* ── KPI row (top) ── */
        .kpi-row {
            display: flex;
            gap: 8px;
            padding: 0 20px;
            margin-bottom: 14px;
        }
        .kpi-box {
            flex: 1;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 8px 10px;
            border-left: 3px solid #4f46e5;
        }
        .kpi-box.green  { border-left-color: #16a34a; }
        .kpi-box.red    { border-left-color: #dc2626; }
        .kpi-box.blue   { border-left-color: #2563eb; }
        .kpi-label { font-size: 8px; color: #6b7280; margin-bottom: 2px; }
        .kpi-value { font-size: 11px; font-weight: 700; color: #111827; }

        /* ── Category table (sidebar) ── */
        .cat-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 9px;
        }
        .cat-row:last-child { border-bottom: none; }
        .cat-name  { color: #374151; }
        .cat-total { font-weight: 700; color: #dc2626; }

        /* ── Ratio boxes ── */
        .ratio-box {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 8px 10px;
            margin-bottom: 8px;
        }
        .ratio-label { font-size: 8px; color: #6b7280; }
        .ratio-value { font-size: 13px; font-weight: 700; margin: 2px 0; }
        .ratio-sub   { font-size: 8px; color: #9ca3af; }

        /* ── Note box ── */
        .note-box {
            border: 1px solid #bfdbfe;
            background: #eff6ff;
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 8px;
            color: #1d4ed8;
            margin-bottom: 10px;
        }

        /* ── Footer ── */
        .footer {
            margin-top: 16px;
            padding: 10px 20px 0;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            color: #9ca3af;
            font-size: 8px;
        }
    </style>
</head>
<body>

    {{-- Header --}}
    <div class="header">
        <div class="header-left">
            <div class="company">{{ config('app.name', 'Master POS') }}</div>
            <div class="report-title">Profit & Loss Statement</div>
        </div>
        <div class="header-right">
            <div>Period: {{ $from }} — {{ $to }}</div>
            <div>Generated: {{ now()->format('d M Y, h:i A') }}</div>
        </div>
    </div>

    {{-- KPI row --}}
    @php
        $isProfit   = $summary['net_profit'] >= 0;
        $grossProfit= $summary['gross_profit'];
        $netProfit  = $summary['net_profit'];
        $revenue    = $summary['revenue'];
        $expenses   = $summary['total_expenses'];
        $cogs       = $summary['cogs'];
    @endphp

    <div class="kpi-row">
        <div class="kpi-box">
            <div class="kpi-label">Revenue</div>
            <div class="kpi-value">{{ number_format($revenue, 2) }}</div>
        </div>
        <div class="kpi-box blue">
            <div class="kpi-label">COGS</div>
            <div class="kpi-value">{{ number_format($cogs, 2) }}</div>
        </div>
        <div class="kpi-box {{ $grossProfit >= 0 ? 'green' : 'red' }}">
            <div class="kpi-label">Gross Profit</div>
            <div class="kpi-value">{{ number_format($grossProfit, 2) }}</div>
        </div>
        <div class="kpi-box red">
            <div class="kpi-label">Expenses</div>
            <div class="kpi-value">{{ number_format($expenses, 2) }}</div>
        </div>
        <div class="kpi-box {{ $isProfit ? 'green' : 'red' }}">
            <div class="kpi-label">Net {{ $isProfit ? 'Profit' : 'Loss' }}</div>
            <div class="kpi-value">{{ number_format($netProfit, 2) }}</div>
        </div>
        <div class="kpi-box">
            <div class="kpi-label">Net Margin</div>
            <div class="kpi-value">{{ $summary['net_margin'] }}%</div>
        </div>
    </div>

    {{-- Two-column body --}}
    <div class="two-col">

        {{-- Left: P&L Statement --}}
        <div class="col-main">

            {{-- Revenue --}}
            <div class="section">
                <div class="section-head">Revenue</div>
                <div class="section-body">
                    <div class="stmt-row">
                        <span class="stmt-label bold">Gross Sales Revenue</span>
                        <span class="stmt-value">{{ number_format($revenue, 2) }}</span>
                    </div>
                    <div class="stmt-row">
                        <span class="stmt-label muted">Total Sales Orders</span>
                        <span class="stmt-value muted">{{ $summary['sales_count'] }}</span>
                    </div>
                    <div class="stmt-row">
                        <span class="stmt-label muted">Average Order Value</span>
                        <span class="stmt-value muted">{{ number_format($summary['aov'], 2) }}</span>
                    </div>
                </div>
            </div>

            {{-- COGS --}}
            <div class="section">
                <div class="section-head">Cost of Goods Sold (COGS)</div>
                <div class="section-body">
                    <div class="stmt-row">
                        <span class="stmt-label">Product Cost (qty × cost price)</span>
                        <span class="stmt-value neg">({{ number_format($cogs, 2) }})</span>
                    </div>
                </div>
            </div>

            {{-- Gross profit result box --}}
            <div class="result-box {{ $grossProfit >= 0 ? 'green' : 'red' }}">
                <div class="result-label">Gross Profit</div>
                <div class="result-value {{ $grossProfit >= 0 ? 'green' : 'red' }}">
                    {{ number_format($grossProfit, 2) }}
                </div>
                <div class="result-margin {{ $grossProfit >= 0 ? 'green' : 'red' }}">
                    Gross Margin: {{ $summary['gross_margin'] }}%
                </div>
            </div>

            {{-- Operating expenses --}}
            <div class="section">
                <div class="section-head">Operating Expenses</div>
                <div class="section-body">
                    @forelse ($expenseByCategory as $cat)
                        <div class="stmt-row">
                            <span class="stmt-label">{{ $cat->category ?? 'Uncategorised' }}</span>
                            <span class="stmt-value neg">({{ number_format($cat->total, 2) }})</span>
                        </div>
                    @empty
                        <div class="stmt-row">
                            <span class="stmt-label muted">No expenses in this period.</span>
                            <span></span>
                        </div>
                    @endforelse
                    <div class="stmt-row" style="border-top: 1px solid #e5e7eb; margin-top: 2px; padding-top: 5px;">
                        <span class="stmt-label bold">Total Operating Expenses</span>
                        <span class="stmt-value neg">({{ number_format($expenses, 2) }})</span>
                    </div>
                </div>
            </div>

            {{-- Net profit result box --}}
            <div class="result-box {{ $isProfit ? 'green' : 'red' }}">
                <div class="result-label">Net {{ $isProfit ? 'Profit' : 'Loss' }}</div>
                <div class="result-value {{ $isProfit ? 'green' : 'red' }}">
                    {{ number_format($netProfit, 2) }}
                </div>
                <div class="result-margin {{ $isProfit ? 'green' : 'red' }}">
                    Net Margin: {{ $summary['net_margin'] }}%
                </div>
            </div>

            {{-- Investment note --}}
            @if ($summary['total_investments'] > 0)
                <div class="note-box">
                    <strong>Note:</strong>
                    Total investments received in this period:
                    {{ number_format($summary['total_investments'], 2) }}.
                    Investment capital is excluded from P&L calculations.
                </div>
            @endif

        </div>

        {{-- Right: Expense breakdown + ratios --}}
        <div class="col-side">

            {{-- Expense breakdown --}}
            <div class="section" style="margin-bottom: 10px;">
                <div class="section-head">Expense Breakdown</div>
                @forelse ($expenseByCategory as $cat)
                    <div class="cat-row">
                        <span class="cat-name">{{ $cat->category ?? 'Uncategorised' }}</span>
                        <span class="cat-total">{{ number_format($cat->total, 2) }}</span>
                    </div>
                @empty
                    <div class="cat-row">
                        <span style="color:#9ca3af;">No expenses.</span>
                    </div>
                @endforelse
                @if (count($expenseByCategory) > 0)
                    <div class="cat-row" style="border-top: 2px solid #e5e7eb; font-weight:700;">
                        <span class="cat-name" style="color:#111827;">Total</span>
                        <span class="cat-total">{{ number_format($expenses, 2) }}</span>
                    </div>
                @endif
            </div>

            {{-- Ratio boxes --}}
            <div class="ratio-box">
                <div class="ratio-label">Expense Ratio</div>
                <div class="ratio-value" style="color: {{ $revenue > 0 && ($expenses / $revenue) < 0.5 ? '#16a34a' : '#d97706' }};">
                    {{ $revenue > 0 ? round(($expenses / $revenue) * 100) . '%' : '—' }}
                </div>
                <div class="ratio-sub">Expenses as % of revenue</div>
            </div>

            <div class="ratio-box">
                <div class="ratio-label">COGS Ratio</div>
                <div class="ratio-value" style="color: #2563eb;">
                    {{ $revenue > 0 ? round(($cogs / $revenue) * 100) . '%' : '—' }}
                </div>
                <div class="ratio-sub">COGS as % of revenue</div>
            </div>

            <div class="ratio-box">
                <div class="ratio-label">Sales Count</div>
                <div class="ratio-value" style="color: #4f46e5;">
                    {{ $summary['sales_count'] }}
                </div>
                <div class="ratio-sub">Orders in period</div>
            </div>

        </div>
    </div>

    {{-- Footer --}}
    <div class="footer">
        <span>{{ config('app.name', 'Master POS') }} — Profit & Loss Statement ({{ $from }} to {{ $to }})</span>
        <span>Generated by {{ auth()->user()->name ?? 'System' }}</span>
    </div>

</body>
</html>
