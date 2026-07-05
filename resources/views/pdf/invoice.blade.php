<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice {{ $sale->reference_no }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 13px;
            color: #1f2937;
            background: #ffffff;
            padding: 32px;
        }

        /* ── Header ── */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
            margin-bottom: 24px;
        }

        .business-logo {
            max-height: 48px;
            width: auto;
            margin-bottom: 8px;
        }

        .business-name {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
        }

        .business-meta {
            font-size: 11px;
            color: #6b7280;
            line-height: 1.6;
        }

        .invoice-title {
            font-size: 28px;
            font-weight: 700;
            color: #4f46e5;
            text-align: right;
            letter-spacing: -0.5px;
        }

        .invoice-ref {
            font-family: DejaVu Sans Mono, monospace;
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            text-align: right;
            margin-top: 4px;
        }

        .invoice-date {
            font-size: 11px;
            color: #6b7280;
            text-align: right;
            margin-top: 4px;
        }

        .invoice-date span {
            color: #374151;
            font-weight: 600;
        }

        /* ── Status Badge ── */
        .badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-top: 6px;
            float: right;
            clear: both;
        }

        .badge-paid    { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .badge-partial { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .badge-due     { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-voided  { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; margin-left: 4px; }

        /* ── Bill To / Payment Info ── */
        .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 28px;
        }

        .meta-block {
            width: 48%;
        }

        .meta-block.right {
            text-align: right;
        }

        .meta-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #9ca3af;
            margin-bottom: 6px;
        }

        .meta-name {
            font-size: 13px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 2px;
        }

        .meta-text {
            font-size: 11px;
            color: #6b7280;
            line-height: 1.6;
        }

        /* ── Items Table ── */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        thead tr {
            border-bottom: 2px solid #e5e7eb;
        }

        thead th {
            padding: 8px 6px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
        }

        thead th.left  { text-align: left; }
        thead th.right { text-align: right; }

        tbody tr {
            border-bottom: 1px solid #f3f4f6;
        }

        tbody td {
            padding: 9px 6px;
            font-size: 12px;
            color: #374151;
            vertical-align: middle;
        }

        tbody td.right  { text-align: right; }
        tbody td.center { text-align: center; }
        tbody td.mono   { font-family: DejaVu Sans Mono, monospace; font-size: 10px; color: #9ca3af; }
        tbody td.muted  { color: #9ca3af; }
        tbody td.bold   { font-weight: 600; color: #1f2937; }
        tbody td.index  { color: #9ca3af; width: 24px; }

        /* ── Totals ── */
        .totals-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-top: 8px;
        }

        .totals-table {
            width: 260px;
        }

        .totals-table td {
            padding: 5px 0;
            font-size: 12px;
            border: none;
        }

        .totals-table .label { color: #6b7280; }
        .totals-table .value { text-align: right; color: #374151; }

        .totals-table .grand-total td {
            border-top: 2px solid #e5e7eb;
            padding-top: 8px;
            font-size: 14px;
            font-weight: 700;
            color: #1f2937;
        }

        .totals-table .paid-row td   { color: #16a34a; }
        .totals-table .due-row td    { color: #dc2626; font-weight: 600; }
        .totals-table .discount-row .value { color: #dc2626; }

        /* ── Note ── */
        .note-box {
            margin-top: 24px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px 14px;
        }

        .note-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #9ca3af;
            margin-bottom: 4px;
        }

        .note-text {
            font-size: 12px;
            color: #4b5563;
        }

        /* ── Footer ── */
        .footer {
            margin-top: 40px;
            border-top: 1px solid #e5e7eb;
            padding-top: 16px;
            text-align: center;
        }

        .footer p {
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.6;
        }
    </style>
</head>
<body>

    {{-- ── Header ── --}}
    <div class="header">
        <div>
            @if ($business->logo)
                <img
                    src="{{ public_path('storage/' . $business->logo) }}"
                    alt="Logo"
                    class="business-logo"
                />
            @endif
            <div class="business-name">{{ $business->business_name }}</div>
            <div class="business-meta">
                @if ($business->address){{ $business->address }}<br>@endif
                @if ($business->city){{ $business->city }}@if ($business->country), {{ $business->country }}@endif<br>@endif
                @if ($business->phone)Tel: {{ $business->phone }}<br>@endif
                @if ($business->email){{ $business->email }}@endif
            </div>
        </div>

        <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-ref">#{{ $sale->reference_no }}</div>
            <div class="invoice-date">
                Date: <span>{{ \Carbon\Carbon::parse($sale->sale_date)->format('d M Y') }}</span>
            </div>
            <div>
                @php
                    $badgeClass = match($sale->payment_status) {
                        'paid'    => 'badge-paid',
                        'partial' => 'badge-partial',
                        default   => 'badge-due',
                    };
                @endphp
                <span class="badge {{ $badgeClass }}">
                    {{ strtoupper($sale->payment_status) }}
                </span>
                @if ($sale->deleted_at)
                    <span class="badge badge-voided">VOIDED</span>
                @endif
            </div>
        </div>
    </div>

    {{-- ── Bill To / Payment Info ── --}}
    <div class="meta-row">
        <div class="meta-block">
            <div class="meta-label">Bill To</div>
            @if ($sale->customer)
                <div class="meta-name">{{ $sale->customer->name }}</div>
                <div class="meta-text">
                    @if ($sale->customer->phone){{ $sale->customer->phone }}<br>@endif
                    @if ($sale->customer->email){{ $sale->customer->email }}<br>@endif
                    @if ($sale->customer->address){{ $sale->customer->address }}<br>@endif
                    @if ($sale->customer->city)
                        {{ $sale->customer->city }}
                        @if ($sale->customer->country), {{ $sale->customer->country }}@endif
                    @endif
                </div>
            @else
                <div class="meta-text" style="font-style: italic; color: #9ca3af;">Walk-in Customer</div>
            @endif
        </div>

        <div class="meta-block right">
            <div class="meta-label">Payment Method</div>
            <div class="meta-text">
                {{ $sale->paymentMethod ? $sale->paymentMethod->name : '—' }}
            </div>
        </div>
    </div>

    {{-- ── Items Table ── --}}
    <table>
        <thead>
            <tr>
                <th class="left"  style="width:24px">#</th>
                <th class="left">Item</th>
                <th class="left">SKU</th>
                <th class="right" style="width:50px">Qty</th>
                <th class="right" style="width:80px">Unit Price</th>
                <th class="right" style="width:70px">Discount</th>
                <th class="right" style="width:80px">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($sale->items as $index => $item)
                <tr>
                    <td class="index">{{ $index + 1 }}</td>
                    <td class="bold">{{ $item->product->name }}</td>
                    <td class="mono">{{ $item->product->sku ?? '—' }}</td>
                    <td class="right">{{ $item->quantity }}</td>
                    <td class="right">
                        {{ $business->currency_symbol ?? '৳' }}{{ number_format($item->unit_price, 2) }}
                    </td>
                    <td class="right muted">
                        @if ((float) $item->discount > 0)
                            {{ $business->currency_symbol ?? '৳' }}{{ number_format($item->discount, 2) }}
                        @else
                            —
                        @endif
                    </td>
                    <td class="right bold">
                        {{ $business->currency_symbol ?? '৳' }}{{ number_format($item->subtotal, 2) }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- ── Totals ── --}}
    <div class="totals-wrapper">
        <table class="totals-table">
            <tbody>
                <tr>
                    <td class="label">Subtotal</td>
                    <td class="value">
                        {{ $business->currency_symbol ?? '৳' }}{{ number_format($sale->subtotal, 2) }}
                    </td>
                </tr>

                @if ((float) $sale->discount > 0)
                    <tr class="discount-row">
                        <td class="label">Discount</td>
                        <td class="value">
                            − {{ $business->currency_symbol ?? '৳' }}{{ number_format($sale->discount, 2) }}
                        </td>
                    </tr>
                @endif

                @if ((float) $sale->tax > 0)
                    <tr>
                        <td class="label">Tax</td>
                        <td class="value">
                            {{ $business->currency_symbol ?? '৳' }}{{ number_format($sale->tax, 2) }}
                        </td>
                    </tr>
                @endif

                <tr class="grand-total">
                    <td class="label">Grand Total</td>
                    <td class="value">
                        {{ $business->currency_symbol ?? '৳' }}{{ number_format($sale->grand_total, 2) }}
                    </td>
                </tr>

                <tr class="paid-row">
                    <td class="label">Paid Amount</td>
                    <td class="value">
                        {{ $business->currency_symbol ?? '৳' }}{{ number_format($sale->paid_amount, 2) }}
                    </td>
                </tr>

                @if ((float) $sale->due_amount > 0)
                    <tr class="due-row">
                        <td class="label">Due Amount</td>
                        <td class="value">
                            {{ $business->currency_symbol ?? '৳' }}{{ number_format($sale->due_amount, 2) }}
                        </td>
                    </tr>
                @endif
            </tbody>
        </table>
    </div>

    {{-- ── Note ── --}}
    @if ($sale->note)
        <div class="note-box">
            <div class="note-label">Note</div>
            <div class="note-text">{{ $sale->note }}</div>
        </div>
    @endif

    {{-- ── Footer ── --}}
    <div class="footer">
        <p>Thank you for your business! — {{ $business->business_name }}</p>
        @if ($business->phone || $business->email)
            <p>
                Contact:
                @if ($business->phone){{ $business->phone }}@endif
                @if ($business->phone && $business->email) · @endif
                @if ($business->email){{ $business->email }}@endif
            </p>
        @endif
    </div>

</body>
</html>
