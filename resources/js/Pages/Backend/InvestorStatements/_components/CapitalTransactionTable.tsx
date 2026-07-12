import { StatementCapitalEntry } from "@/types/investor-statement";
import {
    CAPITAL_TX_COLORS,
    CAPITAL_TX_DIRECTION_COLORS,
} from "@/types/investor-statement-colors";
import { Landmark } from "lucide-react";

interface Props {
    rows: StatementCapitalEntry[];
}

const fmt = (amount: number) =>
    "৳" + Number(amount).toLocaleString("en-BD", { minimumFractionDigits: 2 });

const fmtDate = (date: string | null) =>
    date
        ? new Date(date).toLocaleDateString("en-BD", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "—";

const TransactionTypeBadge = ({
    type,
}: {
    type: StatementCapitalEntry["transaction_type"];
}) => (
    <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${CAPITAL_TX_COLORS[type]}`}
    >
        {type}
    </span>
);

const StatusBadge = ({
    status,
}: {
    status: StatementCapitalEntry["status"];
}) => {
    const map: Record<StatementCapitalEntry["status"], string> = {
        completed: "bg-green-100 text-green-700",
        pending: "bg-amber-100 text-amber-700",
        approved: "bg-blue-100 text-blue-700",
        rejected: "bg-red-100 text-red-700",
        cancelled: "bg-gray-100 text-gray-500",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}
        >
            {status}
        </span>
    );
};

export default function CapitalTransactionTable({ rows }: Props) {
    // Empty state
    if (rows.length === 0) {
        return (
            <div className="py-16 text-center">
                <Landmark className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400 font-medium">
                    No capital transactions found
                </p>
                <p className="mt-1 text-xs text-gray-300">
                    Deposits, withdrawals, reinvestments and adjustments will
                    appear here.
                </p>
            </div>
        );
    }

    // Footer totals — completed entries only
    const completedRows = rows.filter((r) => r.status === "completed");
    const totalCredit = completedRows
        .filter((r) => r.direction === "credit")
        .reduce((s, r) => s + Number(r.amount), 0);
    const totalDebit = completedRows
        .filter((r) => r.direction === "debit")
        .reduce((s, r) => s + Number(r.amount), 0);

    // Latest running balance from most recent completed entry
    const latestBalance =
        completedRows.length > 0
            ? Number(completedRows[0].running_balance)
            : null;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reference
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credit
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Debit
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Balance After
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reason / Note
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                    {rows.map((row) => (
                        <tr
                            key={row.id}
                            className={`hover:bg-gray-50 transition-colors ${
                                row.status === "cancelled" ||
                                row.status === "rejected"
                                    ? "opacity-50"
                                    : ""
                            }`}
                        >
                            {/* Date */}
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                {fmtDate(row.created_at)}
                            </td>

                            {/* Reference */}
                            <td className="px-4 py-3">
                                {row.reference_no ? (
                                    <span className="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                        {row.reference_no}
                                    </span>
                                ) : (
                                    <span className="text-gray-300 text-xs">
                                        —
                                    </span>
                                )}
                            </td>

                            {/* Type badge */}
                            <td className="px-4 py-3 text-center">
                                <TransactionTypeBadge
                                    type={row.transaction_type}
                                />
                            </td>

                            {/* Credit */}
                            <td className="px-4 py-3 text-right text-sm">
                                {row.direction === "credit" ? (
                                    <span
                                        className={`font-medium ${CAPITAL_TX_DIRECTION_COLORS["credit"]}`}
                                    >
                                        {fmt(row.amount)}
                                    </span>
                                ) : (
                                    <span className="text-gray-300">—</span>
                                )}
                            </td>

                            {/* Debit */}
                            <td className="px-4 py-3 text-right text-sm">
                                {row.direction === "debit" ? (
                                    <span
                                        className={`font-medium ${CAPITAL_TX_DIRECTION_COLORS["debit"]}`}
                                    >
                                        {fmt(row.amount)}
                                    </span>
                                ) : (
                                    <span className="text-gray-300">—</span>
                                )}
                            </td>

                            {/* Balance After — running_balance */}
                            <td className="px-4 py-3 text-right">
                                {row.status === "completed" ||
                                row.status === "approved" ? (
                                    <span className="text-sm font-semibold text-indigo-600">
                                        {fmt(row.running_balance)}
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-300 italic">
                                        pending
                                    </span>
                                )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3 text-center">
                                <StatusBadge status={row.status} />
                            </td>

                            {/* Reason / Note */}
                            <td className="px-4 py-3 max-w-[200px]">
                                {row.reason ? (
                                    <p
                                        className="text-xs text-gray-600 truncate"
                                        title={row.reason}
                                    >
                                        {row.reason}
                                    </p>
                                ) : row.note ? (
                                    <p
                                        className="text-xs text-gray-400 truncate italic"
                                        title={row.note}
                                    >
                                        {row.note}
                                    </p>
                                ) : (
                                    <span className="text-gray-300 text-xs">
                                        —
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>

                {/* Footer */}
                <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                        <td
                            colSpan={3}
                            className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                        >
                            Completed Totals ({completedRows.length} of{" "}
                            {rows.length})
                        </td>
                        {/* Total Credit */}
                        <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                            {totalCredit > 0 ? (
                                fmt(totalCredit)
                            ) : (
                                <span className="text-gray-300">—</span>
                            )}
                        </td>
                        {/* Total Debit */}
                        <td className="px-4 py-3 text-right text-sm font-semibold text-red-500">
                            {totalDebit > 0 ? (
                                fmt(totalDebit)
                            ) : (
                                <span className="text-gray-300">—</span>
                            )}
                        </td>
                        {/* Latest Balance */}
                        <td className="px-4 py-3 text-right text-sm font-bold text-indigo-700">
                            {latestBalance !== null ? (
                                fmt(latestBalance)
                            ) : (
                                <span className="text-gray-300">—</span>
                            )}
                        </td>
                        <td colSpan={2} />
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
