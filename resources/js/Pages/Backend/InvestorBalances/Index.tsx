import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import type {
    InvestorBalance,
    InvestorBalanceStats,
    Paginated,
} from "@/types/profit-distribution";
import { Head, Link, router } from "@inertiajs/react";
import {
    Clock,
    Eye,
    RefreshCw,
    Search,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react";
import { useState } from "react";

interface Props {
    balances: Paginated<InvestorBalance>;
    stats: InvestorBalanceStats;
    filters: { search?: string };
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

export default function InvestorBalancesIndex({
    balances,
    stats,
    filters,
    can,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? "");

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(
            route("backend.investor-balances.index"),
            { search: search || undefined },
            { preserveState: true, replace: true },
        );
    }

    function handleSearchClear() {
        setSearch("");
        router.get(
            route("backend.investor-balances.index"),
            {},
            { preserveState: true, replace: true },
        );
    }

    const data = balances.data ?? [];
    const meta = balances.meta ?? {};

    return (
        <AuthenticatedLayout>
            <Head title="Investor Profit Balances" />

            <div className="space-y-6 p-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Investor Profit Balances
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Running profit ledger for all investors
                        </p>
                    </div>
                    <Link
                        href={route("backend.profit-distributions.index")}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        ← Distributions
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    {[
                        {
                            label: "Total Investors",
                            value: stats.investor_count,
                            icon: Users,
                            color: "border-indigo-500",
                            fmt: false,
                        },
                        {
                            label: "Total Earned",
                            value: stats.total_earned,
                            icon: TrendingUp,
                            color: "border-green-500",
                            fmt: true,
                        },
                        {
                            label: "Total Paid",
                            value: stats.total_paid,
                            icon: Wallet,
                            color: "border-blue-500",
                            fmt: true,
                        },
                        {
                            label: "Total Deferred",
                            value: stats.total_deferred,
                            icon: Clock,
                            color: "border-purple-500",
                            fmt: true,
                        },
                        {
                            label: "Pending Balance",
                            value: stats.total_pending,
                            icon: RefreshCw,
                            color: "border-amber-500",
                            fmt: true,
                        },
                    ].map(({ label, value, icon: Icon, color, fmt }) => (
                        <div
                            key={label}
                            className={`rounded-lg border border-gray-200 bg-white p-4 border-l-4 ${color}`}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">{label}</p>
                                <Icon size={16} className="text-gray-400" />
                            </div>
                            <p className="mt-1 text-lg font-bold text-gray-800">
                                {fmt
                                    ? `৳${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                                    : value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by investor name..."
                                className="w-full rounded-md border-gray-300 pl-9 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                        >
                            Search
                        </button>
                        {filters.search && (
                            <button
                                type="button"
                                onClick={handleSearchClear}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Clear
                            </button>
                        )}
                    </form>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                                    #
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                                    Investor
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                                    Capital Invested
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                                    Total Earned
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                                    Total Paid
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                                    Deferred
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                                    Reinvested
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                                    Pending Balance
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                                    ROI %
                                </th>
                                <th className="px-5 py-3 text-xs font-medium text-gray-500"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={10}
                                        className="px-5 py-12 text-center text-sm text-gray-400"
                                    >
                                        No investor balances found.
                                    </td>
                                </tr>
                            ) : (
                                data.map((balance, idx) => {
                                    const invested =
                                        balance.investment?.amount ?? 0;
                                    const roi =
                                        invested > 0
                                            ? (
                                                  (balance.total_earned /
                                                      invested) *
                                                  100
                                              ).toFixed(2)
                                            : "0.00";

                                    return (
                                        <tr
                                            key={balance.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-5 py-3 text-xs text-gray-400">
                                                {(meta.from ?? 0) + idx}
                                            </td>
                                            <td className="px-5 py-3">
                                                <p className="font-medium text-gray-800">
                                                    {balance.investor_name}
                                                </p>
                                                {balance.investment && (
                                                    <p className="text-xs text-gray-400">
                                                        Since{" "}
                                                        {
                                                            balance.investment
                                                                .investment_date
                                                        }
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-700">
                                                ৳{Number(invested).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3 text-right font-medium text-green-600">
                                                ৳
                                                {Number(
                                                    balance.total_earned,
                                                ).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3 text-right text-blue-600">
                                                ৳
                                                {Number(
                                                    balance.total_paid,
                                                ).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3 text-right text-purple-600">
                                                ৳
                                                {Number(
                                                    balance.total_deferred,
                                                ).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3 text-right text-indigo-600">
                                                ৳
                                                {Number(
                                                    balance.total_reinvested,
                                                ).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span
                                                    className={`font-semibold ${Number(balance.pending_balance) > 0 ? "text-amber-600" : "text-gray-400"}`}
                                                >
                                                    ৳
                                                    {Number(
                                                        balance.pending_balance,
                                                    ).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span
                                                    className={`text-xs font-medium ${Number(roi) > 0 ? "text-green-600" : "text-gray-400"}`}
                                                >
                                                    {roi}%
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <Link
                                                    href={route(
                                                        "backend.investor-balances.show",
                                                        balance.investment_id,
                                                    )}
                                                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 inline-flex"
                                                    title="View Ledger"
                                                >
                                                    <Eye size={15} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
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
                                {(balances.links ?? []).map((link, i) => (
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
