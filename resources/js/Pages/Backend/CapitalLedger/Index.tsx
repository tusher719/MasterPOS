// resources/js/Pages/Backend/CapitalLedger/Index.tsx

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import {
    AlertCircle,
    Building2,
    Eye,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";

interface CapitalBalance {
    id: number;
    investment_id: number;
    investor_name: string;
    investment_date: string | null;
    investment_status: string | null;
    total_deposited: string;
    total_withdrawn: string;
    total_reinvested: string;
    total_adjusted: string;
    current_balance: string;
}

interface Props {
    balances: {
        data: CapitalBalance[];
        meta: any;
        links: any[];
    };
    pendingWithdrawalsCount: number;
    can: {
        view: boolean;
        deposit: boolean;
        adjust: boolean;
        request_withdrawal: boolean;
        approve_withdrawal: boolean;
    };
}

const fmt = (val: string | number) =>
    "৳ " + Number(val).toLocaleString("en-BD", { minimumFractionDigits: 2 });

export default function CapitalLedgerIndex({
    balances,
    pendingWithdrawalsCount,
    can,
}: Props) {
    const { data, meta, links } = {
        data: balances?.data ?? [],
        meta: balances?.meta ?? {},
        links: balances?.links ?? [],
    };

    const totalCapital = data.reduce(
        (sum, b) => sum + Number(b.current_balance),
        0,
    );
    const totalDeposited = data.reduce(
        (sum, b) => sum + Number(b.total_deposited),
        0,
    );
    const totalWithdrawn = data.reduce(
        (sum, b) => sum + Number(b.total_withdrawn),
        0,
    );
    const totalReinvested = data.reduce(
        (sum, b) => sum + Number(b.total_reinvested),
        0,
    );

    return (
        <AuthenticatedLayout>
            <Head title="Capital Ledger" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Capital Ledger
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Track investor capital — deposits, withdrawals, and
                            reinvestments.
                        </p>
                    </div>

                    {/* Pending withdrawal alert */}
                    {pendingWithdrawalsCount > 0 && can.approve_withdrawal && (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                            <AlertCircle className="h-4 w-4" />
                            {pendingWithdrawalsCount} pending withdrawal
                            {pendingWithdrawalsCount > 1 ? "s" : ""} awaiting
                            approval
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-indigo-50 p-2">
                                <Wallet className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">
                                    Total Capital
                                </p>
                                <p className="text-lg font-bold text-gray-800">
                                    {fmt(totalCapital)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-50 p-2">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">
                                    Total Deposited
                                </p>
                                <p className="text-lg font-bold text-gray-800">
                                    {fmt(totalDeposited)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-red-50 p-2">
                                <TrendingDown className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">
                                    Total Withdrawn
                                </p>
                                <p className="text-lg font-bold text-gray-800">
                                    {fmt(totalWithdrawn)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-50 p-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">
                                    Total Reinvested
                                </p>
                                <p className="text-lg font-bold text-gray-800">
                                    {fmt(totalReinvested)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            Investor Capital Summary
                        </span>
                        <span className="text-xs text-gray-400">
                            {meta?.total ?? data.length} investor(s)
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        #
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Investor
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Deposited
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Withdrawn
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Reinvested
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Adjusted
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Current Balance
                                    </th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-4 py-10 text-center text-gray-400"
                                        >
                                            No capital records found.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((b, i) => (
                                        <tr
                                            key={b.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 text-gray-400">
                                                {(meta?.from ?? 1) + i}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800">
                                                    {b.investor_name}
                                                </div>
                                                {b.investment_date && (
                                                    <div className="text-xs text-gray-400">
                                                        Since{" "}
                                                        {b.investment_date}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        b.investment_status ===
                                                        "active"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-100 text-gray-500"
                                                    }`}
                                                >
                                                    {b.investment_status ?? "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-green-700">
                                                {fmt(b.total_deposited)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-red-500">
                                                {fmt(b.total_withdrawn)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-blue-600">
                                                {fmt(b.total_reinvested)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600">
                                                {fmt(b.total_adjusted)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                                                {fmt(b.current_balance)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() =>
                                                        router.visit(
                                                            route(
                                                                "backend.capital-ledger.show",
                                                                {
                                                                    investmentId:
                                                                        b.investment_id,
                                                                },
                                                            ),
                                                        )
                                                    }
                                                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                                                    title="View Ledger"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {links.length > 3 && (
                        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                Showing {meta?.from ?? 1}–
                                {meta?.to ?? data.length} of{" "}
                                {meta?.total ?? data.length}
                            </p>
                            <div className="flex gap-1">
                                {links.map((link: any, i: number) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.visit(link.url)
                                        }
                                        className={`rounded px-3 py-1 text-xs ${
                                            link.active
                                                ? "bg-indigo-600 text-white"
                                                : "text-gray-500 hover:bg-gray-100 disabled:opacity-40"
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
