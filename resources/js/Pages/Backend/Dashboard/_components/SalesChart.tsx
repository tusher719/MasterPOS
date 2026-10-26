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
    const val = Number(value || 0);
    if (Math.abs(val) >= 1_000_000)
        return "৳ " + (val / 1_000_000).toFixed(1) + "M";
    if (Math.abs(val) >= 1_000) return "৳ " + (val / 1_000).toFixed(1) + "K";
    return "৳ " + val.toFixed(0);
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
        <div className="rounded-xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm text-xs">
            <p className="mb-1.5 font-semibold text-foreground">
                {fmtLabel(label, granularity)}
            </p>
            {payload.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 py-0.5">
                    <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: entry.color }}
                    />
                    <span className="text-muted-foreground capitalize">
                        {entry.name}:
                    </span>
                    <span className="font-semibold text-foreground font-sans">
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
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No data for the selected period.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* ── Granularity badge ── */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                        {charts.granularity === "daily" ? "daily" : "monthly"}
                    </span>{" "}
                    breakdown
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                        <span className="inline-block h-2.5 w-3 rounded-xs bg-indigo-500" />
                        Revenue
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                        <span className="inline-block h-2.5 w-3 rounded-xs bg-rose-400" />
                        Expenses
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                        <span className="inline-block h-1 w-3.5 bg-amber-400 rounded-full" />
                        Orders
                    </span>
                </div>
            </div>

            {/* ── Chart ── */}
            <ResponsiveContainer width="100%" height={260}>
                <ComposedChart
                    data={merged}
                    margin={{ top: 10, right: 14, left: 14, bottom: 8 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="text-border/40"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => fmtLabel(v, charts.granularity)}
                        interval="preserveStartEnd"
                    />

                    {/* Left Y — currency */}
                    <YAxis
                        yAxisId="currency"
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={fmtCurrency}
                        width={64}
                    />

                    {/* Right Y — order count */}
                    <YAxis
                        yAxisId="count"
                        orientation="right"
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        width={36}
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
