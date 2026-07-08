<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1f2937; }
        h1 { font-size: 16px; margin-bottom: 2px; }
        .meta { color: #6b7280; font-size: 10px; margin-bottom: 14px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 5px 6px; text-align: left; }
        th { background-color: #f9fafb; font-weight: bold; }
        .text-right { text-align: right; }
        .status-active { color: #15803d; }
        .status-withdrawn { color: #b45309; }
        tfoot td { font-weight: bold; background-color: #f9fafb; }
    </style>
</head>
<body>
    <h1>Investment Report</h1>
    <p class="meta">Generated at: {{ $generated_at }}</p>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Title</th>
                <th>Investor</th>
                <th>Type</th>
                <th class="text-right">Amount</th>
                <th>Date</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Created By</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($investments as $i => $investment)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $investment->title }}</td>
                    <td>{{ $investment->investor_name }}</td>
                    <td>{{ $investment->investmentType?->name ?? '—' }}</td>
                    <td class="text-right">{{ number_format((float) $investment->amount, 2) }}</td>
                    <td>{{ $investment->investment_date?->format('Y-m-d') ?? '—' }}</td>
                    <td>{{ $investment->reference ?? '—' }}</td>
                    <td class="status-{{ $investment->status }}">{{ ucfirst($investment->status) }}</td>
                    <td>{{ $investment->creator?->name ?? '—' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="9" style="text-align:center; color:#9ca3af;">No investments found.</td>
                </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4">Total</td>
                <td class="text-right">{{ number_format((float) $total_amount, 2) }}</td>
                <td colspan="4"></td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
