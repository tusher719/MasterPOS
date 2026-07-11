import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import type {
    DistributionItem,
    InvestorBalance,
    Paginated,
    PaymentSummary,
} from "@/types/profit-distribution";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    BarChart3,
    ChevronRight,
    Clock,
    ExternalLink,
    GitBranch,
    RefreshCw,
    TrendingUp,
    Wallet,
} from "lucide-react";
import { useState } from "react";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface Investment {
    id: number;
    investor_name: string;
    title: string;
    amount: number;
    investment_date: string;
    status: string;
}

interface Props {
    investment: Investment;
    balance: InvestorBalance & { roi: number; has_pending: boolean };
    items: Paginated<
        DistributionItem & {
            distribution_no: string;
            distribution_title: string;
            distribution_status: string;
            period_start: string;
            period_end: string;
            distribution_date: string;
        }
    >;
    payment_summary: PaymentSummary;
    can: { view: boolean };
}

const STATUS_BADGE: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    partial: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    deferred: "bg-purple-100 text-purple-700",
    reinvested: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-red-100 text-red-700",
    reopened: "bg-yellow-100 text-yellow-700",
};

const DIST_STATUS_BADGE: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    approved: "bg-amber-100 text-amber-700",
    distributed: "bg-green-100 text-green-700",
};

export default function InvestorBalancesShow({
    investment,
    balance,
    items,
    payment_summary,
}: Props) {
    const [expandedItem, setExpandedItem] = useState<number | null>(null);

    const data = items.data ?? [];
    const meta = items.meta ?? {};
    const links = items.links ?? [];

    // Build simple chart data from distribution items
    const chartData = [...data].reverse().map((item) => ({
        period: item.period_start ?? "",
        earned: item.effective_amount,
        paid: item.total_paid,
        remaining: item.remaining_amount,
    }));

    return (
        <AuthenticatedLayout>
            <Head title={`${investment.investor_name} — Profit Ledger`} />

            <div className="space-y-6 p-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("backend.investor-balances.index")}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {investment.investor_name}
                            </h1>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {investment.title} · Since{" "}
                                {investment.investment_date}
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route("backend.investments.show", investment.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <ExternalLink size={14} />
                        View Investment
                    </Link>
                </div>

                {/* Balance Summary Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                    {[
                        {
                            label: "Capital Invested",
                            value: investment.amount,
                            color: "border-gray-400",
                            tcolor: "text-gray-800",
                            icon: Wallet,
                        },
                        {
                            label: "Total Earned",
                            value: balance.total_earned,
                            color: "border-green-500",
                            tcolor: "text-green-600",
                            icon: TrendingUp,
                        },
                        {
                            label: "Total Paid",
                            value: balance.total_paid,
                            color: "border-blue-500",
                            tcolor: "text-blue-600",
                            icon: Wallet,
                        },
                        {
                            label: "Deferred",
                            value: balance.total_deferred,
                            color: "border-purple-500",
                            tcolor: "text-purple-600",
                            icon: Clock,
                        },
                        {
                            label: "Reinvested",
                            value: balance.total_reinvested,
                            color: "border-indigo-500",
                            tcolor: "text-indigo-600",
                            icon: RefreshCw,
                        },
                        {
                            label: "Pending Balance",
                            value: balance.pending_balance,
                            color: "border-amber-500",
                            tcolor:
                                Number(balance.pending_balance) > 0
                                    ? "text-amber-600"
                                    : "text-gray-400",
                            icon: BarChart3,
                        },
                    ].map(({ label, value, color, tcolor, icon: Icon }) => (
                        <div
                            key={label}
                            className={`rounded-lg border border-gray-200 bg-white p-4 border-l-4 ${color}`}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">{label}</p>
                                <Icon size={14} className="text-gray-400" />
                            </div>
                            <p className={`mt-1 text-base font-bold ${tcolor}`}>
                                ৳
                                {Number(value).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ROI + Payment Summary Row */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* ROI Card */}
                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-green-500" />
                            <h3 className="text-sm font-medium text-gray-700">
                                Return on Investment
                            </h3>
                        </div>
                        <p className="mt-3 text-4xl font-bold text-green-600">
                            {balance.roi?.toFixed(2) ?? "0.00"}%
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Cumulative ROI based on total earned vs capital
                            invested
                        </p>
                    </div>

                    {/* Payment Summary */}
                    <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-gray-100 px-5 py-3">
                            <h3 className="text-sm font-medium text-gray-700">
                                Payment Summary by Status
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-y divide-gray-50 sm:grid-cols-4">
                            {Object.entries(payment_summary).map(
                                ([status, entry]) => (
                                    <div key={status} className="p-4">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status] ?? "bg-gray-100 text-gray-600"}`}
                                        >
                                            {entry.label}
                                        </span>
                                        <p className="mt-2 text-base font-semibold text-gray-800">
                                            ৳{Number(entry.total).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {entry.count} transaction
                                            {entry.count !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                ),
                            )}
                            {Object.keys(payment_summary).length === 0 && (
                                <div className="col-span-4 px-5 py-8 text-center text-sm text-gray-400">
                                    No payment transactions yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Earnings Chart */}
                {chartData.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-gray-100 px-5 py-3">
                            <h3 className="text-sm font-medium text-gray-700">
                                Earnings per Distribution Period
                            </h3>
                        </div>
                        <div className="p-5">
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient
                                            id="earnedGrad"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#22c55e"
                                                stopOpacity={0.15}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#22c55e"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="paidGrad"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0.15}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `৳${v}`}
                                    />
                                    <Tooltip
                                        formatter={(value, name) => [
                                            `৳${Number(value).toFixed(2)}`,
                                            name === "earned"
                                                ? "Earned"
                                                : "Paid",
                                        ]}
                                        contentStyle={{
                                            fontSize: 12,
                                            borderRadius: 8,
                                            border: "1px solid #e5e7eb",
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="earned"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        fill="url(#earnedGrad)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="paid"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fill="url(#paidGrad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="mt-2 flex items-center justify-center gap-6">
                                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                    Earned
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                    Paid
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Distribution Items Table */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-3">
                        <h3 className="text-sm font-medium text-gray-700">
                            Distribution History
                        </h3>
                    </div>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                                    Distribution
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                                    Period
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                                    Share %
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                                    Effective
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                                    Paid
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                                    Remaining
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                                    Status
                                </th>
                                <th className="px-5 py-3 text-xs font-medium text-gray-500"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-5 py-12 text-center text-sm text-gray-400"
                                    >
                                        No distribution history found.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <>
                                        <tr
                                            key={item.id}
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() =>
                                                setExpandedItem(
                                                    expandedItem === item.id
                                                        ? null
                                                        : item.id,
                                                )
                                            }
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={route(
                                                            "backend.profit-distributions.show",
                                                            {
                                                                profit_distribution:
                                                                    item.profit_distribution_id,
                                                            },
                                                        )}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className="font-medium text-indigo-600 hover:underline"
                                                    >
                                                        {item.distribution_no}
                                                    </Link>
                                                    <span
                                                        className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${DIST_STATUS_BADGE[item.distribution_status] ?? "bg-gray-100 text-gray-500"}`}
                                                    >
                                                        {
                                                            item.distribution_status
                                                        }
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {item.distribution_title}
                                                </p>
                                                {item.is_carried_forward && (
                                                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-purple-600">
                                                        <GitBranch size={10} />
                                                        Carried from{" "}
                                                        {item.carried_from_no}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-xs text-gray-500">
                                                <div>{item.period_start}</div>
                                                <div className="text-gray-400">
                                                    to {item.period_end}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-right text-xs text-gray-600">
                                                {Number(
                                                    item.share_percent,
                                                ).toFixed(4)}
                                                %
                                                {Number(
                                                    item.distribution_percent,
                                                ) !== 100 && (
                                                    <div className="text-[10px] text-purple-500">
                                                        dist.{" "}
                                                        {
                                                            item.distribution_percent
                                                        }
                                                        %
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-800">
                                                ৳
                                                {Number(
                                                    item.effective_amount,
                                                ).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3 text-right text-green-600">
                                                ৳
                                                {Number(
                                                    item.total_paid,
                                                ).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span
                                                    className={
                                                        Number(
                                                            item.remaining_amount,
                                                        ) > 0
                                                            ? "text-amber-600 font-medium"
                                                            : "text-gray-400"
                                                    }
                                                >
                                                    ৳
                                                    {Number(
                                                        item.remaining_amount,
                                                    ).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[item.payment_status] ?? "bg-gray-100 text-gray-500"}`}
                                                >
                                                    {item.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-400">
                                                <ChevronRight
                                                    size={14}
                                                    className={`transition-transform ${expandedItem === item.id ? "rotate-90" : ""}`}
                                                />
                                            </td>
                                        </tr>

                                        {/* Expanded Payment Transactions */}
                                        {expandedItem === item.id && (
                                            <tr key={`${item.id}-expanded`}>
                                                <td
                                                    colSpan={8}
                                                    className="bg-gray-50 px-8 py-3"
                                                >
                                                    {!item.payments ||
                                                    item.payments.length ===
                                                        0 ? (
                                                        <p className="text-xs text-gray-400 py-2">
                                                            No payment
                                                            transactions
                                                            recorded.
                                                        </p>
                                                    ) : (
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-gray-400">
                                                                    <th className="py-1.5 text-left font-medium">
                                                                        Amount
                                                                    </th>
                                                                    <th className="py-1.5 text-left font-medium">
                                                                        Status
                                                                    </th>
                                                                    <th className="py-1.5 text-left font-medium">
                                                                        Method
                                                                    </th>
                                                                    <th className="py-1.5 text-left font-medium">
                                                                        Reference
                                                                    </th>
                                                                    <th className="py-1.5 text-left font-medium">
                                                                        By
                                                                    </th>
                                                                    <th className="py-1.5 text-left font-medium">
                                                                        At
                                                                    </th>
                                                                    <th className="py-1.5 text-left font-medium">
                                                                        Note
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {item.payments!.map(
                                                                    (p) => (
                                                                        <tr
                                                                            key={
                                                                                p.id
                                                                            }
                                                                            className="text-gray-600"
                                                                        >
                                                                            <td className="py-1.5 font-medium text-gray-800">
                                                                                ৳
                                                                                {Number(
                                                                                    p.amount,
                                                                                ).toFixed(
                                                                                    2,
                                                                                )}
                                                                            </td>
                                                                            <td className="py-1.5">
                                                                                <span
                                                                                    className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_BADGE[p.payment_status] ?? "bg-gray-100 text-gray-500"}`}
                                                                                >
                                                                                    {
                                                                                        p.payment_status_label
                                                                                    }
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-1.5">
                                                                                {p.payment_method ??
                                                                                    "—"}
                                                                            </td>
                                                                            <td className="py-1.5">
                                                                                {p.transaction_reference ??
                                                                                    "—"}
                                                                            </td>
                                                                            <td className="py-1.5">
                                                                                {p.paid_by_name ??
                                                                                    "—"}
                                                                            </td>
                                                                            <td className="py-1.5">
                                                                                {p.paid_at ??
                                                                                    "—"}
                                                                            </td>
                                                                            <td className="py-1.5">
                                                                                {p.note ??
                                                                                    "—"}
                                                                            </td>
                                                                        </tr>
                                                                    ),
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {(meta.last_page ?? 1) > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                            <p className="text-xs text-gray-500">
                                Showing {meta.from ?? 0}–{meta.to ?? 0} of{" "}
                                {meta.total ?? 0}
                            </p>
                            <div className="flex gap-1">
                                {links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? "#"}
                                        className={`rounded-md px-3 py-1.5 text-xs ${
                                            link.active
                                                ? "bg-indigo-600 text-white"
                                                : link.url
                                                  ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                                  : "cursor-not-allowed border border-gray-100 text-gray-300"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
