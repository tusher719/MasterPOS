import { Link } from "@inertiajs/react";
import { Landmark, TrendingUp, Users, Wallet } from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { route } from "ziggy-js";
import {
    ChartTooltipBox,
    fmtLabel,
    fmtShort,
    KpiCard,
    SectionCard,
} from "./SharedComponents";

// ─── Distribution trend chart ─────────────────────────────────────────────────

function DistributionTrendChart({
    trend,
    granularity,
}: {
    trend: any[];
    granularity: "daily" | "monthly";
}) {
    if (!trend?.length) {
        return (
            <div className="flex h-48 items-center justify-center text-xs text-gray-400">
                No distributions in this period.
            </div>
        );
    }

    const data = trend.map((d: any) => ({
        label: d.label,
        total: Number(d.total),
        count: Number(d.count),
    }));

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Distributed Amount
                </span>
                <span className="ml-auto text-[10px] text-gray-400">
                    {granularity === "daily" ? "Daily" : "Monthly"} view
                </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                    data={data}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient
                            id="distGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#f59e0b"
                                stopOpacity={0.3}
                            />
                            <stop
                                offset="100%"
                                stopColor="#f59e0b"
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
                        tickFormatter={(v) => fmtLabel(String(v ?? ""), granularity)}
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
                            return (
                                <ChartTooltipBox
                                    label={fmtLabel(String(label ?? ""), granularity)}
                                    rows={[
                                        {
                                            name: "Amount",
                                            value: fmtShort(
                                                Number(payload[0]?.value ?? 0),
                                            ),
                                            color: "#f59e0b",
                                        },
                                        {
                                            name: "Count",
                                            value: String(
                                                payload[0]?.payload?.count ?? 0,
                                            ),
                                            color: "#9ca3af",
                                        },
                                    ]}
                                />
                            );
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fill="url(#distGrad)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Capital comparison chart (deposited vs withdrawn per investor) ────────────

function CapitalComparisonChart({ capitalSummary }: { capitalSummary: any[] }) {
    if (!capitalSummary?.length) {
        return (
            <p className="text-xs text-gray-400">No capital records found.</p>
        );
    }

    const data = capitalSummary.map((inv: any) => ({
        name:
            inv.investor_name.length > 14
                ? inv.investor_name.slice(0, 12) + "…"
                : inv.investor_name,
        fullName: inv.investor_name,
        deposited: Number(inv.total_deposited),
        withdrawn: Number(inv.total_withdrawn),
        balance: Number(inv.current_balance),
        unlocked: Number(inv.unlocked_amount),
        locked: Number(inv.locked_amount),
    }));

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                    Deposited
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
                    Withdrawn
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    Balance
                </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart
                    data={data}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                    barGap={2}
                    barSize={14}
                >
                    <CartesianGrid
                        strokeDasharray="3 6"
                        stroke="#f1f5f9"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={fmtShort}
                        width={48}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                                <ChartTooltipBox
                                    label={d.fullName}
                                    rows={[
                                        {
                                            name: "Deposited",
                                            value: fmtShort(d.deposited),
                                            color: "#f59e0b",
                                        },
                                        {
                                            name: "Withdrawn",
                                            value: fmtShort(d.withdrawn),
                                            color: "#f87171",
                                        },
                                        {
                                            name: "Balance",
                                            value: fmtShort(d.balance),
                                            color: "#10b981",
                                        },
                                    ]}
                                />
                            );
                        }}
                    />
                    <Bar
                        dataKey="deposited"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar
                        dataKey="withdrawn"
                        fill="#f87171"
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar
                        dataKey="balance"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Investor capital cards ────────────────────────────────────────────────────

function InvestorCapitalCards({ capitalSummary }: { capitalSummary: any[] }) {
    if (!capitalSummary?.length) {
        return (
            <p className="text-xs text-gray-400">No capital records found.</p>
        );
    }

    return (
        <div className="space-y-3">
            {capitalSummary.map((inv: any) => {
                const unlockPct =
                    inv.total_deposited > 0
                        ? Math.min(
                              100,
                              (inv.unlocked_amount / inv.total_deposited) * 100,
                          )
                        : 0;
                return (
                    <div
                        key={inv.id}
                        className="rounded-lg border border-gray-100 p-3 transition hover:border-amber-100 hover:bg-amber-50/20"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-800">
                                {inv.investor_name}
                            </p>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    inv.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                {inv.status}
                            </span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-[10px] text-gray-400">
                                    Deposited
                                </p>
                                <p className="text-xs font-semibold text-gray-700">
                                    {fmtShort(Number(inv.total_deposited))}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400">
                                    Balance
                                </p>
                                <p className="text-xs font-semibold text-gray-700">
                                    {fmtShort(Number(inv.current_balance))}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400">
                                    Withdrawn
                                </p>
                                <p className="text-xs font-semibold text-gray-700">
                                    {fmtShort(Number(inv.total_withdrawn))}
                                </p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <div className="mb-0.5 flex justify-between text-[10px] text-gray-400">
                                <span>Principal unlocked</span>
                                <span>{unlockPct.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                                    style={{ width: `${unlockPct}%` }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Partner balances ─────────────────────────────────────────────────────────

function PartnerBalanceList({ partnerBalances }: { partnerBalances: any[] }) {
    if (!partnerBalances?.length) {
        return (
            <p className="text-xs text-gray-400">No partner balances found.</p>
        );
    }

    const maxEarned = Math.max(
        ...partnerBalances.map((p: any) => Number(p.total_profit_earned)),
        1,
    );

    return (
        <div className="space-y-3">
            {partnerBalances.map((p: any) => {
                const earnedPct =
                    maxEarned > 0
                        ? (Number(p.total_profit_earned) / maxEarned) * 100
                        : 0;
                return (
                    <div key={p.id} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                                {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-xs font-medium text-gray-800">
                                        {p.name}
                                    </p>
                                    <span className="flex-shrink-0 text-[10px] text-gray-400">
                                        {p.code}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="ml-8 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-gray-400">Earned</span>
                                <span className="font-medium text-gray-700">
                                    {fmtShort(Number(p.total_profit_earned))}
                                </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                                    style={{ width: `${earnedPct}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-gray-400">Pending</span>
                                <span className="font-medium text-amber-600">
                                    {fmtShort(Number(p.pending_profit_balance))}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Distributions table ──────────────────────────────────────────────────────

function DistributionsTable({ list }: { list: any[] }) {
    if (!list?.length) {
        return (
            <p className="text-xs text-gray-400">
                No distributions in this period.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-gray-50 text-gray-400">
                        <th className="pb-2 text-left font-medium">No.</th>
                        <th className="pb-2 text-left font-medium">Title</th>
                        <th className="pb-2 text-left font-medium">Period</th>
                        <th className="pb-2 text-right font-medium">
                            Net Profit
                        </th>
                        <th className="pb-2 text-right font-medium">
                            Distributed
                        </th>
                        <th className="pb-2 text-center font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {list.map((d: any) => (
                        <tr key={d.id} className="hover:bg-gray-50">
                            <td className="py-2 font-medium text-indigo-600">
                                {d.distribution_no}
                            </td>
                            <td className="py-2 text-gray-700">{d.title}</td>
                            <td className="py-2 text-gray-400">
                                {d.period_start} → {d.period_end}
                            </td>
                            <td className="py-2 text-right font-medium text-gray-700">
                                {fmtShort(Number(d.net_profit))}
                            </td>
                            <td className="py-2 text-right font-medium text-gray-700">
                                {fmtShort(Number(d.distributable_amount))}
                            </td>
                            <td className="py-2 text-center">
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                        d.status === "distributed"
                                            ? "bg-green-100 text-green-700"
                                            : d.status === "approved"
                                              ? "bg-indigo-100 text-indigo-700"
                                              : "bg-gray-100 text-gray-600"
                                    }`}
                                >
                                    {d.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Main InvestmentsTab ──────────────────────────────────────────────────────

export default function InvestmentsTab({ data }: { data: any }) {
    const {
        kpis,
        capital_summary,
        distributions_list,
        partner_balances,
        profit_summary,
        distribution_trend,
    } = data;

    // Determine granularity from trend data labels
    const granularity: "daily" | "monthly" =
        distribution_trend?.length > 0 &&
        String(distribution_trend[0]?.label ?? "").length === 7
            ? "monthly"
            : "daily";

    return (
        <div className="space-y-5">
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard
                    label="Active Capital"
                    value={fmtShort(kpis.active_investment)}
                    sub={`${kpis.investor_count} investors`}
                    icon={TrendingUp}
                    iconColor="text-amber-600"
                    iconBg="bg-amber-50"
                />
                <KpiCard
                    label="Total Distributed"
                    value={fmtShort(kpis.total_distributed)}
                    sub="all time"
                    icon={Wallet}
                    iconColor="text-amber-600"
                    iconBg="bg-amber-50"
                />
                <KpiCard
                    label="Total Withdrawn"
                    value={fmtShort(kpis.total_withdrawn)}
                    sub="capital withdrawn"
                    icon={Landmark}
                    iconColor="text-amber-600"
                    iconBg="bg-amber-50"
                />
                <KpiCard
                    label="Partners"
                    value={Number(kpis.partner_count).toLocaleString()}
                    sub={`${kpis.pending_distributions} pending`}
                    icon={Users}
                    iconColor="text-amber-600"
                    iconBg="bg-amber-50"
                />
            </div>

            {/* Period profit summary pills */}
            {profit_summary && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {[
                        {
                            label: "Draft",
                            value: profit_summary.draft_count,
                            color: "text-gray-600",
                            bg: "bg-gray-50 border-gray-100",
                        },
                        {
                            label: "Approved",
                            value: profit_summary.approved_count,
                            color: "text-indigo-600",
                            bg: "bg-indigo-50 border-indigo-100",
                        },
                        {
                            label: "Distributed",
                            value: profit_summary.distributed_count,
                            color: "text-green-600",
                            bg: "bg-green-50 border-green-100",
                        },
                        {
                            label: "Net Profit",
                            value: fmtShort(profit_summary.total_net_profit),
                            color: "text-amber-600",
                            bg: "bg-amber-50 border-amber-100",
                        },
                        {
                            label: "Dist. Amount",
                            value: fmtShort(profit_summary.total_distributable),
                            color: "text-amber-600",
                            bg: "bg-amber-50 border-amber-100",
                        },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className={`rounded-xl border p-3 text-center ${s.bg}`}
                        >
                            <p className="text-[10px] font-medium text-gray-500">
                                {s.label}
                            </p>
                            <p className={`mt-1 text-lg font-bold ${s.color}`}>
                                {s.value}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Distribution trend + Capital comparison */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <SectionCard title="Distribution Trend">
                    <DistributionTrendChart
                        trend={distribution_trend ?? []}
                        granularity={granularity}
                    />
                </SectionCard>

                <SectionCard title="Capital: Deposited vs Withdrawn">
                    <CapitalComparisonChart
                        capitalSummary={capital_summary ?? []}
                    />
                </SectionCard>
            </div>

            {/* Investor cards + Partner balances */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <SectionCard
                    title="Investor Capital Overview"
                    action={
                        <Link
                            href={route("backend.capital-ledger.index")}
                            className="font-medium text-amber-600 hover:text-amber-800"
                        >
                            Ledger →
                        </Link>
                    }
                >
                    <InvestorCapitalCards
                        capitalSummary={capital_summary ?? []}
                    />
                </SectionCard>

                <SectionCard
                    title="Partner Profit Balances"
                    action={
                        <Link
                            href={route("backend.partners.index")}
                            className="font-medium text-amber-600 hover:text-amber-800"
                        >
                            All partners →
                        </Link>
                    }
                >
                    <PartnerBalanceList
                        partnerBalances={partner_balances ?? []}
                    />
                </SectionCard>
            </div>

            {/* Distributions table */}
            <SectionCard
                title="Distributions This Period"
                action={
                    <Link
                        href={route("backend.profit-distributions.index")}
                        className="font-medium text-amber-600 hover:text-amber-800"
                    >
                        View all →
                    </Link>
                }
            >
                <DistributionsTable list={distributions_list ?? []} />
            </SectionCard>
        </div>
    );
}
