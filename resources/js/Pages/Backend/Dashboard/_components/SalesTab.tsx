import { Link } from "@inertiajs/react";
import { BarChart3, Receipt, ShoppingCart, Wallet } from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { route } from "ziggy-js";
import {
    ChartTooltipBox,
    fmt,
    fmtLabel,
    fmtShort,
    KpiCard,
    SectionCard,
    SimpleBar,
    StatusBadge,
} from "./SharedComponents";

// ─── Colors ───────────────────────────────────────────────────────────────────

const ORDER_STATUS_COLORS: Record<string, string> = {
    processing: "bg-blue-100 text-blue-700",
    confirmed: "bg-indigo-100 text-indigo-700",
    out_for_delivery: "bg-amber-100 text-amber-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    returned: "bg-orange-100 text-orange-700",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
    processing: "Processing",
    confirmed: "Confirmed",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
};

const ORDER_STATUS_CHART_COLORS: Record<string, string> = {
    processing: "#6366f1",
    confirmed: "#8b5cf6",
    out_for_delivery: "#f59e0b",
    delivered: "#10b981",
    cancelled: "#ef4444",
    returned: "#f97316",
};

const PAYMENT_METHOD_COLORS = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#f43f5e",
    "#0ea5e9",
    "#8b5cf6",
];

// ─── Revenue trend chart ──────────────────────────────────────────────────────

function RevenueTrendChart({ charts }: { charts: any }) {
    if (!charts?.trend?.length) {
        return (
            <div className="flex h-48 items-center justify-center text-xs text-gray-400">
                No data for this period.
            </div>
        );
    }

    const data = charts.trend.map((d: any) => ({
        label: d.label,
        revenue: Number(d.revenue) || 0,
        count: Number(d.count) || 0,
        due: Number(d.due) || 0,
    }));

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    Revenue
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
                    Due
                </span>
                <span className="ml-auto text-[10px] text-gray-400">
                    {charts.granularity === "daily" ? "Daily" : "Monthly"} view
                </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                    data={data}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient
                            id="salesRevGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#6366f1"
                                stopOpacity={0.3}
                            />
                            <stop
                                offset="100%"
                                stopColor="#6366f1"
                                stopOpacity={0.02}
                            />
                        </linearGradient>
                        <linearGradient
                            id="salesDueGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#f87171"
                                stopOpacity={0.25}
                            />
                            <stop
                                offset="100%"
                                stopColor="#f87171"
                                stopOpacity={0.02}
                            />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 6"
                        stroke="#f1f5f9"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => fmtLabel(v, charts.granularity)}
                        interval="preserveStartEnd"
                        dy={6}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={fmtShort}
                        width={48}
                    />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;

                            const labelText =
                                typeof label === "string"
                                    ? label
                                    : String(label ?? "");

                            return (
                                <ChartTooltipBox
                                    label={fmtLabel(labelText, charts.granularity)}
                                    rows={[
                                        {
                                            name: "Revenue",
                                            value: fmtShort(
                                                Number(payload[0]?.value ?? 0),
                                            ),
                                            color: "#6366f1",
                                        },
                                        {
                                            name: "Due",
                                            value: fmtShort(
                                                Number(payload[1]?.value ?? 0),
                                            ),
                                            color: "#f87171",
                                        },
                                    ]}
                                />
                            );
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fill="url(#salesRevGrad)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                    />
                    <Area
                        type="monotone"
                        dataKey="due"
                        stroke="#f87171"
                        strokeWidth={1.5}
                        fill="url(#salesDueGrad)"
                        dot={false}
                        activeDot={{ r: 3, strokeWidth: 2, stroke: "#fff" }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Order status chart ───────────────────────────────────────────────────────

function OrderStatusChart({
    orderStatus,
    totalSales,
}: {
    orderStatus: any[];
    totalSales: number;
}) {
    if (!orderStatus?.length) {
        return (
            <p className="text-xs text-gray-400">No orders in this period.</p>
        );
    }

    const data = orderStatus.map((s: any) => ({
        status: ORDER_STATUS_LABELS[s.status] ?? s.status,
        rawStatus: s.status,
        count: Number(s.count),
        total: Number(s.total),
    }));

    return (
        <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                    barSize={12}
                >
                    <CartesianGrid
                        strokeDasharray="3 6"
                        stroke="#f1f5f9"
                        horizontal={false}
                    />
                    <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => String(v)}
                    />
                    <YAxis
                        type="category"
                        dataKey="status"
                        tick={{ fontSize: 10, fill: "#6b7280" }}
                        tickLine={false}
                        axisLine={false}
                        width={90}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                                <ChartTooltipBox
                                    label={d.status}
                                    rows={[
                                        {
                                            name: "Orders",
                                            value: String(d.count),
                                            color:
                                                ORDER_STATUS_CHART_COLORS[
                                                    d.rawStatus
                                                ] ?? "#6366f1",
                                        },
                                        {
                                            name: "Total",
                                            value: fmtShort(d.total),
                                            color: "#9ca3af",
                                        },
                                    ]}
                                />
                            );
                        }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {data.map((d, i) => (
                            <Cell
                                key={i}
                                fill={
                                    ORDER_STATUS_CHART_COLORS[d.rawStatus] ??
                                    "#6366f1"
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Payment method chart ─────────────────────────────────────────────────────

function PaymentMethodChart({ paymentMethods }: { paymentMethods: any[] }) {
    if (!paymentMethods?.length) {
        return (
            <p className="text-xs text-gray-400">No payments in this period.</p>
        );
    }

    const data = paymentMethods.map((m: any) => ({
        method: m.method,
        total: Number(m.total),
        count: Number(m.count),
    }));

    const grandTotal = data.reduce((s, d) => s + d.total, 0);

    return (
        <div className="space-y-3">
            <ResponsiveContainer width="100%" height={160}>
                <BarChart
                    data={data}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                    barSize={28}
                >
                    <CartesianGrid
                        strokeDasharray="3 6"
                        stroke="#f1f5f9"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="method"
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={fmtShort}
                        width={44}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            const pct =
                                grandTotal > 0
                                    ? ((d.total / grandTotal) * 100).toFixed(1)
                                    : "0";
                            return (
                                <ChartTooltipBox
                                    label={d.method}
                                    rows={[
                                        {
                                            name: "Amount",
                                            value: fmtShort(d.total),
                                            color: "#6366f1",
                                        },
                                        {
                                            name: "Orders",
                                            value: String(d.count),
                                            color: "#9ca3af",
                                        },
                                        {
                                            name: "Share",
                                            value: `${pct}%`,
                                            color: "#10b981",
                                        },
                                    ]}
                                />
                            );
                        }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {data.map((_, i) => (
                            <Cell
                                key={i}
                                fill={
                                    PAYMENT_METHOD_COLORS[
                                        i % PAYMENT_METHOD_COLORS.length
                                    ]
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="space-y-1.5">
                {data.map((d, i) => {
                    const pct =
                        grandTotal > 0
                            ? ((d.total / grandTotal) * 100).toFixed(1)
                            : "0";
                    return (
                        <div
                            key={i}
                            className="flex items-center gap-2 text-xs"
                        >
                            <span
                                className="h-2 w-2 flex-shrink-0 rounded-full"
                                style={{
                                    background:
                                        PAYMENT_METHOD_COLORS[
                                            i % PAYMENT_METHOD_COLORS.length
                                        ],
                                }}
                            />
                            <span className="flex-1 text-gray-600">
                                {d.method}
                            </span>
                            <span className="text-gray-400">
                                {d.count} orders
                            </span>
                            <span className="w-14 text-right font-medium text-gray-700">
                                {fmtShort(d.total)}
                            </span>
                            <span className="w-9 text-right text-gray-400">
                                {pct}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main SalesTab ────────────────────────────────────────────────────────────

export default function SalesTab({ data }: { data: any }) {
    const {
        kpis,
        charts,
        order_status,
        payment_methods,
        top_products,
        top_customers,
        recent_sales,
    } = data;

    const maxProduct = Math.max(
        ...(top_products ?? []).map((p: any) => Number(p.total_revenue)),
        1,
    );
    const maxCustomer = Math.max(
        ...(top_customers ?? []).map((c: any) => Number(c.total_spent)),
        1,
    );

    return (
        <div className="space-y-5">
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard
                    label="Revenue"
                    value={fmtShort(kpis.revenue)}
                    changePct={kpis.revenue_change_pct}
                    icon={Wallet}
                    iconColor="text-indigo-600"
                    iconBg="bg-indigo-50"
                />
                <KpiCard
                    label="Total Sales"
                    value={Number(kpis.sales_count).toLocaleString()}
                    changePct={kpis.count_change_pct}
                    icon={ShoppingCart}
                    iconColor="text-indigo-600"
                    iconBg="bg-indigo-50"
                />
                <KpiCard
                    label="Avg. Order Value"
                    value={fmtShort(kpis.aov)}
                    changePct={kpis.aov_change_pct}
                    icon={BarChart3}
                    iconColor="text-indigo-600"
                    iconBg="bg-indigo-50"
                />
                <KpiCard
                    label="Outstanding Due"
                    value={fmtShort(kpis.due_amount)}
                    sub={`${kpis.cod_count} COD orders`}
                    icon={Receipt}
                    iconColor="text-amber-600"
                    iconBg="bg-amber-50"
                />
            </div>

            {/* Revenue trend (full width) */}
            <SectionCard title="Revenue Trend">
                <RevenueTrendChart charts={charts} />
            </SectionCard>

            {/* Order status + Payment methods */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <SectionCard title="Order Status Breakdown">
                    <OrderStatusChart
                        orderStatus={order_status ?? []}
                        totalSales={kpis.sales_count}
                    />
                </SectionCard>

                <SectionCard title="Payment Methods">
                    <PaymentMethodChart
                        paymentMethods={payment_methods ?? []}
                    />
                </SectionCard>
            </div>

            {/* Top products + top customers */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <SectionCard title="Top Products by Revenue">
                    {(top_products ?? []).length === 0 ? (
                        <p className="text-xs text-gray-400">
                            No sales in this period.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {(top_products ?? [])
                                .slice(0, 8)
                                .map((p: any, i: number) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-xs font-medium text-gray-700">
                                                    {p.name}
                                                </p>
                                                <span className="flex-shrink-0 text-xs font-semibold text-gray-800">
                                                    {fmtShort(
                                                        Number(p.total_revenue),
                                                    )}
                                                </span>
                                            </div>
                                            <SimpleBar
                                                value={Number(p.total_revenue)}
                                                max={maxProduct}
                                                color="bg-indigo-400"
                                            />
                                        </div>
                                        <span className="flex-shrink-0 text-[10px] text-gray-400">
                                            {p.total_qty} sold
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="Top Customers by Spend">
                    {(top_customers ?? []).length === 0 ? (
                        <p className="text-xs text-gray-400">
                            No customer data in this period.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {(top_customers ?? [])
                                .slice(0, 8)
                                .map((c: any, i: number) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                                            {c.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-xs font-medium text-gray-700">
                                                    {c.name}
                                                </p>
                                                <span className="flex-shrink-0 text-xs font-semibold text-gray-800">
                                                    {fmtShort(
                                                        Number(c.total_spent),
                                                    )}
                                                </span>
                                            </div>
                                            <SimpleBar
                                                value={Number(c.total_spent)}
                                                max={maxCustomer}
                                                color="bg-indigo-400"
                                            />
                                        </div>
                                        <span className="flex-shrink-0 text-[10px] text-gray-400">
                                            {c.total_orders} orders
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </SectionCard>
            </div>

            {/* Recent sales table */}
            <SectionCard
                title="Recent Sales"
                action={
                    <Link
                        href={route("backend.pos.sales.index")}
                        className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                        View all →
                    </Link>
                }
            >
                {(recent_sales ?? []).length === 0 ? (
                    <p className="text-xs text-gray-400">
                        No sales in this period.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-50 text-gray-400">
                                    <th className="pb-2 text-left font-medium">
                                        Reference
                                    </th>
                                    <th className="pb-2 text-left font-medium">
                                        Customer
                                    </th>
                                    <th className="pb-2 text-left font-medium">
                                        Date
                                    </th>
                                    <th className="pb-2 text-right font-medium">
                                        Amount
                                    </th>
                                    <th className="pb-2 text-center font-medium">
                                        Order
                                    </th>
                                    <th className="pb-2 text-center font-medium">
                                        Payment
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(recent_sales ?? []).map((s: any) => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="py-2">
                                            <Link
                                                href={route(
                                                    "backend.pos.sales.show",
                                                    s.id,
                                                )}
                                                className="font-medium text-indigo-600 hover:underline"
                                            >
                                                {s.reference_no}
                                            </Link>
                                        </td>
                                        <td className="py-2 text-gray-600">
                                            {s.customer_name}
                                        </td>
                                        <td className="py-2 text-gray-400">
                                            {s.sale_date}
                                        </td>
                                        <td className="py-2 text-right font-medium text-gray-700">
                                            {fmt(Number(s.grand_total))}
                                        </td>
                                        <td className="py-2 text-center">
                                            <StatusBadge
                                                status={
                                                    s.order_status ??
                                                    "processing"
                                                }
                                                labels={ORDER_STATUS_LABELS}
                                                colors={ORDER_STATUS_COLORS}
                                            />
                                        </td>
                                        <td className="py-2 text-center">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                                    s.payment_status === "paid"
                                                        ? "bg-green-100 text-green-700"
                                                        : s.payment_status ===
                                                            "partial"
                                                          ? "bg-amber-100 text-amber-700"
                                                          : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {s.payment_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}
