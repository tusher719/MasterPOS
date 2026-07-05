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
            position: relative;
        }

        .watermark {
            position: absolute;
            top: 30%;
            left: 20%;
            width: 60%;
            text-align: center;
            opacity: 0.06;
        }

        .watermark img {
            width: 100%;
            max-width: 380px;
        }

        .invoice-content {
            position: relative;
        }

        /* ── Header (table-based, dompdf flexbox is unreliable) ── */
        .header-table {
            width: 100%;
            border-bottom: 2px solid #e5e7eb;
            margin-bottom: 24px;
        }

        .header-table td {
            vertical-align: top;
            padding-bottom: 20px;
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

        .badge-wrap {
            text-align: right;
            margin-top: 6px;
        }

        .badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .badge-paid    { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .badge-partial { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .badge-due     { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-voided  { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; margin-left: 4px; }

        /* ── Bill To / Payment Info (table-based) ── */
        .meta-row-table {
            width: 100%;
            margin-bottom: 28px;
        }

        .meta-row-table td {
            vertical-align: top;
            width: 50%;
        }

        .meta-row-table td.right {
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

        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        table.items-table thead tr {
            border-bottom: 2px solid #e5e7eb;
        }

        table.items-table thead th {
            padding: 8px 6px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
        }

        table.items-table thead th.left  { text-align: left; }
        table.items-table thead th.right { text-align: right; }

        table.items-table tbody tr {
            border-bottom: 1px solid #f3f4f6;
        }

        table.items-table tbody td {
            padding: 9px 6px;
            font-size: 12px;
            color: #374151;
            vertical-align: middle;
        }

        table.items-table tbody td.right  { text-align: right; }
        table.items-table tbody td.mono   { font-family: DejaVu Sans Mono, monospace; font-size: 10px; color: #9ca3af; }
        table.items-table tbody td.muted  { color: #9ca3af; }
        table.items-table tbody td.bold   { font-weight: 600; color: #1f2937; }
        table.items-table tbody td.index  { color: #9ca3af; width: 24px; }

        /* ── Totals (table-based instead of flex) ── */
        .totals-outer {
            width: 100%;
        }

        .totals-outer td.spacer {
            width: 50%;
        }

        .totals-outer td.totals-cell {
            width: 260px;
            vertical-align: top;
        }

        .totals-table {
            width: 100%;
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

    @php
        $symbol   = $business['currency_symbol'] ?? '৳';
        // DejaVu Sans (dompdf's font) has no Bengali glyphs — fall back to
        // an ASCII-safe label so the PDF doesn't show tofu/box characters.
        if ($symbol === '৳') {
            $symbol = 'Tk ';
        }
        $decimals = (int) ($business['decimal_places'] ?? 2);
        $position = $business['currency_position'] ?? 'before';
        $fmt = function ($amount) use ($symbol, $decimals, $position) {
            $formatted = number_format((float) $amount, $decimals);
            return $position === 'before' ? $symbol . $formatted : $formatted . $symbol;
        };
    @endphp

    {{-- ── Watermark Logo (center, transparent) ── --}}
    @if (!empty($business['logo']))
        <div class="watermark">
            <img src="{{ public_path('storage/' . $business['logo']) }}" alt="">
        </div>
    @endif

    <div class="invoice-content">

        {{-- ── Header (table layout) ── --}}
        <table class="header-table">
            <tr>
                <td style="width:55%;">
                    @if (!empty($business['logo']))
                        <img
                            src="{{ public_path('storage/' . $business['logo']) }}"
                            alt="Logo"
                            class="business-logo"
                        />
                    @endif
                    <div class="business-name">{{ $business['business_name'] }}</div>
                    <div class="business-meta">
                        @if (!empty($business['address']))
                            {!! nl2br(e($business['address'])) !!}<br>
                        @endif
                        @if (!empty($business['phone']))
                            Tel: {{ $business['phone'] }}<br>
                        @endif
                        @if (!empty($business['email']))
                            {{ $business['email'] }}
                        @endif
                    </div>
                </td>
                <td style="width:45%; text-align:right;">
                    <div class="invoice-title">INVOICE</div>
                    <div class="invoice-ref">#{{ $sale->reference_no }}</div>
                    <div class="invoice-date">
                        Date: <span>{{ \Carbon\Carbon::parse($sale->sale_date)->format('d M Y') }}</span>
                    </div>
                    @php
                        $badgeClass = match($sale->payment_status) {
                            'paid'    => 'badge-paid',
                            'partial' => 'badge-partial',
                            default   => 'badge-due',
                        };
                    @endphp
                    <div class="badge-wrap">
                        <span class="badge {{ $badgeClass }}">
                            {{ strtoupper($sale->payment_status) }}
                        </span>
                        @if ($sale->deleted_at)
                            <span class="badge badge-voided">VOIDED</span>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        {{-- ── Bill To / Payment Info (table layout) ── --}}
        <table class="meta-row-table">
            <tr>
                <td>
                    <div class="meta-label">Bill To</div>
                    @if ($sale->customer)
                        <div class="meta-name">{{ $sale->customer->name }}</div>
                        <div class="meta-text">
                            @if ($sale->customer->phone)
                                {{ $sale->customer->phone }}<br>
                            @endif
                            @if ($sale->customer->email)
                                {{ $sale->customer->email }}<br>
                            @endif
                            @if ($sale->customer->address)
                                {{ $sale->customer->address }}<br>
                            @endif
                            @if ($sale->customer->city)
                                {{ $sale->customer->city }}@if ($sale->customer->country), {{ $sale->customer->country }}@endif
                            @endif
                        </div>
                    @else
                        <div class="meta-text" style="font-style: italic; color: #9ca3af;">Walk-in Customer</div>
                    @endif
                </td>
                <td class="right">
                    <div class="meta-label">Payment Method</div>
                    <div class="meta-text">
                        {{ $sale->paymentMethod ? $sale->paymentMethod->name : '—' }}
                    </div>
                </td>
            </tr>
        </table>

        {{-- ── Items Table ── --}}
        <table class="items-table">
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
                        <td class="right">{{ $fmt($item->unit_price) }}</td>
                        <td class="right muted">
                            @if ((float) $item->discount > 0)
                                {{ $fmt($item->discount) }}
                            @else
                                —
                            @endif
                        </td>
                        <td class="right bold">{{ $fmt($item->subtotal) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        {{-- ── Totals (table layout, aligned right) ── --}}
        <table class="totals-outer">
            <tr>
                <td class="spacer"></td>
                <td class="totals-cell">
                    <table class="totals-table">
                        <tr>
                            <td class="label">Subtotal</td>
                            <td class="value">{{ $fmt($sale->subtotal) }}</td>
                        </tr>

                        @if ((float) $sale->discount > 0)
                            <tr class="discount-row">
                                <td class="label">Discount</td>
                                <td class="value">− {{ $fmt($sale->discount) }}</td>
                            </tr>
                        @endif

                        @if ((float) $sale->tax > 0)
                            <tr>
                                <td class="label">Tax</td>
                                <td class="value">{{ $fmt($sale->tax) }}</td>
                            </tr>
                        @endif

                        <tr class="grand-total">
                            <td class="label">Grand Total</td>
                            <td class="value">{{ $fmt($sale->grand_total) }}</td>
                        </tr>

                        <tr class="paid-row">
                            <td class="label">Paid Amount</td>
                            <td class="value">{{ $fmt($sale->paid_amount) }}</td>
                        </tr>

                        @if ((float) $sale->due_amount > 0)
                            <tr class="due-row">
                                <td class="label">Due Amount</td>
                                <td class="value">{{ $fmt($sale->due_amount) }}</td>
                            </tr>
                        @endif
                    </table>
                </td>
            </tr>
        </table>

        {{-- ── Note ── --}}
        @if ($sale->note)
            <div class="note-box">
                <div class="note-label">Note</div>
                <div class="note-text">{{ $sale->note }}</div>
            </div>
        @endif

        {{-- ── Footer ── --}}
        <div class="footer">
            <p>Thank you for your business! — {{ $business['business_name'] }}</p>
            @if (!empty($business['phone']) || !empty($business['email']))
                <p>
                    Contact:
                    @if (!empty($business['phone']))
                        {{ $business['phone'] }}
                    @endif
                    @if (!empty($business['phone']) && !empty($business['email']))
                        ·
                    @endif
                    @if (!empty($business['email']))
                        {{ $business['email'] }}
                    @endif
                </p>
            @endif
        </div>

    </div>

</body>
</html>
