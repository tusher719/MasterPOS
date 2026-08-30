<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Delivery Slip — {{ $sale->reference_no }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #1f2937;
            background: #fff;
            padding: 20px;
        }

        /* ── Header ── */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 12px;
            margin-bottom: 14px;
        }

        .business-name {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
        }

        .business-meta {
            font-size: 9px;
            color: #6b7280;
            margin-top: 3px;
            line-height: 1.5;
        }

        .slip-title {
            text-align: right;
        }

        .slip-title .label {
            font-size: 13px;
            font-weight: bold;
            color: #4f46e5;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .slip-title .ref {
            font-size: 11px;
            color: #374151;
            margin-top: 4px;
            font-weight: bold;
        }

        .slip-title .date {
            font-size: 9px;
            color: #6b7280;
            margin-top: 2px;
        }

        /* ── Section blocks ── */
        .section {
            margin-bottom: 12px;
        }

        .section-title {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            margin-bottom: 6px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 3px;
        }

        /* ── Recipient box ── */
        .recipient-box {
            border: 1.5px solid #4f46e5;
            border-radius: 4px;
            padding: 10px 12px;
            background: #f5f3ff;
        }

        .recipient-name {
            font-size: 14px;
            font-weight: bold;
            color: #1f2937;
        }

        .recipient-phone {
            font-size: 12px;
            font-weight: bold;
            color: #4f46e5;
            margin-top: 3px;
        }

        .recipient-address {
            font-size: 10px;
            color: #374151;
            margin-top: 4px;
            line-height: 1.5;
        }

        /* ── Two-column layout ── */
        .two-col {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
        }

        .col {
            flex: 1;
        }

        /* ── Info rows ── */
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            border-bottom: 1px dotted #e5e7eb;
            font-size: 10px;
        }

        .info-row:last-child {
            border-bottom: none;
        }

        .info-label {
            color: #6b7280;
        }

        .info-value {
            font-weight: bold;
            color: #1f2937;
            text-align: right;
        }

        /* ── Items table ── */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }

        .items-table th {
            background: #f3f4f6;
            text-align: left;
            padding: 5px 8px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #6b7280;
            border-bottom: 1px solid #e5e7eb;
        }

        .items-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #f3f4f6;
            color: #374151;
            vertical-align: top;
        }

        .items-table tr:last-child td {
            border-bottom: none;
        }

        .items-table .qty-col {
            text-align: center;
            font-weight: bold;
            color: #1f2937;
            width: 50px;
        }

        /* ── Courier badge ── */
        .courier-badge {
            display: inline-block;
            background: #e0e7ff;
            color: #3730a3;
            border-radius: 3px;
            padding: 1px 6px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }

        /* ── COD badge ── */
        .cod-badge {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 4px;
            padding: 6px 10px;
            margin-bottom: 12px;
            font-size: 10px;
            font-weight: bold;
            color: #92400e;
            text-align: center;
        }

        /* ── Footer ── */
        .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
            margin-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .footer-note {
            font-size: 8px;
            color: #9ca3af;
        }

        .signature-box {
            text-align: center;
            font-size: 8px;
            color: #6b7280;
        }

        .signature-line {
            width: 100px;
            border-top: 1px solid #9ca3af;
            margin: 20px auto 3px;
        }
    </style>
</head>

<body>

    {{-- ── Header ── --}}
    <div class="header">
        <div>
            @if (!empty($business['logo_path']))
                <img src="{{ $business['logo_path'] }}" alt="Logo"
                    style="height:36px; margin-bottom:4px; display:block;">
            @endif
            <div class="business-name">{{ $business['business_name'] }}</div>
            <div class="business-meta">
                @if (!empty($business['phone']))
                    {{ $business['phone'] }}
                @endif
                @if (!empty($business['email']))
                    &nbsp;|&nbsp; {{ $business['email'] }}
                @endif
                @if (!empty($business['address']))
                    <br>{{ $business['address'] }}
                @endif
            </div>
        </div>
        <div class="slip-title">
            <div class="label">Delivery Slip</div>
            <div class="ref">{{ $sale->reference_no }}</div>
            <div class="date">{{ \Carbon\Carbon::parse($sale->sale_date)->format('d M Y') }}</div>
        </div>
    </div>

    {{-- ── COD Notice (if applicable) ── --}}
    @if ($sale->payment_type === 'cash_on_delivery')
        <div class="cod-badge">
            ⚡ CASH ON DELIVERY — Collect payment upon delivery
        </div>
    @endif

    {{-- ── Recipient ── --}}
    <div class="section">
        <div class="section-title">Deliver To</div>
        <div class="recipient-box">
            <div class="recipient-name">
                {{ $sale->customer?->name ?? 'Walk-in Customer' }}
            </div>
            @php
                $phone = $sale->delivery_contact_phone ?? $sale->customer?->phone;
            @endphp
            @if ($phone)
                <div class="recipient-phone">📞 {{ $phone }}</div>
            @endif
            @if ($sale->delivery_address)
                <div class="recipient-address">📍 {{ $sale->delivery_address }}</div>
            @elseif($sale->customer?->address)
                <div class="recipient-address">📍 {{ $sale->customer->address }}
                    @if ($sale->customer->city)
                        , {{ $sale->customer->city }}
                    @endif
                </div>
            @endif
        </div>
    </div>

    {{-- ── Delivery + Courier Info ── --}}
    <div class="two-col">
        {{-- Delivery Info --}}
        <div class="col">
            <div class="section-title">Delivery Info</div>
            @php
                $deliveryLabels = [
                    'store_pickup' => 'Store Pickup',
                    'inside_dhaka' => 'Inside Dhaka',
                    'outside_dhaka' => 'Outside Dhaka',
                    'parallel' => 'Parallel',
                ];
            @endphp
            @if ($sale->delivery_type)
                <div class="info-row">
                    <span class="info-label">Type</span>
                    <span class="info-value">
                        {{ $deliveryLabels[$sale->delivery_type] ?? $sale->delivery_type }}
                    </span>
                </div>
            @endif
            @if ($sale->delivery_charge > 0 && !$sale->delivery_charge_free)
                <div class="info-row">
                    <span class="info-label">Delivery Charge</span>
                    <span class="info-value">৳{{ number_format($sale->delivery_charge, 2) }}</span>
                </div>
            @elseif($sale->delivery_charge_free)
                <div class="info-row">
                    <span class="info-label">Delivery Charge</span>
                    <span class="info-value" style="color:#16a34a;">Free</span>
                </div>
            @endif
            <div class="info-row">
                <span class="info-label">Items</span>
                <span class="info-value">{{ $sale->items->count() }} item(s)</span>
            </div>
        </div>

        {{-- Courier Info --}}
        <div class="col">
            <div class="section-title">Courier Info</div>
            @if ($sale->courier_provider)
                <div class="info-row">
                    <span class="info-label">Courier</span>
                    <span class="info-value">
                        <span class="courier-badge">{{ $sale->courier_provider }}</span>
                    </span>
                </div>
            @endif
            @if ($sale->courier_tracking_id)
                <div class="info-row">
                    <span class="info-label">Tracking ID</span>
                    <span class="info-value">{{ $sale->courier_tracking_id }}</span>
                </div>
            @endif
            @if ($sale->courier_note)
                <div class="info-row">
                    <span class="info-label">Note</span>
                    <span class="info-value">{{ $sale->courier_note }}</span>
                </div>
            @endif
            @if (!$sale->courier_provider && !$sale->courier_tracking_id)
                <div style="font-size:9px; color:#9ca3af; padding-top:4px;">
                    No courier assigned yet.
                </div>
            @endif
        </div>
    </div>

    {{-- ── Items ── --}}
    <div class="section">
        <div class="section-title">Items</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th style="text-align:center;">Qty</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($sale->items as $i => $item)
                    <tr>
                        <td style="color:#9ca3af; width:24px;">{{ $i + 1 }}</td>
                        <td>
                            {{ $item->product?->name ?? 'Unknown Product' }}
                            @if ($item->variant && !empty($item->variant->attributes))
                                <br>
                                <span style="font-size:9px; color:#6b7280;">
                                    {{ collect($item->variant->attributes)->map(fn($v, $k) => "{$k}: {$v}")->implode(', ') }}
                                </span>
                            @endif
                        </td>
                        <td class="qty-col">{{ $item->quantity }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    {{-- ── Footer ── --}}
    <div class="footer">
        <div class="footer-note">
            Printed: {{ now()->format('d M Y, h:i A') }}<br>
            {{ $sale->reference_no }}
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            Receiver's Signature
        </div>
    </div>

</body>

</html>
