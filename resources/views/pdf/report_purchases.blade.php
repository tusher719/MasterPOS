<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #1f2937; }
        .header { display: flex; justify-content: space-between; align-items: flex-start;
                  padding: 16px 20px; border-bottom: 2px solid #4f46e5; margin-bottom: 14px; }
        .header-left .company { font-size: 16px; font-weight: 700; color: #4f46e5; }
        .header-left .report-title { font-size: 12px; font-weight: 600; color: #374151; margin-top: 2px; }
        .header-right { text-align: right; color: #6b7280; font-size: 9px; line-height: 1.6; }
        .kpi-row { display: flex; gap: 8px; padding: 0 20px; margin-bottom: 14px; }
        .kpi-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px;
                   border-left: 3px solid #4f46e5; }
        .kpi-box.green { border-left-color: #16a34a; }
        .kpi-box.red   { border-left-color: #dc2626; }
        .kpi-box.amber { border-left-color: #d97706; }
        .kpi-box.blue  { border-left-color: #2563eb; }
        .kpi-box.gray  { border-left-color: #9ca3af; }
        .kpi-label { font-size: 8px; color: #6b7280; margin-bottom: 2px; }
        .kpi-value { font-size: 11px; font-weight: 700; color: #111827; }
        .table-wrap { padding: 0 20px; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f3f4f6; }
        th { padding: 6px 8px; text-align: left; font-size: 8px; font-weight: 700;
             color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em;
             border-bottom: 1px solid #e5e7eb; }
        th.right, td.right { text-align: right; }
        th.center, td.center { text-align: center; }
        tbody tr { border-bottom: 1px solid #f3f4f6; }
        tbody tr:nth-child(even) { background: #f9fafb; }
        td { padding: 5px 8px; font-size: 9px; color: #374151; }
        td.muted { color: #9ca3af; }
        .badge { display: inline-block; padding: 1px 6px; border-radius: 999px;
                 font-size: 8px; font-weight: 600; }
        .badge-green  { background: #dcfce7; color: #15803d; }
        .badge-amber  { background: #fef3c7; color: #b45309; }
        .badge-red    { background: #fee2e2; color: #b91c1c; }
        .badge-blue   { background: #dbeafe; color: #1d4ed8; }
        .badge-gray   { background: #f3f4f6; color: #4b5563; }
        tfoot tr { border-top: 2px solid #e5e7eb; background: #f3f4f6; }
        tfoot td { padding: 6px 8px; font-size: 9px; font-weight: 700; color: #111827; }
        .footer { margin-top: 16px; padding: 10px 20px 0; border-top: 1px solid #e5e7eb;
                  display: flex; justify-content: space-between; color: #9ca3af; font-size: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="company">{{ config('app.name', 'Master POS') }}</div>
            <div class="report-title">Purchase Report</div>
        </div>
        <div class="header-right">
            <div>Period: {{ $from }} — {{ $to }}</div>
            <div>Generated: {{ now()->format('d M Y, h:i A') }}</div>
        </div>
    </div>

    <div class="kpi-row">
        <div class="kpi-box">
            <div class="kpi-label">Total Orders</div>
            <div class="kpi-value">{{ $rows->count() }}</div>
        </div>
        <div class="kpi-box blue">
            <div class="kpi-label">Total Cost</div>
            <div class="kpi-value">{{ number_format($rows->sum('grand_total'), 2) }}</div>
        </div>
        <div class="kpi-box gray">
            <div class="kpi-label">Shipping</div>
            <div class="kpi-value">{{ number_format($rows->sum('shipping_cost') ?? 0, 2) }}</div>
        </div>
        <div class="kpi-box green">
            <div class="kpi-label">Paid</div>
            <div class="kpi-value">{{ number_format($rows->sum('paid_amount'), 2) }}</div>
        </div>
        <div class="kpi-box red">
            <div class="kpi-label">Due</div>
            <div class="kpi-value">{{ number_format($rows->sum('due_amount'), 2) }}</div>
        </div>
    </div>

    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th class="center">Order Status</th>
                    <th class="right">Grand Total</th>
                    <th class="right">Paid</th>
                    <th class="right">Due</th>
                    <th class="center">Payment</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($rows as $i => $row)
                    <tr>
                        <td class="muted">{{ $i + 1 }}</td>
                        <td><strong>{{ $row->reference_no }}</strong></td>
                        <td>{{ $row->purchase_date }}</td>
                        <td>{{ $row->supplier_name ?? '—' }}</td>
                        <td class="center">
                            @php
                                $orderMap = [
                                    'draft'            => ['label' => 'Draft',    'cls' => 'badge-gray'],
                                    'ordered'          => ['label' => 'Ordered',  'cls' => 'badge-blue'],
                                    'received'         => ['label' => 'Received', 'cls' => 'badge-green'],
                                    'partial_received' => ['label' => 'Partial',  'cls' => 'badge-amber'],
                                    'cancelled'        => ['label' => 'Cancelled','cls' => 'badge-red'],
                                ];
                                $os = $orderMap[$row->purchase_status] ?? ['label' => $row->purchase_status, 'cls' => 'badge-gray'];
                            @endphp
                            <span class="badge {{ $os['cls'] }}">{{ $os['label'] }}</span>
                        </td>
                        <td class="right"><strong>{{ number_format($row->grand_total, 2) }}</strong></td>
                        <td class="right">{{ number_format($row->paid_amount, 2) }}</td>
                        <td class="right">{{ number_format($row->due_amount, 2) }}</td>
                        <td class="center">
                            @if ($row->payment_status === 'paid')
                                <span class="badge badge-green">Paid</span>
                            @elseif ($row->payment_status === 'partial')
                                <span class="badge badge-amber">Partial</span>
                            @else
                                <span class="badge badge-red">Due</span>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="9" style="text-align:center; padding:20px; color:#9ca3af;">
                            No purchases found for the selected period.
                        </td>
                    </tr>
                @endforelse
            </tbody>
            @if ($rows->count() > 0)
                <tfoot>
                    <tr>
                        <td colspan="5" class="right"
                            style="color:#6b7280;font-size:8px;text-transform:uppercase;letter-spacing:0.04em;">
                            Totals
                        </td>
                        <td class="right">{{ number_format($rows->sum('grand_total'), 2) }}</td>
                        <td class="right">{{ number_format($rows->sum('paid_amount'), 2) }}</td>
                        <td class="right">{{ number_format($rows->sum('due_amount'), 2) }}</td>
                        <td></td>
                    </tr>
                </tfoot>
            @endif
        </table>
    </div>

    <div class="footer">
        <span>{{ config('app.name', 'Master POS') }} — Purchase Report ({{ $from }} to {{ $to }})</span>
        <span>Generated by {{ auth()->user()->name ?? 'System' }}</span>
    </div>
</body>
</html>