<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            color: #1f2937;
        }

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

        .kpi-box.red {
            border-left-color: #dc2626;
        }

        .kpi-label {
            font-size: 8px;
            color: #6b7280;
            margin-bottom: 2px;
        }

        .kpi-value {
            font-size: 11px;
            font-weight: 700;
            color: #111827;
        }

        .two-col {
            display: flex;
            gap: 16px;
            padding: 0 20px;
        }

        .col-main {
            flex: 3;
        }

        .col-side {
            flex: 1;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead tr {
            background: #f3f4f6;
        }

        th {
            padding: 6px 8px;
            text-align: left;
            font-size: 8px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 1px solid #e5e7eb;
        }

        th.right,
        td.right {
            text-align: right;
        }

        tbody tr {
            border-bottom: 1px solid #f3f4f6;
        }

        tbody tr:nth-child(even) {
            background: #f9fafb;
        }

        td {
            padding: 5px 8px;
            font-size: 9px;
            color: #374151;
        }

        td.muted {
            color: #9ca3af;
        }

        tfoot tr {
            border-top: 2px solid #e5e7eb;
            background: #f3f4f6;
        }

        tfoot td {
            padding: 6px 8px;
            font-size: 9px;
            font-weight: 700;
            color: #111827;
        }

        .section {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
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

        .cat-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 9px;
        }

        .cat-row:last-child {
            border-bottom: none;
        }

        .cat-name {
            color: #374151;
        }

        .cat-total {
            font-weight: 700;
            color: #dc2626;
        }

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
    <div class="header">
        <div class="header-left">
            @if (!empty($logo_path))
                <img src="{{ $logo_path }}" alt="Logo" style="height:32px; margin-bottom:4px; display:block;">
            @endif
            <div class="company">{{ config('app.name', 'Master POS') }}</div>
            <div class="report-title">Sales Report</div>
        </div>
        <div class="header-right">
            <div>Period: {{ $from }} — {{ $to }}</div>
            <div>Generated: {{ now()->format('d M Y, h:i A') }}</div>
        </div>
    </div>

    <div class="kpi-row">
        <div class="kpi-box">
            <div class="kpi-label">Total Entries</div>
            <div class="kpi-value">{{ $rows->count() }}</div>
        </div>
        <div class="kpi-box red">
            <div class="kpi-label">Total Amount</div>
            <div class="kpi-value">{{ number_format($rows->sum('amount'), 2) }}</div>
        </div>
    </div>

    <div class="two-col">
        {{-- Main table --}}
        <div class="col-main">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Payment Method</th>
                        <th>Reference</th>
                        <th class="right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($rows as $i => $row)
                        <tr>
                            <td class="muted">{{ $i + 1 }}</td>
                            <td><strong>{{ $row->title }}</strong></td>
                            <td>{{ $row->expense_date }}</td>
                            <td>{{ $row->category_name ?? '—' }}</td>
                            <td>{{ $row->payment_method ?? '—' }}</td>
                            <td>{{ $row->reference ?? '—' }}</td>
                            <td class="right"><strong>{{ number_format($row->amount, 2) }}</strong></td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" style="text-align:center;padding:20px;color:#9ca3af;">
                                No expenses found for the selected period.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
                @if ($rows->count() > 0)
                    <tfoot>
                        <tr>
                            <td colspan="6" class="right"
                                style="color:#6b7280;font-size:8px;text-transform:uppercase;letter-spacing:0.04em;">
                                Total
                            </td>
                            <td class="right">{{ number_format($rows->sum('amount'), 2) }}</td>
                        </tr>
                    </tfoot>
                @endif
            </table>
        </div>

        {{-- Category breakdown sidebar --}}
        <div class="col-side">
            <div class="section">
                <div class="section-head">By Category</div>
                @php
                    $byCategory = $rows->groupBy('category_name')->map(fn($g) => $g->sum('amount'))->sortDesc();
                @endphp
                @forelse ($byCategory as $categoryName => $total)
                    <div class="cat-row">
                        <span class="cat-name">{{ $categoryName ?? 'Uncategorised' }}</span>
                        <span class="cat-total">{{ number_format($total, 2) }}</span>
                    </div>
                @empty
                    <div class="cat-row">
                        <span style="color:#9ca3af;">No data.</span>
                    </div>
                @endforelse
            </div>
        </div>
    </div>

    <div class="footer">
        <span>{{ config('app.name', 'Master POS') }} — Expense Report ({{ $from }} to
            {{ $to }})</span>
        <span>Generated by {{ auth()->user()->name ?? 'System' }}</span>
    </div>
</body>

</html>
