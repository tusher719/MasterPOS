import { ArrowDownRight, ArrowUpRight, Calendar, Minus } from "lucide-react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PeriodType =
    | "today"
    | "this_week"
    | "this_month"
    | "this_year"
    | "custom";

export interface PeriodParams {
    period: PeriodType;
    date_from?: string;
    date_to?: string;
}

export const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "this_week", label: "This Week" },
    { value: "this_month", label: "This Month" },
    { value: "this_year", label: "This Year" },
    { value: "custom", label: "Custom" },
];

// ─── Currency helpers ─────────────────────────────────────────────────────────

export function fmt(value: number): string {
    return (
        "৳" +
        Number(value).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

export function fmtShort(value: number): string {
    if (Math.abs(value) >= 1_000_000)
        return "৳" + (value / 1_000_000).toFixed(1) + "M";
    if (Math.abs(value) >= 1_000) return "৳" + (value / 1_000).toFixed(1) + "K";
    return "৳" + Number(value).toFixed(0);
}

export function fmtLabel(
    label: string,
    granularity: "daily" | "monthly",
): string {
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

// ─── Change badge ─────────────────────────────────────────────────────────────

export function ChangeBadge({ pct }: { pct: number }) {
    if (pct === 0)
        return (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                <Minus className="h-3 w-3" /> 0%
            </span>
        );
    const positive = pct > 0;
    return (
        <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                positive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
            }`}
        >
            {positive ? (
                <ArrowUpRight className="h-3 w-3" />
            ) : (
                <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(pct).toFixed(1)}%
        </span>
    );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

export function KpiCard({
    label,
    value,
    sub,
    changePct,
    icon: Icon,
    iconColor,
    iconBg,
}: {
    label: string;
    value: string;
    sub?: string;
    changePct?: number;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
}) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
                <p className="text-xs text-gray-500">{label}</p>
                <div className={`rounded-lg p-2 ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
            </div>
            <p className="mt-2 text-xl font-bold text-gray-800">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
            {changePct !== undefined && (
                <div className="mt-2 flex items-center gap-1.5">
                    <ChangeBadge pct={changePct} />
                    <span className="text-[10px] text-gray-400">
                        vs prev period
                    </span>
                </div>
            )}
        </div>
    );
}

// ─── Section card ─────────────────────────────────────────────────────────────

export function SectionCard({
    title,
    action,
    children,
}: {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
                {action && (
                    <div className="text-xs text-gray-400">{action}</div>
                )}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── Simple bar ───────────────────────────────────────────────────────────────

export function SimpleBar({
    value,
    max,
    color,
}: {
    value: number;
    max: number;
    color: string;
}) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
                className={`h-full rounded-full ${color} transition-all duration-500`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

export function StatusBadge({
    status,
    labels,
    colors,
}: {
    status: string;
    labels: Record<string, string>;
    colors: Record<string, string>;
}) {
    return (
        <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                colors[status] ?? "bg-gray-100 text-gray-600"
            }`}
        >
            {labels[status] ?? status}
        </span>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton() {
    return (
        <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-gray-100" />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="h-48 rounded-xl bg-gray-100" />
                <div className="h-48 rounded-xl bg-gray-100" />
            </div>
            <div className="h-64 rounded-xl bg-gray-100" />
        </div>
    );
}

// ─── Chart tooltip shared style ───────────────────────────────────────────────

export function ChartTooltipBox({
    label,
    rows,
}: {
    label: string;
    rows: { name: string; value: string; color: string }[];
}) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm text-xs">
            <p className="mb-2 font-semibold text-gray-800">{label}</p>
            <div className="space-y-1">
                {rows.map((r) => (
                    <div
                        key={r.name}
                        className="flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-1.5">
                            <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ background: r.color }}
                            />
                            <span className="text-gray-500">{r.name}</span>
                        </div>
                        <span className="font-semibold text-gray-800">
                            {r.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Period filter ────────────────────────────────────────────────────────────

export function PeriodFilter({
    value,
    onChange,
    loading,
}: {
    value: PeriodParams;
    onChange: (p: PeriodParams) => void;
    loading: boolean;
}) {
    const [showCustom, setShowCustom] = useState(value.period === "custom");
    const [dateFrom, setDateFrom] = useState(value.date_from ?? "");
    const [dateTo, setDateTo] = useState(value.date_to ?? "");

    const handleSelect = (period: PeriodType) => {
        if (period === "custom") {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        onChange({ period });
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
                {PERIOD_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        disabled={loading}
                        onClick={() => handleSelect(opt.value)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                            value.period === opt.value
                                ? "bg-indigo-600 text-white"
                                : "text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {showCustom && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded border-0 p-0 text-xs text-gray-700 focus:ring-0"
                    />
                    <span className="text-xs text-gray-400">→</span>
                    <input
                        type="date"
                        value={dateTo}
                        min={dateFrom}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded border-0 p-0 text-xs text-gray-700 focus:ring-0"
                    />
                    <button
                        disabled={loading || !dateFrom || !dateTo}
                        onClick={() =>
                            onChange({
                                period: "custom",
                                date_from: dateFrom,
                                date_to: dateTo,
                            })
                        }
                        className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}
