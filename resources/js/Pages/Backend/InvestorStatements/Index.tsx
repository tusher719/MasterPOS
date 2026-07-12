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

export default function InvestorStatementsIndex({ investors, can }: Props) {
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
                            Complete financial overview per investor — capital
                            &amp; profit summary
                        </p>
                    </div>
                    <span className="text-sm text-gray-400">
                        {investors.length} investor
                        {investors.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Empty State */}
                {investors.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-white py-20 text-center">
                        <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">
                            No investors found
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Add investments to generate statements.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Investor
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Initial Amount
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Capital Balance
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Earned
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Pending Profit
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {investors.map((investor) => (
                                    <tr
                                        key={investor.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Investor Name + Title */}
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-gray-800">
                                                {investor.investor_name}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {investor.title}
                                            </p>
                                        </td>

                                        {/* Investment Type */}
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {investor.investment_type ?? (
                                                <span className="text-gray-300">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        {/* Initial Amount */}
                                        <td className="px-4 py-3 text-right text-sm text-gray-700">
                                            {formatAmount(investor.amount)}
                                        </td>

                                        {/* Capital Balance */}
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-semibold text-indigo-600">
                                                {formatAmount(
                                                    investor.capital
                                                        .current_balance,
                                                )}
                                            </span>
                                        </td>

                                        {/* Total Earned */}
                                        <td className="px-4 py-3 text-right text-sm text-gray-700">
                                            {formatAmount(
                                                investor.profit.total_earned,
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
                                                    href={route(
                                                        "backend.investor-statements.show",
                                                        {
                                                            investment:
                                                                investor.id,
                                                        },
                                                    )}
                                                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                    View Statement
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                            {/* Footer totals */}
                            <tfoot>
                                <tr className="bg-gray-50 border-t border-gray-200">
                                    <td
                                        colSpan={2}
                                        className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase"
                                    >
                                        Totals
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                        {formatAmount(
                                            investors.reduce(
                                                (s, i) => s + Number(i.amount),
                                                0,
                                            ),
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-600">
                                        {formatAmount(
                                            investors.reduce(
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
