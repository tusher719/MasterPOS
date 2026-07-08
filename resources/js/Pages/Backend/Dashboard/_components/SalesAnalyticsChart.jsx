// Note: this file is plain JSX. TypeScript type imports removed.
import {
    ResponsiveContainer,
    ComposedChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

function fmtLabel(label, granularity) {
    if (granularity === "monthly") {
        const [year, month] = label.split("-");
        const date = new Date(Number(year), Number(month) - 1, 1);
        return date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
        });
    }
    const date = new Date(label);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}

function fmtCurrency(value) {
    if (Math.abs(value) >= 1_000_000)
        return "৳" + (value / 1_000_000).toFixed(1) + "M";
    if (Math.abs(value) >= 1_000) return "৳" + (value / 1_000).toFixed(1) + "K";
    return "৳" + value.toFixed(0);
}

function CustomTooltip({ active, payload, label, granularity }) {
    if (!active || !payload?.length || !label) return null;

    return (
        <div className="rounded-xl border border-gray-100 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm text-xs">
            <p className="mb-2 font-semibold text-gray-800">
                {fmtLabel(label, granularity)}
            </p>
            <div className="space-y-1">
                {payload.map((entry) => (
                    <div
                        key={entry.name}
                        className="flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-1.5">
                            <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ background: entry.color }}
                            />
                            <span className="text-gray-500 capitalize">
                                {entry.name}
                            </span>
                        </div>
                        <span className="font-semibold text-gray-800">
                            {entry.name === "count"
                                ? entry.value.toLocaleString()
                                : fmtCurrency(Number(entry.value))}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function mergeChartData(salesTrend, expenseTrend) {
    const map = new Map();

    for (const s of salesTrend) {
        map.set(s.label, {
            revenue: Number(s.revenue) || 0,
            expenses: 0,
            count: Number(s.count) || 0,
        });
    }

    for (const e of expenseTrend) {
        const existing = map.get(e.label);
        if (existing) {
            existing.expenses = Number(e.amount) || 0;
        } else {
            map.set(e.label, {
                revenue: 0,
                expenses: Number(e.amount) || 0,
                count: 0,
            });
        }
    }

    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, vals]) => ({ label, ...vals }));
}

// Summary badges shown above the chart
function SummaryStat({ label, value, color }) {
    return (
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <span
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ background: color }}
            />
            <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                    {label}
                </p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
            </div>
        </div>
    );
}

export default function SalesAnalyticsChart({ charts }) {
    const merged = mergeChartData(charts.sales_trend, charts.expense_trend);

    if (merged.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-300">
                <svg
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3v18h18M7 15l4-4 3 3 5-6"
                    />
                </svg>
                <p className="text-sm text-gray-400">
                    No data for the selected period.
                </p>
            </div>
        );
    }

    const totalRevenue = merged.reduce((s, m) => s + m.revenue, 0);
    const totalExpenses = merged.reduce((s, m) => s + m.expenses, 0);
    const totalOrders = merged.reduce((s, m) => s + m.count, 0);

    return (
        <div className="space-y-4">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-2">
                <SummaryStat
                    label="Revenue"
                    value={fmtCurrency(totalRevenue)}
                    color="#6366f1"
                />
                <SummaryStat
                    label="Expenses"
                    value={fmtCurrency(totalExpenses)}
                    color="#f87171"
                />
                <SummaryStat
                    label="Orders"
                    value={totalOrders.toLocaleString()}
                    color="#f59e0b"
                />
            </div>

            <p className="text-xs text-gray-400">
                Showing{" "}
                <span className="font-medium text-gray-600">
                    {charts.granularity}
                </span>{" "}
                breakdown
            </p>

            <ResponsiveContainer width="100%" height={260}>
                <ComposedChart
                    data={merged}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient
                            id="revenueGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#6366f1"
                                stopOpacity={0.35}
                            />
                            <stop
                                offset="100%"
                                stopColor="#6366f1"
                                stopOpacity={0.02}
                            />
                        </linearGradient>
                        <linearGradient
                            id="expenseGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#f87171"
                                stopOpacity={0.3}
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
                        stroke="#f1f1f4"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => fmtLabel(v, charts.granularity)}
                        interval="preserveStartEnd"
                        dy={6}
                    />

                    <YAxis
                        yAxisId="currency"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={fmtCurrency}
                        width={52}
                    />

                    <YAxis
                        yAxisId="count"
                        orientation="right"
                        tick={{ fontSize: 11, fill: "#d1d5db" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        width={28}
                    />

                    <Tooltip
                        content={
                            <CustomTooltip granularity={charts.granularity} />
                        }
                    />

                    <Area
                        yAxisId="currency"
                        type="monotone"
                        dataKey="revenue"
                        name="revenue"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fill="url(#revenueGradient)"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                    />

                    <Area
                        yAxisId="currency"
                        type="monotone"
                        dataKey="expenses"
                        name="expenses"
                        stroke="#f87171"
                        strokeWidth={2}
                        fill="url(#expenseGradient)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                    />

                    <Line
                        yAxisId="count"
                        type="monotone"
                        dataKey="count"
                        name="count"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        dot={false}
                        activeDot={{ r: 3, strokeWidth: 0 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
