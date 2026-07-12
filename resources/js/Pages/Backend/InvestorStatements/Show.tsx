import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    InvestorStatement,
    InvestorStatementCan,
} from "@/types/investor-statement";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Download } from "lucide-react";
import CapitalSummaryCard from "./_components/CapitalSummaryCard";
import CapitalTransactionTable from "./_components/CapitalTransactionTable";
import DistributionHistoryTable from "./_components/DistributionHistoryTable";
import ProfitSummaryCard from "./_components/ProfitSummaryCard";

interface Props {
    statement: InvestorStatement;
    can: InvestorStatementCan;
}

const StatusBadge = ({ status }: { status: "active" | "withdrawn" }) => (
    <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
        }`}
    >
        {status === "active" ? "Active" : "Withdrawn"}
    </span>
);

export default function InvestorStatementShow({ statement, can }: Props) {
    const {
        investment,
        capital_summary,
        profit_summary,
        distribution_history,
        capital_transactions,
    } = statement;

    return (
        <AuthenticatedLayout>
            <Head title={`Statement — ${investment.investor_name}`} />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <Link
                            href={route("backend.investor-statements.index")}
                            className="mt-1 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {investment.investor_name}
                                </h1>
                                <StatusBadge status={investment.status} />
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {investment.title}
                                {investment.investment_type && (
                                    <span className="ml-2 text-gray-400">
                                        · {investment.investment_type}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* PDF Export */}
                    {can.export && (
                        <a
                            href={route("backend.investor-statements.pdf", {
                                investment: investment.id,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Export PDF
                        </a>
                    )}
                </div>

                {/* Investment Information */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-3">
                        <h2 className="text-sm font-medium text-gray-700">
                            Investment Information
                        </h2>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                        <div>
                            <p className="text-xs text-gray-400">
                                Investment Title
                            </p>
                            <p className="mt-0.5 text-sm font-medium text-gray-800">
                                {investment.title}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">
                                Initial Amount
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-indigo-600">
                                ৳
                                {Number(investment.amount).toLocaleString(
                                    "en-BD",
                                    {
                                        minimumFractionDigits: 2,
                                    },
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">
                                Investment Date
                            </p>
                            <p className="mt-0.5 text-sm text-gray-700">
                                {investment.investment_date
                                    ? new Date(
                                          investment.investment_date,
                                      ).toLocaleDateString("en-BD", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                      })
                                    : "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Reference</p>
                            <p className="mt-0.5 text-sm text-gray-700">
                                {investment.reference ?? (
                                    <span className="text-gray-300">—</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Capital + Profit Summary Cards — side by side */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <CapitalSummaryCard summary={capital_summary} />
                    <ProfitSummaryCard summary={profit_summary} />
                </div>

                {/* Distribution History */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-gray-700">
                            Distribution History
                        </h2>
                        <span className="text-xs text-gray-400">
                            {distribution_history.length} record
                            {distribution_history.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                    <DistributionHistoryTable rows={distribution_history} />
                </div>

                {/* Capital Transaction History */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-gray-700">
                            Capital Transaction History
                        </h2>
                        <span className="text-xs text-gray-400">
                            {capital_transactions.length} record
                            {capital_transactions.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                    <CapitalTransactionTable rows={capital_transactions} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
