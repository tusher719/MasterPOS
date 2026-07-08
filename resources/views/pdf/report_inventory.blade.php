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
        .kpi-box.green  { border-left-color: #16a34a; }
        .kpi-box.red    { border-left-color: #dc2626; }
        .kpi-box.amber  { border-left-color: #d97706; }
        .kpi-box.blue   { border-left-color: #2563eb; }
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
        .badge { display: inline-block; padding: 1px 6px; border-radius: 999px; font-size: 8px; font-weight: 600; }
        .badge-green { background: #dcfce7; color: #15803d; }
        .badge-gray  { background: #f3f4f6; color: #4b5563; }
        .badge-red   { background: #fee2e2; color: #b91c1c; }
        .badge-amber { background: #fef3c7; color: #b45309; }
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
            <div class="report-title">Inventory Report</div>
        </div>
        <div class="header-right">
            <div>Generated: {{ now()->format('d M Y, h:i A') }}</div>
        </div>
    </div>

    @php
        $totalStockQty   = $rows->sum('stock_qty');
        $totalStockValue = $rows->sum('stock_value');
        $lowStockCount   = $rows->filter(fn($r) => $r->stock_qty > 0 && $r->stock_qty <= ($r->low_stock_threshold ?? 0))->count();
        $outOfStockCount = $rows->filter(fn($r) => $r->stock_qty <= 0)->count();
    @endphp

    <div class="kpi-row">
        <div class="kpi-box">
            <div class="kpi-label">Total Products</div>
            <div class="kpi-value">{{ $rows->count() }}</div>
        </div>
        <div class="kpi-box blue">
            <div class="kpi-label">Total Stock Qty</div>
            <div class="kpi-value">{{ number_format($totalStockQty, 2) }}</div>
        </div>
        <div class="kpi-box green">
            <div class="kpi-label">Stock Value</div>
            <div class="kpi-value">{{ number_format($totalStockValue, 2) }}</div>
        </div>
        <div class="kpi-box amber">
            <div class="kpi-label">Low Stock</div>
            <div class="kpi-value">{{ $lowStockCount }}</div>
        </div>
        <div class="kpi-box red">
            <div class="kpi-label">Out of Stock</div>
            <div class="kpi-value">{{ $outOfStockCount }}</div>
        </div>
    </div>

    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th class="right">Stock Qty</th>
                    <th class="right">Cost Price</th>
                    <th class="right">Sale Price</th>
                    <th class="right">Stock Value</th>
                    <th class="center">Active</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($rows as $i => $row)
                    <tr>
                        <td class="muted">{{ $i + 1 }}</td>
                        <td><strong>{{ $row->name }}</strong></td>
                        <td>{{ $row->sku }}</td>
                        <td>{{ $row->category_name ?? '—' }}</td>
                        <td>{{ $row->unit_name ?? '—' }}</td>
                        <td class="right">{{ number_format($row->stock_qty, 2) }}</td>
                        <td class="right">{{ number_format($row->cost_price, 2) }}</td>
                        <td class="right">{{ number_format($row->sale_price, 2) }}</td>
                        <td class="right"><strong>{{ number_format($row->stock_value, 2) }}</strong></td>
                        <td class="center">
                            @if ($row->is_active)
                                <span class="badge badge-green">Active</span>
                            @else
                                <span class="badge badge-gray">Inactive</span>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="10" style="text-align:center;padding:20px;color:#9ca3af;">
                            No products found.
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
                        <td class="right">{{ number_format($totalStockQty, 2) }}</td>
                        <td></td>
                        <td></td>
                        <td class="right">{{ number_format($totalStockValue, 2) }}</td>
                        <td></td>
                    </tr>
                </tfoot>
            @endif
        </table>
    </div>

    <div class="footer">
        <span>{{ config('app.name', 'Master POS') }} — Inventory Report</span>
        <span>Generated by {{ auth()->user()->name ?? 'System' }}</span>
    </div>
</body>
</html>