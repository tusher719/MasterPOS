<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Confirmation</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #374151;
        }

        .wrapper {
            max-width: 600px;
            margin: 32px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }

        /* ── Header ── */
        .header {
            background-color: #4f46e5;
            padding: 28px 32px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 22px;
            color: #ffffff;
            font-weight: 700;
        }

        .header p {
            margin: 6px 0 0;
            font-size: 13px;
            color: #c7d2fe;
        }

        /* ── Body ── */
        .body {
            padding: 28px 32px;
        }

        .greeting {
            font-size: 15px;
            margin-bottom: 20px;
            color: #111827;
        }

        /* ── Info card ── */
        .info-card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 16px 20px;
            margin-bottom: 24px;
        }

        .info-card table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-card td {
            padding: 5px 0;
            font-size: 13px;
        }

        .info-card td:first-child {
            color: #6b7280;
            width: 48%;
        }

        .info-card td:last-child {
            color: #111827;
            font-weight: 600;
            text-align: right;
        }

        /* ── Section heading ── */
        .section-heading {
            font-size: 13px;
            font-weight: 700;
            color: #4f46e5;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 10px;
        }

        /* ── Items table ── */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }

        .items-table th {
            background-color: #f3f4f6;
            padding: 8px 10px;
            text-align: left;
            font-size: 12px;
            color: #6b7280;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
        }

        .items-table th:last-child {
            text-align: right;
        }

        .items-table td {
            padding: 10px 10px;
            font-size: 13px;
            border-bottom: 1px solid #f3f4f6;
            color: #374151;
        }

        .items-table td:last-child {
            text-align: right;
            font-weight: 600;
        }

        /* ── Totals ── */
        .totals {
            margin-bottom: 24px;
        }

        .totals table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals td {
            padding: 5px 0;
            font-size: 13px;
        }

        .totals td:first-child {
            color: #6b7280;
        }

        .totals td:last-child {
            text-align: right;
            font-weight: 600;
            color: #111827;
        }

        .totals .grand-total td {
            font-size: 15px;
            font-weight: 700;
            color: #4f46e5;
            border-top: 2px solid #e5e7eb;
            padding-top: 10px;
            margin-top: 6px;
        }

        .totals .discount td {
            color: #16a34a;
        }

        /* ── Payment badge ── */
        .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-cod {
            background-color: #e0e7ff;
            color: #4338ca;
        }

        .badge-paid {
            background-color: #dcfce7;
            color: #15803d;
        }

        .badge-partial {
            background-color: #fef3c7;
            color: #b45309;
        }

        .badge-due {
            background-color: #fee2e2;
            color: #b91c1c;
        }

        /* ── Footer ── */
        .footer {
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
            padding: 20px 32px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
        }

        .footer strong {
            color: #6b7280;
        }
    </style>
</head>

<body>
    <div class="wrapper">

        {{-- ── Header ── --}}
        <div class="header">
            <h1>{{ $business['business_name'] }}</h1>
            <p>Order Confirmation</p>
        </div>

        {{-- ── Body ── --}}
        <div class="body">

            {{-- Greeting --}}
            <p class="greeting">
                Hello{{ $sale->customer?->name ? ', ' . $sale->customer->name : '' }}!<br />
                Thank you for your order. Here is a summary for your records.
            </p>

            {{-- ── Order Info ── --}}
            <div class="section-heading">Order Details</div>
            <div class="info-card">
                <table>
                    <tr>
                        <td>Reference No.</td>
                        <td>{{ $sale->reference_no }}</td>
                    </tr>
                    <tr>
                        <td>Order Date</td>
                        <td>{{ \Carbon\Carbon::parse($sale->sale_date)->format('d M Y') }}</td>
                    </tr>
                    <tr>
                        <td>Payment Type</td>
                        <td>
                            @php
                                $paymentTypeLabel = match ($sale->payment_type) {
                                    'full_paid' => 'Full Paid',
                                    'half_paid' => 'Half Paid',
                                    'cash_on_delivery' => 'Cash on Delivery',
                                    default => ucfirst(str_replace('_', ' ', $sale->payment_type ?? 'N/A')),
                                };
                            @endphp
                            {{ $paymentTypeLabel }}
                        </td>
                    </tr>
                    @if ($sale->payment_type !== 'cash_on_delivery' && $sale->paymentMethod)
                        <tr>
                            <td>Payment Method</td>
                            <td>{{ $sale->paymentMethod->name }}</td>
                        </tr>
                    @endif
                    @if ($sale->transaction_id ?? null)
                        <tr>
                            <td>Transaction ID</td>
                            <td>{{ $sale->transaction_id }}</td>
                        </tr>
                    @endif
                    @if ($sale->delivery_type && $sale->delivery_type !== 'store_pickup')
                        <tr>
                            <td>Delivery Address</td>
                            <td>{{ $sale->delivery_address ?? '—' }}</td>
                        </tr>
                    @endif
                </table>
            </div>

            {{-- ── Items ── --}}
            <div class="section-heading">Items Ordered</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($sale->items as $item)
                        <tr>
                            <td>
                                {{ $item->product?->name ?? 'Product' }}
                                @if ($item->variant?->attributes)
                                    <br />
                                    <span style="font-size:11px; color:#6b7280;">
                                        {{ collect($item->variant->attributes)->map(fn($v, $k) => "$k: $v")->implode(', ') }}
                                    </span>
                                @endif
                            </td>
                            <td>{{ $item->quantity }}</td>
                            <td>{{ $business['currency_symbol'] }}{{ number_format($item->unit_price, $business['decimal_places']) }}
                            </td>
                            <td>{{ $business['currency_symbol'] }}{{ number_format($item->subtotal, $business['decimal_places']) }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            {{-- ── Totals ── --}}
            <div class="totals">
                <table>
                    <tr>
                        <td>Subtotal</td>
                        <td>{{ $business['currency_symbol'] }}{{ number_format($sale->subtotal, $business['decimal_places']) }}
                        </td>
                    </tr>
                    @if (floatval($sale->discount) > 0)
                        <tr class="discount">
                            <td>Discount</td>
                            <td>−
                                {{ $business['currency_symbol'] }}{{ number_format($sale->discount, $business['decimal_places']) }}
                            </td>
                        </tr>
                    @endif
                    @if (floatval($sale->tax) > 0)
                        <tr>
                            <td>Tax</td>
                            <td>+
                                {{ $business['currency_symbol'] }}{{ number_format($sale->tax, $business['decimal_places']) }}
                            </td>
                        </tr>
                    @endif
                    @if ($sale->delivery_type !== 'store_pickup' && floatval($sale->effectiveDeliveryCharge()) > 0)
                        <tr>
                            <td>Delivery Charge</td>
                            <td>+
                                {{ $business['currency_symbol'] }}{{ number_format($sale->effectiveDeliveryCharge(), $business['decimal_places']) }}
                            </td>
                        </tr>
                    @endif
                    <tr class="grand-total">
                        <td>Grand Total</td>
                        <td>{{ $business['currency_symbol'] }}{{ number_format($sale->grand_total, $business['decimal_places']) }}
                        </td>
                    </tr>
                </table>
            </div>

            {{-- ── Payment Status ── --}}
            <div style="margin-bottom: 24px;">
                <div class="section-heading">Payment Status</div>
                @if ($sale->payment_type === 'cash_on_delivery')
                    <span class="badge badge-cod">Cash on Delivery — Payment on delivery</span>
                @elseif($sale->payment_status === 'paid')
                    <span class="badge badge-paid">Fully Paid</span>
                @elseif($sale->payment_status === 'partial')
                    <span class="badge badge-partial">
                        Partial —
                        {{ $business['currency_symbol'] }}{{ number_format($sale->paid_amount, $business['decimal_places']) }}
                        paid,
                        {{ $business['currency_symbol'] }}{{ number_format($sale->due_amount, $business['decimal_places']) }}
                        due
                    </span>
                @else
                    <span class="badge badge-due">
                        Due —
                        {{ $business['currency_symbol'] }}{{ number_format($sale->due_amount, $business['decimal_places']) }}
                    </span>
                @endif
            </div>

            {{-- ── Note ── --}}
            @if ($sale->note)
                <div style="margin-bottom: 24px;">
                    <div class="section-heading">Note</div>
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">{{ $sale->note }}</p>
                </div>
            @endif

            <p style="font-size: 13px; color: #6b7280; margin: 0;">
                If you have any questions about your order, please contact us at
                @if ($business['phone'])
                    <strong>{{ $business['phone'] }}</strong>
                @endif
                @if ($business['email'])
                    or <strong>{{ $business['email'] }}</strong>
                @endif
                .
            </p>

        </div>

        {{-- ── Footer ── --}}
        <div class="footer">
            <p style="margin: 0 0 4px;">
                &copy; {{ date('Y') }} <strong>{{ $business['business_name'] }}</strong>. All rights reserved.
            </p>
            @if ($business['address'])
                <p style="margin: 0;">{{ $business['address'] }}</p>
            @endif
        </div>

    </div>
</body>

</html>
