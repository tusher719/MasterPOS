import { SalesAnalyticsData, ChartData } from "../Index";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface Props {
    analytics: SalesAnalyticsData;
    charts: ChartData;
}

// ─── Colors for pie slices ────────────────────────────────────────────────────

const SLICE_COLORS = [
    "#6366f1", // indigo
    "#f59e0b", // amber
    "#10b981", // emerald
    "#f87171", // red
    "#a78bfa", // violet
    "#34d399", // green
    "#60a5fa", // blue
    "#fb923c", // orange
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(value: number): string {
    if (Math.abs(value) >= 1_000_000)
        return "৳" + (value / 1_000_000).toFixed(1) + "M";
    if (Math.abs(value) >= 1_000) return "৳" + (value / 1_000).toFixed(1) + "K";
    return "৳" + Number(value).toFixed(2);
}

function statusLabel(status: string): string {
    const map: Record<string, string> = {
        paid: "Paid",
        partial: "Partial",
        due: "Due",
    };
    return map[status] ?? status;
}

function statusColor(status: string): string {
    const map: Record<string, string> = {
        paid: "bg-green-100 text-green-700",
        partial: "bg-amber-100 text-amber-700",
        due: "bg-red-100 text-red-700",
    };
    return map[status] ?? "bg-gray-100 text-gray-600";
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function PieTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: {
        name: string;
        value: number;
        payload: { total: number; count: number };
    }[];
}) {
    if (!active || !payload?.length) return null;

    const entry = payload[0];

    return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm text-xs">
            <p className="mb-1 font-medium text-gray-700">{entry.name}</p>
            <p className="text-gray-500">
                Amount:{" "}
                <span className="font-medium text-gray-700">
                    {fmtCurrency(Number(entry.payload.total))}
                </span>
            </p>
            <p className="text-gray-500">
                Orders:{" "}
                <span className="font-medium text-gray-700">
                    {Number(entry.payload.count).toLocaleString()}
                </span>
            </p>
        </div>
    );
}

// ─── Custom legend row ────────────────────────────────────────────────────────

function LegendRow({
    color,
    label,
    value,
    pct,
}: {
    color: string;
    label: string;
    value: string;
    pct: string;
}) {
    return (
        <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
                <span
                    className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ background: color }}
                />
                <span className="truncate text-gray-600">{label}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-medium text-gray-700">{value}</span>
                <span className="w-10 text-right text-gray-400">{pct}%</span>
            </div>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SalesAnalytics({ analytics, charts }: Props) {
    // Normalise numbers from API (may arrive as strings)
    const paymentData = analytics.payment_breakdown.map((p) => ({
        ...p,
        total: Number(p.total) || 0,
        count: Number(p.count) || 0,
    }));

    const totalRevenue = paymentData.reduce((sum, p) => sum + p.total, 0);

    // Expense by category for secondary pie
    const categoryData = charts.expense_by_category.map((c) => ({
        ...c,
        total: Number(c.total) || 0,
    }));
    const totalExpenses = categoryData.reduce((sum, c) => sum + c.total, 0);

    return (
        <div className="space-y-6">
            {/* ── Payment method breakdown ── */}
            <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Payment methods
                </p>

                {paymentData.length === 0 ? (
                    <p className="text-xs text-gray-400">
                        No sales in this period.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {/* Pie */}
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie
                                    data={paymentData}
                                    dataKey="total"
                                    nameKey="method"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={42}
                                    outerRadius={70}
                                    paddingAngle={2}
                                >
                                    {paymentData.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                SLICE_COLORS[
                                                    i % SLICE_COLORS.length
                                                ]
                                            }
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div className="space-y-1.5">
                            {paymentData.map((p, i) => (
                                <LegendRow
                                    key={p.method}
                                    color={
                                        SLICE_COLORS[i % SLICE_COLORS.length]
                                    }
                                    label={p.method}
                                    value={fmtCurrency(p.total)}
                                    pct={
                                        totalRevenue > 0
                                            ? (
                                                  (p.total / totalRevenue) *
                                                  100
                                              ).toFixed(1)
                                            : "0.0"
                                    }
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Payment status breakdown ── */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Payment status
                </p>
                <div className="space-y-1.5">
                    {analytics.status_breakdown.length === 0 ? (
                        <p className="text-xs text-gray-400">No data.</p>
                    ) : (
                        analytics.status_breakdown.map((s) => (
                            <div
                                key={s.payment_status}
                                className="flex items-center justify-between text-xs"
                            >
                                <span
                                    className={[
                                        "rounded-full px-2 py-0.5 font-medium",
                                        statusColor(s.payment_status),
                                    ].join(" ")}
                                >
                                    {statusLabel(s.payment_status)}
                                </span>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <span>
                                        {Number(s.count).toLocaleString()}{" "}
                                        orders
                                    </span>
                                    <span className="font-medium text-gray-700">
                                        {fmtCurrency(Number(s.total))}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── Expense by category ── */}
            <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Expenses by category
                </p>

                {categoryData.length === 0 ? (
                    <p className="text-xs text-gray-400">
                        No expenses in this period.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <ResponsiveContainer width="100%" height={140}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    dataKey="total"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={36}
                                    outerRadius={60}
                                    paddingAngle={2}
                                >
                                    {categoryData.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                SLICE_COLORS[
                                                    i % SLICE_COLORS.length
                                                ]
                                            }
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="space-y-1.5">
                            {categoryData.map((c, i) => (
                                <LegendRow
                                    key={c.category}
                                    color={
                                        SLICE_COLORS[i % SLICE_COLORS.length]
                                    }
                                    label={c.category}
                                    value={fmtCurrency(c.total)}
                                    pct={
                                        totalExpenses > 0
                                            ? (
                                                  (c.total / totalExpenses) *
                                                  100
                                              ).toFixed(1)
                                            : "0.0"
                                    }
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
