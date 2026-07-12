import { StatementDistributionItem } from "@/types/investor-statement";
import { PAYMENT_STATUS_COLORS } from "@/types/investor-statement-colors";
import { FileText } from "lucide-react";

interface Props {
    rows: StatementDistributionItem[];
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

const PaymentStatusBadge = ({
    status,
}: {
    status: StatementDistributionItem["payment_status"];
}) => (
    <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PAYMENT_STATUS_COLORS[status]}`}
    >
        {status}
    </span>
);

const DistributionStatusBadge = ({
    status,
}: {
    status: "approved" | "distributed";
}) => (
    <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            status === "distributed"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
        }`}
    >
        {status === "distributed" ? "Distributed" : "Approved"}
    </span>
);

export default function DistributionHistoryTable({ rows }: Props) {
    // Empty state
    if (rows.length === 0) {
        return (
            <div className="py-16 text-center">
                <FileText className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400 font-medium">
                    No distribution records found
                </p>
                <p className="mt-1 text-xs text-gray-300">
                    This investor has not been included in any approved
                    distribution yet.
                </p>
            </div>
        );
    }

    // Footer totals
    const totalShareAmount = rows.reduce(
        (s, r) => s + Number(r.share_amount),
        0,
    );
    const totalDeferred = rows.reduce(
        (s, r) => s + Number(r.deferred_amount),
        0,
    );
    const totalReinvested = rows.reduce(
        (s, r) => s + Number(r.reinvested_amount),
        0,
    );

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Distribution
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Period
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dist. Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Share %
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Share Amount
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Deferred
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reinvested
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Status
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                    {rows.map((row) => (
                        <tr
                            key={row.id}
                            className="hover:bg-gray-50 transition-colors"
                        >
                            {/* Distribution No + Title + Date */}
                            <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-800">
                                    {row.distribution_no ?? "—"}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {row.title ?? "—"}
                                </p>
                                <p className="text-xs text-gray-300 mt-0.5">
                                    {fmtDate(row.distribution_date)}
                                </p>
                            </td>

                            {/* Period */}
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                <span>{fmtDate(row.period_start)}</span>
                                <span className="mx-1 text-gray-300">→</span>
                                <span>{fmtDate(row.period_end)}</span>
                            </td>

                            {/* Distribution Status */}
                            <td className="px-4 py-3 text-center">
                                {row.distribution_status ? (
                                    <DistributionStatusBadge
                                        status={row.distribution_status}
                                    />
                                ) : (
                                    <span className="text-gray-300 text-xs">
                                        —
                                    </span>
                                )}
                            </td>

                            {/* Share % */}
                            <td className="px-4 py-3 text-right text-sm text-gray-600">
                                {Number(row.share_percent).toFixed(2)}%
                            </td>

                            {/* Share Amount */}
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                                {fmt(row.share_amount)}
                            </td>

                            {/* Deferred */}
                            <td className="px-4 py-3 text-right text-sm">
                                {Number(row.deferred_amount) > 0 ? (
                                    <span className="text-purple-600">
                                        {fmt(row.deferred_amount)}
                                    </span>
                                ) : (
                                    <span className="text-gray-300">—</span>
                                )}
                            </td>

                            {/* Reinvested */}
                            <td className="px-4 py-3 text-right text-sm">
                                {Number(row.reinvested_amount) > 0 ? (
                                    <span className="text-indigo-600">
                                        {fmt(row.reinvested_amount)}
                                    </span>
                                ) : (
                                    <span className="text-gray-300">—</span>
                                )}
                            </td>

                            {/* Payment Status */}
                            <td className="px-4 py-3 text-center">
                                <PaymentStatusBadge
                                    status={row.payment_status}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>

                {/* Footer totals */}
                <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                        <td
                            colSpan={4}
                            className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                        >
                            Totals ({rows.length} distribution
                            {rows.length !== 1 ? "s" : ""})
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">
                            {fmt(totalShareAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-purple-600">
                            {totalDeferred > 0 ? (
                                fmt(totalDeferred)
                            ) : (
                                <span className="text-gray-300">—</span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-600">
                            {totalReinvested > 0 ? (
                                fmt(totalReinvested)
                            ) : (
                                <span className="text-gray-300">—</span>
                            )}
                        </td>
                        <td />
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
