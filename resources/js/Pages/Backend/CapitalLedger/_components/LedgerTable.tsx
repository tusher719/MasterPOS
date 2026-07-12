// resources/js/Pages/Backend/CapitalLedger/_components/LedgerTable.tsx

import { router } from "@inertiajs/react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    RefreshCw,
    SlidersHorizontal,
} from "lucide-react";

interface LedgerEntry {
    id: number;
    transaction_type: "deposit" | "withdrawal" | "reinvestment" | "adjustment";
    direction: "credit" | "debit";
    amount: string;
    running_balance: string;
    reference_no: string | null;
    reason: string | null;
    note: string | null;
    status: string;
    created_at: string;
    created_by: { id: number; name: string } | null;
    approved_by: { id: number; name: string } | null;
    approved_at: string | null;
}

interface Props {
    entries: {
        data: LedgerEntry[];
        meta: any;
        links: any[];
    };
}

const fmt = (val: string | number) =>
    "৳ " + Number(val).toLocaleString("en-BD", { minimumFractionDigits: 2 });

const TYPE_CONFIG = {
    deposit: {
        label: "Deposit",
        icon: <ArrowUpRight className="h-3.5 w-3.5" />,
        color: "bg-green-100 text-green-700",
    },
    withdrawal: {
        label: "Withdrawal",
        icon: <ArrowDownLeft className="h-3.5 w-3.5" />,
        color: "bg-red-100 text-red-600",
    },
    reinvestment: {
        label: "Reinvestment",
        icon: <RefreshCw className="h-3.5 w-3.5" />,
        color: "bg-blue-100 text-blue-600",
    },
    adjustment: {
        label: "Adjustment",
        icon: <SlidersHorizontal className="h-3.5 w-3.5" />,
        color: "bg-gray-100 text-gray-600",
    },
};

const STATUS_COLOR: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-500",
    cancelled: "bg-gray-100 text-gray-400",
};

export default function LedgerTable({ entries }: Props) {
    const { data, meta, links } = {
        data: entries?.data ?? [],
        meta: entries?.meta ?? {},
        links: entries?.links ?? [],
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                    Transaction History
                </span>
                <span className="text-xs text-gray-400">
                    {meta?.total ?? data.length} entries
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Date
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Reference
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Type
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Status
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                Amount
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                Balance After
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Details
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-10 text-center text-gray-400"
                                >
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            data.map((entry) => {
                                const typeConf =
                                    TYPE_CONFIG[entry.transaction_type];
                                const isCredit = entry.direction === "credit";

                                return (
                                    <tr
                                        key={entry.id}
                                        className="hover:bg-gray-50"
                                    >
                                        {/* Date */}
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                            {new Date(
                                                entry.created_at,
                                            ).toLocaleDateString("en-BD")}
                                        </td>

                                        {/* Reference */}
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                            {entry.reference_no ?? "—"}
                                        </td>

                                        {/* Type badge */}
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeConf.color}`}
                                            >
                                                {typeConf.icon}
                                                {typeConf.label}
                                            </span>
                                        </td>

                                        {/* Status badge */}
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[entry.status] ?? "bg-gray-100 text-gray-500"}`}
                                            >
                                                {entry.status
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    entry.status.slice(1)}
                                            </span>
                                        </td>

                                        {/* Amount */}
                                        <td
                                            className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                                                isCredit
                                                    ? "text-green-700"
                                                    : "text-red-500"
                                            }`}
                                        >
                                            {isCredit ? "+" : "−"}{" "}
                                            {fmt(entry.amount)}
                                        </td>

                                        {/* Running balance */}
                                        <td className="px-4 py-3 text-right text-gray-700 font-semibold whitespace-nowrap">
                                            {entry.status === "pending" ? (
                                                <span className="text-amber-500 text-xs">
                                                    Pending
                                                </span>
                                            ) : (
                                                fmt(entry.running_balance)
                                            )}
                                        </td>

                                        {/* Details */}
                                        <td className="px-4 py-3 max-w-xs">
                                            {entry.reason && (
                                                <p
                                                    className="text-xs text-gray-600 truncate"
                                                    title={entry.reason}
                                                >
                                                    <span className="font-medium">
                                                        Reason:
                                                    </span>{" "}
                                                    {entry.reason}
                                                </p>
                                            )}
                                            {entry.note && (
                                                <p
                                                    className="text-xs text-gray-400 truncate"
                                                    title={entry.note}
                                                >
                                                    {entry.note}
                                                </p>
                                            )}
                                            {entry.approved_by && (
                                                <p className="text-xs text-gray-400">
                                                    Approved by{" "}
                                                    {entry.approved_by.name}
                                                </p>
                                            )}
                                            {entry.created_by && (
                                                <p className="text-xs text-gray-400">
                                                    By {entry.created_by.name}
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {links.length > 3 && (
                <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        Showing {meta?.from ?? 1}–{meta?.to ?? data.length} of{" "}
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
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
