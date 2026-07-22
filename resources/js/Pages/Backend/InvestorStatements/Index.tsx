import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    InvestorStatementCan,
    InvestorStatementSummary,
} from "@/types/investor-statement";
import { Head, Link } from "@inertiajs/react";
import { FileText, TrendingUp, Wallet } from "lucide-react";

interface Props {
    investors: InvestorStatementSummary[];
    can: InvestorStatementCan;
}

const formatAmount = (amount: number) =>
    "৳" + Number(amount).toLocaleString("en-BD", { minimumFractionDigits: 2 });

const StatusBadge = ({ status }: { status: "active" | "withdrawn" }) => (
    <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
        }`}
    >
        {status === "active" ? "Active" : "Withdrawn"}
    </span>
);

const PartnerTypeBadge = () => (
    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
        Partner
    </span>
);

export default function InvestorStatementsIndex({ investors, can }: Props) {
    const statementUrl = (investor: InvestorStatementSummary): string => {
        if (investor.type === "partner") {
            return route("backend.investor-statements.partner.show", {
                partner: investor.id,
            });
        }
        return route("backend.investor-statements.show", {
            investment: investor.id,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Investor Statements" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Investor Statements
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Complete financial overview per investor &amp;
                            partner — capital &amp; profit summary
                        </p>
                    </div>
                    <span className="text-sm text-gray-400">
                        {investors.length} record
                        {investors.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Empty State */}
                {investors.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-white py-20 text-center">
                        <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">
                            No records found
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Add investments or partners to generate statements.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Initial Amount
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Capital Balance
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Total Earned
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Pending Profit
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {investors.map((investor) => {
                                    const isPartner =
                                        investor.type === "partner";

                                    return (
                                        <tr
                                            key={`${investor.type}-${investor.id}`}
                                            className="transition-colors hover:bg-gray-50"
                                        >
                                            {/* Name + subtitle */}
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-800">
                                                    {investor.investor_name}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-400">
                                                    {investor.title}
                                                </p>
                                            </td>

                                            {/* Type */}
                                            <td className="px-4 py-3">
                                                {isPartner ? (
                                                    <PartnerTypeBadge />
                                                ) : (
                                                    <span className="text-sm text-gray-600">
                                                        {investor.investment_type ?? (
                                                            <span className="text-gray-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Initial Amount */}
                                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                                                {isPartner ? (
                                                    <span className="text-gray-300">
                                                        —
                                                    </span>
                                                ) : (
                                                    formatAmount(
                                                        investor.amount,
                                                    )
                                                )}
                                            </td>

                                            {/* Capital Balance */}
                                            <td className="px-4 py-3 text-right">
                                                {isPartner ? (
                                                    <span className="text-gray-300">
                                                        —
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-semibold text-indigo-600">
                                                        {formatAmount(
                                                            investor.capital
                                                                .current_balance,
                                                        )}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Total Earned */}
                                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                                                {formatAmount(
                                                    investor.profit
                                                        .total_earned,
                                                )}
                                            </td>

                                            {/* Pending Profit */}
                                            <td className="px-4 py-3 text-right">
                                                <span
                                                    className={`text-sm font-medium ${
                                                        investor.profit
                                                            .pending_balance > 0
                                                            ? "text-amber-600"
                                                            : "text-gray-400"
                                                    }`}
                                                >
                                                    {formatAmount(
                                                        investor.profit
                                                            .pending_balance,
                                                    )}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge
                                                    status={investor.status}
                                                />
                                            </td>

                                            {/* Action */}
                                            <td className="px-4 py-3 text-center">
                                                {can.view && (
                                                    <Link
                                                        href={statementUrl(
                                                            investor,
                                                        )}
                                                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                                                    >
                                                        <FileText className="h-3.5 w-3.5" />
                                                        View Statement
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                            {/* Footer totals — capital columns blank for partner rows */}
                            <tfoot>
                                <tr className="border-t border-gray-200 bg-gray-50">
                                    <td
                                        colSpan={2}
                                        className="px-4 py-3 text-xs font-semibold uppercase text-gray-600"
                                    >
                                        Totals
                                    </td>
                                    {/* Initial Amount — investments only */}
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                        {formatAmount(
                                            investors
                                                .filter(
                                                    (i) =>
                                                        i.type === "investment",
                                                )
                                                .reduce(
                                                    (s, i) =>
                                                        s + Number(i.amount),
                                                    0,
                                                ),
                                        )}
                                    </td>
                                    {/* Capital Balance — investments only */}
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-600">
                                        {formatAmount(
                                            investors
                                                .filter(
                                                    (i) =>
                                                        i.type === "investment",
                                                )
                                                .reduce(
                                                    (s, i) =>
                                                        s +
                                                        Number(
                                                            i.capital
                                                                .current_balance,
                                                        ),
                                                    0,
                                                ),
                                        )}
                                    </td>
                                    {/* Total Earned — all rows */}
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                        {formatAmount(
                                            investors.reduce(
                                                (s, i) =>
                                                    s +
                                                    Number(
                                                        i.profit.total_earned,
                                                    ),
                                                0,
                                            ),
                                        )}
                                    </td>
                                    {/* Pending Profit — all rows */}
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-amber-600">
                                        {formatAmount(
                                            investors.reduce(
                                                (s, i) =>
                                                    s +
                                                    Number(
                                                        i.profit
                                                            .pending_balance,
                                                    ),
                                                0,
                                            ),
                                        )}
                                    </td>
                                    <td colSpan={2} />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-6 rounded-lg border border-gray-200 bg-white px-5 py-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Wallet className="h-3.5 w-3.5 text-indigo-500" />
                        Capital Balance = current investable capital
                        (investment-based only)
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                        Pending Profit = earned but not yet paid out
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
