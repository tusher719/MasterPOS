import { ChartData } from "../Index";
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

interface Props {
    charts: ChartData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtLabel(label: string, granularity: "daily" | "monthly"): string {
    if (granularity === "monthly") {
        // "2025-07" → "Jul 25"
        const [year, month] = label.split("-");
        const date = new Date(Number(year), Number(month) - 1, 1);
        return date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
        });
    }
    // "2025-07-05" → "05 Jul"
    const date = new Date(label);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}

function fmtCurrency(value: number): string {
    if (Math.abs(value) >= 1_000_000)
        return "৳" + (value / 1_000_000).toFixed(1) + "M";
    if (Math.abs(value) >= 1_000) return "৳" + (value / 1_000).toFixed(1) + "K";
    return "৳" + value.toFixed(0);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
    active,
    payload,
    label,
    granularity,
}: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
    granularity: "daily" | "monthly";
}) {
    if (!active || !payload?.length || !label) return null;

    return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm text-xs">
            <p className="mb-1.5 font-medium text-gray-700">
                {fmtLabel(label, granularity)}
            </p>
            {payload.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                    <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: entry.color }}
                    />
                    <span className="text-gray-500 capitalize">
                        {entry.name}:
                    </span>
                    <span className="font-medium text-gray-700">
                        {entry.name === "count"
                            ? entry.value.toLocaleString()
                            : fmtCurrency(Number(entry.value))}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Merge sales + expense by label ──────────────────────────────────────────

function mergeChartData(
    salesTrend: ChartData["sales_trend"],
    expenseTrend: ChartData["expense_trend"],
): { label: string; revenue: number; expenses: number; count: number }[] {
    const map = new Map<
        string,
        { revenue: number; expenses: number; count: number }
    >();

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function SalesChart({ charts }: Props) {
    const merged = mergeChartData(charts.sales_trend, charts.expense_trend);

    if (merged.length === 0) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                No data for the selected period.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* ── Granularity badge ── */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                    Showing{" "}
                    <span className="font-medium text-gray-600">
                        {charts.granularity === "daily" ? "daily" : "monthly"}
                    </span>{" "}
                    breakdown
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-4 rounded-sm bg-indigo-500" />
                        Revenue
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-4 rounded-sm bg-red-400" />
                        Expenses
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-0.5 w-4 bg-amber-400" />
                        Orders
                    </span>
                </div>
            </div>

            {/* ── Chart ── */}
            <ResponsiveContainer width="100%" height={260}>
                <ComposedChart
                    data={merged}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => fmtLabel(v, charts.granularity)}
                        interval="preserveStartEnd"
                    />

                    {/* Left Y — currency */}
                    <YAxis
                        yAxisId="currency"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={fmtCurrency}
                        width={56}
                    />

                    {/* Right Y — order count */}
                    <YAxis
                        yAxisId="count"
                        orientation="right"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        width={32}
                    />

                    <Tooltip
                        content={
                            <CustomTooltip granularity={charts.granularity} />
                        }
                    />

                    <Bar
                        yAxisId="currency"
                        dataKey="revenue"
                        name="revenue"
                        fill="#6366f1"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={32}
                    />

                    <Bar
                        yAxisId="currency"
                        dataKey="expenses"
                        name="expenses"
                        fill="#f87171"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={32}
                    />

                    <Line
                        yAxisId="count"
                        type="monotone"
                        dataKey="count"
                        name="count"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
