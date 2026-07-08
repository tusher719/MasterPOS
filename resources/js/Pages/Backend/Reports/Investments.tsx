import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Briefcase,
    DollarSign,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    ArrowLeft,
    BarChart2,
} from "lucide-react";
import ReportFilters from "./_components/ReportFilters";
import ExportBar from "./_components/ExportBar";

interface InvestmentRow {
    id: number;
    title: string;
    investor_name: string;
    investment_date: string;
    type_name: string | null;
    amount: string;
    reference: string | null;
    status: "active" | "withdrawn";
}

interface Distribution {
    id: number;
    distribution_no: string;
    distribution_date: string;
    distributable_amount: string;
    net_profit: string;
}

interface Summary {
    total_investments: number;
    total_amount: string;
    active_amount: string;
    withdrawn_amount: string;
    total_distributions: number;
    total_distributed: string;
}

interface Props {
    rows: InvestmentRow[];
    distributions: Distribution[];
    summary: Summary;
    filters: { from: string; to: string };
    can: { export: boolean };
}

const STATUS_BADGE: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    withdrawn: "bg-amber-100 text-amber-700",
};

function fmt(val: string | number): string {
    return Number(val).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function InvestmentsReport({
    rows,
    distributions,
    summary,
    filters,
    can,
}: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Investment Report" />

            <div className="space-y-4 print:space-y-3">
                {/* Back + heading */}
                <div className="flex items-center gap-3 print:hidden">
                    <Link
                        href={route("backend.reports.index")}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Reports
                    </Link>
                    <span className="text-gray-300">/</span>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Investment Report
                    </h1>
                </div>

                {/* Print-only title */}
                <div className="hidden print:block">
                    <h1 className="text-xl font-bold text-gray-800">
                        Investment Report
                    </h1>
                    <p className="text-sm text-gray-500">
                        Period: {filters.from} — {filters.to}
                    </p>
                </div>

                {/* Filters */}
                <div className="print:hidden">
                    <ReportFilters
                        filters={filters}
                        routeName="backend.reports.investments"
                    />
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <KpiCard
                        label="Total Investments"
                        value={String(summary.total_investments)}
                        icon={<Briefcase className="h-4 w-4 text-indigo-600" />}
                        accent="border-l-indigo-500"
                        plain
                    />
                    <KpiCard
                        label="Total Amount"
                        value={fmt(summary.total_amount)}
                        icon={
                            <DollarSign className="h-4 w-4 text-indigo-600" />
                        }
                        accent="border-l-indigo-400"
                    />
                    <KpiCard
                        label="Active Capital"
                        value={fmt(summary.active_amount)}
                        icon={<TrendingUp className="h-4 w-4 text-green-600" />}
                        accent="border-l-green-500"
                    />
                    <KpiCard
                        label="Withdrawn"
                        value={fmt(summary.withdrawn_amount)}
                        icon={
                            <TrendingDown className="h-4 w-4 text-amber-600" />
                        }
                        accent="border-l-amber-500"
                    />
                    <KpiCard
                        label="Distributions"
                        value={String(summary.total_distributions)}
                        icon={<BarChart2 className="h-4 w-4 text-blue-600" />}
                        accent="border-l-blue-500"
                        plain
                    />
                    <KpiCard
                        label="Total Distributed"
                        value={fmt(summary.total_distributed)}
                        icon={
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        }
                        accent="border-l-green-600"
                    />
                </div>

                {/* Export bar */}
                <div className="print:hidden">
                    <ExportBar
                        canExport={can.export}
                        reportType="investments"
                        filters={filters}
                        rowCount={rows.length}
                    />
                </div>

                {/* Two-section layout */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Investments table — 2 cols */}
                    <div className="lg:col-span-2">
                        <div className="mb-2">
                            <h2 className="text-sm font-semibold text-gray-700">
                                Investments Received
                            </h2>
                            <p className="text-xs text-gray-400">
                                Entries with investment_date in the selected
                                period
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50">
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                #
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Title
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Investor
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Type
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Reference
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Amount
                                            </th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-500">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {rows.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="py-12 text-center text-sm text-gray-400"
                                                >
                                                    No investments found for the
                                                    selected period.
                                                </td>
                                            </tr>
                                        ) : (
                                            rows.map((row, idx) => (
                                                <tr
                                                    key={row.id}
                                                    className="transition hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-2.5 text-gray-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-2.5 font-medium text-gray-800">
                                                        {row.title}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-700">
                                                        {row.investor_name}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-600">
                                                        {row.investment_date}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-500">
                                                        {row.type_name ?? (
                                                            <span className="text-gray-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-500">
                                                        {row.reference ?? (
                                                            <span className="text-gray-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                                                        {fmt(row.amount)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <span
                                                            className={`rounded-full px-2 py-0.5
                                                            text-xs font-medium
                                                            ${
                                                                STATUS_BADGE[
                                                                    row.status
                                                                ] ??
                                                                "bg-gray-100 text-gray-500"
                                                            }`}
                                                        >
                                                            {row.status
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                                row.status.slice(
                                                                    1,
                                                                )}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>

                                    {rows.length > 0 && (
                                        <tfoot>
                                            <tr
                                                className="border-t-2 border-gray-200 bg-gray-50
                                                           font-semibold text-gray-700"
                                            >
                                                <td
                                                    colSpan={6}
                                                    className="px-4 py-3 text-right text-xs
                                                               uppercase tracking-wide text-gray-500"
                                                >
                                                    Total ({rows.length}{" "}
                                                    entries)
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {fmt(
                                                        rows.reduce(
                                                            (s, r) =>
                                                                s +
                                                                Number(
                                                                    r.amount,
                                                                ),
                                                            0,
                                                        ),
                                                    )}
                                                </td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Distributions sidebar — 1 col */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Distributions panel */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-4 py-3">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Profit Distributions
                                </h3>
                                <p className="mt-0.5 text-xs text-gray-400">
                                    Distributed in selected period
                                </p>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {distributions.length === 0 ? (
                                    <p className="px-4 py-6 text-center text-xs text-gray-400">
                                        No distributions in this period.
                                    </p>
                                ) : (
                                    distributions.map((d) => (
                                        <div key={d.id} className="px-4 py-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p
                                                        className="truncate text-xs font-semibold
                                                                   text-gray-800"
                                                    >
                                                        {d.distribution_no}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {d.distribution_date}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="text-xs font-bold text-green-600">
                                                        {fmt(
                                                            d.distributable_amount,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        of {fmt(d.net_profit)}{" "}
                                                        profit
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Distributions total */}
                            {distributions.length > 0 && (
                                <div className="border-t-2 border-gray-200 bg-gray-50 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="text-xs font-semibold uppercase
                                                         tracking-wide text-gray-500"
                                        >
                                            Total Distributed
                                        </span>
                                        <span className="text-sm font-bold text-green-600">
                                            {fmt(summary.total_distributed)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Investment status breakdown */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                            <h3 className="text-sm font-medium text-gray-700">
                                Capital Breakdown
                            </h3>

                            {/* Active */}
                            <div>
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Active Capital
                                    </span>
                                    <span className="text-xs font-medium text-green-600">
                                        {Number(summary.total_amount) > 0
                                            ? `${Math.round(
                                                  (Number(
                                                      summary.active_amount,
                                                  ) /
                                                      Number(
                                                          summary.total_amount,
                                                      )) *
                                                      100,
                                              )}%`
                                            : "—"}
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-100">
                                    <div
                                        className="h-2 rounded-full bg-green-400 transition-all"
                                        style={{
                                            width:
                                                Number(summary.total_amount) > 0
                                                    ? `${Math.round(
                                                          (Number(
                                                              summary.active_amount,
                                                          ) /
                                                              Number(
                                                                  summary.total_amount,
                                                              )) *
                                                              100,
                                                      )}%`
                                                    : "0%",
                                        }}
                                    />
                                </div>
                                <p className="mt-1 text-right text-xs font-semibold text-green-600">
                                    {fmt(summary.active_amount)}
                                </p>
                            </div>

                            {/* Withdrawn */}
                            <div>
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Withdrawn
                                    </span>
                                    <span className="text-xs font-medium text-amber-600">
                                        {Number(summary.total_amount) > 0
                                            ? `${Math.round(
                                                  (Number(
                                                      summary.withdrawn_amount,
                                                  ) /
                                                      Number(
                                                          summary.total_amount,
                                                      )) *
                                                      100,
                                              )}%`
                                            : "—"}
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-100">
                                    <div
                                        className="h-2 rounded-full bg-amber-400 transition-all"
                                        style={{
                                            width:
                                                Number(summary.total_amount) > 0
                                                    ? `${Math.round(
                                                          (Number(
                                                              summary.withdrawn_amount,
                                                          ) /
                                                              Number(
                                                                  summary.total_amount,
                                                              )) *
                                                              100,
                                                      )}%`
                                                    : "0%",
                                        }}
                                    />
                                </div>
                                <p className="mt-1 text-right text-xs font-semibold text-amber-600">
                                    {fmt(summary.withdrawn_amount)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    accent: string;
    plain?: boolean;
}

function KpiCard({ label, value, icon, accent }: KpiProps) {
    return (
        <div
            className={`rounded-lg border border-gray-200 bg-white p-4 border-l-4 ${accent}`}
        >
            <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                    {label}
                </span>
                {icon}
            </div>
            <p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
    );
}
