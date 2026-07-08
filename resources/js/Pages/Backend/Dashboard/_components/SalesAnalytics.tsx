import { SalesAnalyticsData } from "../Index";
import { ReactNode } from "react";
import { Wallet, Banknote, CreditCard, Smartphone } from "lucide-react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts";

interface Props {
    analytics: SalesAnalyticsData;
}

const SLICE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#f87171", "#a78bfa", "#34d399", "#60a5fa", "#fb923c"];

const METHOD_STYLES: Record<string, { icon: ReactNode; bar: string; chip: string }> = {
    cash: {
        icon: <Banknote className="h-3.5 w-3.5" />,
        bar: "bg-green-400",
        chip: "bg-green-50 text-green-700",
    },
    card: {
        icon: <CreditCard className="h-3.5 w-3.5" />,
        bar: "bg-indigo-400",
        chip: "bg-indigo-50 text-indigo-700",
    },
    bkash: {
        icon: <Smartphone className="h-3.5 w-3.5" />,
        bar: "bg-pink-400",
        chip: "bg-pink-50 text-pink-700",
    },
    default: {
        icon: <Wallet className="h-3.5 w-3.5" />,
        bar: "bg-gray-400",
        chip: "bg-gray-100 text-gray-600",
    },
};

function methodStyle(method: string) {
    const key = method.toLowerCase().replace(/[^a-z]/g, "");
    return METHOD_STYLES[key] ?? METHOD_STYLES.default;
}

function fmtCurrency(value: number): string {
    if (Math.abs(value) >= 1_000_000) return "৳" + (value / 1_000_000).toFixed(1) + "M";
    if (Math.abs(value) >= 1_000) return "৳" + (value / 1_000).toFixed(1) + "K";
    return "৳" + Number(value).toFixed(2);
}

function statusLabel(status: string): string {
    return { paid: "Paid", partial: "Partial", due: "Due" }[status] ?? status;
}

function statusColor(status: string): string {
    return (
        {
            paid: "bg-green-50 text-green-700 ring-1 ring-green-200",
            partial: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
            due: "bg-red-50 text-red-700 ring-1 ring-red-200",
        }[status] ?? "bg-gray-100 text-gray-600"
    );
}

function PieTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: { name: string; value: number; payload: { total: number; count?: number } }[];
}) {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    return (
        <div className="rounded-xl border border-gray-100 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm text-xs">
            <p className="mb-1 font-semibold text-gray-800">{entry.name}</p>
            <p className="text-gray-500">
                Amount: <span className="font-semibold text-gray-800">{fmtCurrency(Number(entry.payload.total))}</span>
            </p>
            {entry.payload.count !== undefined && (
                <p className="text-gray-500">
                    Orders: <span className="font-semibold text-gray-800">{Number(entry.payload.count).toLocaleString()}</span>
                </p>
            )}
        </div>
    );
}

function DonutWithCenter({
    data,
    nameKey,
    centerLabel,
    centerValue,
    height = 170,
}: {
    data: { total: number; [k: string]: any }[];
    nameKey: string;
    centerLabel: string;
    centerValue: string;
    height?: number;
}) {
    return (
        <div className="relative">
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="total"
                        nameKey={nameKey}
                        cx="50%"
                        cy="50%"
                        innerRadius={height * 0.28}
                        outerRadius={height * 0.42}
                        paddingAngle={3}
                        cornerRadius={4}
                        stroke="none"
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">{centerLabel}</p>
                <p className="text-sm font-bold text-gray-800">{centerValue}</p>
            </div>
        </div>
    );
}

function RankedBarList({
    rows,
    barColorFor,
    iconFor,
}: {
    rows: { key: string; label: string; total: number; count?: number }[];
    barColorFor: (label: string, i: number) => string;
    iconFor?: (label: string) => React.ReactNode;
}) {
    const total = rows.reduce((s, r) => s + r.total, 0);

    return (
        <div className="space-y-3">
            {rows.map((r, i) => {
                const pct = total > 0 ? (r.total / total) * 100 : 0;
                const barColor = barColorFor(r.label, i);
                return (
                    <div key={r.key} className="group">
                        <div className="mb-1 flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-1.5">
                                {iconFor && (
                                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-gray-50 text-gray-500 group-hover:bg-white">
                                        {iconFor(r.label)}
                                    </span>
                                )}
                                <span className="truncate text-xs font-medium text-gray-700">{r.label}</span>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-1.5">
                                <span className="text-xs font-semibold text-gray-800">{fmtCurrency(r.total)}</span>
                                <span className="w-9 text-right text-[10px] text-gray-400">{pct.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                                className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        {r.count !== undefined && (
                            <p className="mt-0.5 text-[10px] text-gray-400">{r.count.toLocaleString()} orders</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function SalesAnalytics({ analytics }: Props) {
    if (!analytics) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                Loading...
            </div>
        );
    }

    const paymentData = analytics.payment_breakdown.map((p) => ({
        ...p,
        total: Number(p.total) || 0,
        count: Number(p.count) || 0,
    }));
    const totalRevenue = paymentData.reduce((sum, p) => sum + p.total, 0);

    return (
        <div className="space-y-6">
            {/* Payment methods */}
            <div>
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <Wallet className="h-3.5 w-3.5" />
                    Payment methods
                </p>
                {paymentData.length === 0 ? (
                    <p className="text-xs text-gray-400">No sales in this period.</p>
                ) : (
                    <div className="space-y-4">
                        <DonutWithCenter
                            data={paymentData}
                            nameKey="method"
                            centerLabel="Total"
                            centerValue={fmtCurrency(totalRevenue)}
                        />
                        <RankedBarList
                            rows={paymentData.map((p) => ({ key: p.method, label: p.method, total: p.total, count: p.count }))}
                            barColorFor={(label) => methodStyle(label).bar}
                            iconFor={(label) => methodStyle(label).icon}
                        />
                    </div>
                )}
            </div>

            {/* Payment status */}
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
                                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-xs"
                            >
                                <span className={["rounded-full px-2 py-0.5 font-medium", statusColor(s.payment_status)].join(" ")}>
                                    {statusLabel(s.payment_status)}
                                </span>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <span>{Number(s.count).toLocaleString()} orders</span>
                                    <span className="font-semibold text-gray-800">{fmtCurrency(Number(s.total))}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
