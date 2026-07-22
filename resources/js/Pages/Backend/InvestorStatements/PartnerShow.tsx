import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    InvestorStatementCan,
    PartnerStatement,
    PartnerStatementDistributionItem,
} from "@/types/investor-statement";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Download, Package, TrendingUp, Users } from "lucide-react";

interface Props {
    statement: PartnerStatement;
    can: InvestorStatementCan;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatBox = ({
    label,
    value,
    color = "text-gray-800",
}: {
    label: string;
    value: string;
    color?: string;
}) => (
    <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`mt-0.5 text-sm font-semibold ${color}`}>{value}</p>
    </div>
);

const PaymentStatusBadge = ({
    status,
}: {
    status: PartnerStatementDistributionItem["payment_status"];
}) => {
    const map: Record<string, string> = {
        paid: "bg-green-100 text-green-700",
        partial: "bg-blue-100 text-blue-700",
        deferred: "bg-purple-100 text-purple-700",
        reinvested: "bg-indigo-100 text-indigo-700",
        cancelled: "bg-red-100 text-red-700",
        reopened: "bg-orange-100 text-orange-700",
        pending: "bg-amber-100 text-amber-700",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-500"}`}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const DistStatusBadge = ({
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PartnerShow({ statement, can }: Props) {
    const { partner, profit_balance, distribution_history } = statement;

    const totalPending =
        profit_balance.pending_cost_balance +
        profit_balance.pending_profit_balance;

    const totalEarned =
        profit_balance.total_cost_returned + profit_balance.total_profit_earned;

    const totalPaid =
        profit_balance.total_cost_paid + profit_balance.total_profit_paid;

    const hasProductBalance =
        profit_balance.total_cost_returned > 0 ||
        profit_balance.pending_cost_balance > 0;

    return (
        <AuthenticatedLayout>
            <Head title={`Partner Statement — ${partner.name}`} />

            <div className="space-y-6">
                {/* ── Page Header ── */}
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
                                    {partner.name}
                                </h1>
                                {/* Active badge */}
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                        partner.is_active
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {partner.is_active ? "Active" : "Inactive"}
                                </span>
                                {/* Partner type badge */}
                                <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                                    {partner.type_label}
                                </span>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {partner.code ?? "No code"}
                                <span className="ml-2 text-gray-400">
                                    · Partner Statement
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* PDF Export */}
                    {can.export && (
                        <a
                            href={route(
                                "backend.investor-statements.partner.pdf",
                                { partner: partner.id },
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Export PDF
                        </a>
                    )}
                </div>

                {/* ── Partner Info ── */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-3">
                        <h2 className="text-sm font-medium text-gray-700">
                            Partner Information
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 p-5 sm:grid-cols-4">
                        <StatBox label="Partner Name" value={partner.name} />
                        <StatBox
                            label="Partner Code"
                            value={partner.code ?? "—"}
                        />
                        <StatBox
                            label="Partner Type"
                            value={partner.type_label}
                        />
                        <div className="flex items-center gap-3">
                            {partner.is_capital && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                    <Users className="h-3 w-3" /> Capital
                                </span>
                            )}
                            {partner.is_working && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                    <Users className="h-3 w-3" /> Working
                                </span>
                            )}
                            {partner.is_product && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                    <Package className="h-3 w-3" /> Product
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Profit Balance Cards ── */}
                <div
                    className={`grid grid-cols-1 gap-6 ${hasProductBalance ? "lg:grid-cols-2" : ""}`}
                >
                    {/* Profit Share Card — always shown */}
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-amber-100 bg-amber-50 px-5 py-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-medium text-amber-800">
                                    Profit Summary
                                </h2>
                                {totalPending > 0 && (
                                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                        {fmt(totalPending)} pending
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-5">
                            {/* Hero */}
                            <div className="mb-4 border-b border-gray-100 pb-4">
                                <p className="text-xs text-gray-400">
                                    Total Pending Balance
                                </p>
                                <p className="mt-1 text-2xl font-bold text-amber-600">
                                    {fmt(totalPending)}
                                </p>
                            </div>
                            {/* Rows */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                        Total Earned
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {fmt(totalEarned)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                        Total Paid Out
                                    </span>
                                    <span className="font-medium text-green-600">
                                        {fmt(totalPaid)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                        Profit Share Pending
                                    </span>
                                    <span className="font-medium text-amber-600">
                                        {fmt(
                                            profit_balance.pending_profit_balance,
                                        )}
                                    </span>
                                </div>
                                {hasProductBalance && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">
                                            Cost Return Pending
                                        </span>
                                        <span className="font-medium text-orange-600">
                                            {fmt(
                                                profit_balance.pending_cost_balance,
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cost Return Card — product partners only */}
                    {hasProductBalance && (
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-orange-100 bg-orange-50 px-5 py-3">
                                <h2 className="text-sm font-medium text-orange-800">
                                    Cost Return Summary
                                </h2>
                            </div>
                            <div className="p-5">
                                {/* Hero */}
                                <div className="mb-4 border-b border-gray-100 pb-4">
                                    <p className="text-xs text-gray-400">
                                        Total Cost Returned
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-orange-600">
                                        {fmt(
                                            profit_balance.total_cost_returned,
                                        )}
                                    </p>
                                </div>
                                {/* Rows */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">
                                            Total Cost Paid
                                        </span>
                                        <span className="font-medium text-green-600">
                                            {fmt(
                                                profit_balance.total_cost_paid,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">
                                            Pending Cost Balance
                                        </span>
                                        <span className="font-medium text-orange-600">
                                            {fmt(
                                                profit_balance.pending_cost_balance,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">
                                            Profit Share Earned
                                        </span>
                                        <span className="font-medium text-gray-800">
                                            {fmt(
                                                profit_balance.total_profit_earned,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">
                                            Profit Share Paid
                                        </span>
                                        <span className="font-medium text-green-600">
                                            {fmt(
                                                profit_balance.total_profit_paid,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Distribution History ── */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                        <h2 className="text-sm font-medium text-gray-700">
                            Distribution History
                        </h2>
                        <span className="text-xs text-gray-400">
                            {distribution_history.length} record
                            {distribution_history.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {distribution_history.length === 0 ? (
                        <div className="py-12 text-center">
                            <TrendingUp className="mx-auto mb-3 h-8 w-8 text-gray-200" />
                            <p className="text-sm text-gray-400">
                                No distribution records yet.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Distribution
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Period
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Share %
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Profit Share
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Cost Return
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Total
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Payment
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {distribution_history.map((item) => {
                                        const profitShare =
                                            item.share_amount -
                                            item.cost_return_amount;

                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {item.distribution_no ??
                                                            "—"}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        {item.title ?? ""}
                                                    </p>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                                                    {fmtDate(item.period_start)}{" "}
                                                    → {fmtDate(item.period_end)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <DistStatusBadge
                                                        status={
                                                            item.distribution_status
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-gray-700">
                                                    {Number(
                                                        item.share_percent,
                                                    ).toFixed(2)}
                                                    %
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-indigo-600">
                                                    {fmt(profitShare)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm">
                                                    {item.cost_return_amount >
                                                    0 ? (
                                                        <span className="text-orange-600">
                                                            {fmt(
                                                                item.cost_return_amount,
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">
                                                    {fmt(item.share_amount)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <PaymentStatusBadge
                                                        status={
                                                            item.payment_status
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-gray-200 bg-gray-50">
                                        <td
                                            colSpan={4}
                                            className="px-4 py-3 text-xs font-semibold uppercase text-gray-600"
                                        >
                                            Totals (
                                            {distribution_history.length})
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-600">
                                            {fmt(
                                                distribution_history.reduce(
                                                    (s, i) =>
                                                        s +
                                                        Number(
                                                            i.share_amount -
                                                                i.cost_return_amount,
                                                        ),
                                                    0,
                                                ),
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-orange-600">
                                            {fmt(
                                                distribution_history.reduce(
                                                    (s, i) =>
                                                        s +
                                                        Number(
                                                            i.cost_return_amount,
                                                        ),
                                                    0,
                                                ),
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">
                                            {fmt(
                                                distribution_history.reduce(
                                                    (s, i) =>
                                                        s +
                                                        Number(i.share_amount),
                                                    0,
                                                ),
                                            )}
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
