import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { TrendingDown, DollarSign, ArrowLeft } from "lucide-react";
import ReportFilters from "./_components/ReportFilters";
import ExportBar from "./_components/ExportBar";

interface ExpenseRow {
    id: number;
    title: string;
    expense_date: string;
    category_name: string | null;
    payment_method: string | null;
    amount: string;
    reference: string | null;
}

interface CategoryTotal {
    category_name: string | null;
    total: string;
}

interface Summary {
    total_expenses: number;
    total_amount: string;
}

interface Props {
    rows: ExpenseRow[];
    byCategory: CategoryTotal[];
    summary: Summary;
    filters: { from: string; to: string };
    can: { export: boolean };
}

function fmt(val: string | number): string {
    return Number(val).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function ExpensesReport({
    rows,
    byCategory,
    summary,
    filters,
    can,
}: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Expense Report" />

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
                        Expense Report
                    </h1>
                </div>

                {/* Print-only title */}
                <div className="hidden print:block">
                    <h1 className="text-xl font-bold text-gray-800">
                        Expense Report
                    </h1>
                    <p className="text-sm text-gray-500">
                        Period: {filters.from} — {filters.to}
                    </p>
                </div>

                {/* Filters */}
                <div className="print:hidden">
                    <ReportFilters
                        filters={filters}
                        routeName="backend.reports.expenses"
                    />
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2">
                    <KpiCard
                        label="Total Entries"
                        value={String(summary.total_expenses)}
                        icon={<TrendingDown className="h-4 w-4 text-red-500" />}
                        accent="border-l-red-500"
                    />
                    <KpiCard
                        label="Total Amount"
                        value={fmt(summary.total_amount)}
                        icon={<DollarSign className="h-4 w-4 text-red-600" />}
                        accent="border-l-red-600"
                    />
                </div>

                {/* Two-column layout: table + category breakdown */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                    {/* Main table — takes 3 cols */}
                    <div className="lg:col-span-3">
                        {/* Export bar */}
                        <div className="mb-3 print:hidden">
                            <ExportBar
                                canExport={can.export}
                                reportType="expenses"
                                filters={filters}
                                rowCount={rows.length}
                            />
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
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Category
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Payment Method
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Reference
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {rows.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="py-12 text-center text-sm text-gray-400"
                                                >
                                                    No expenses found for the
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
                                                    <td className="px-4 py-2.5 text-gray-600">
                                                        {row.expense_date}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-600">
                                                        {row.category_name ?? (
                                                            <span className="text-gray-400">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-600">
                                                        {row.payment_method ?? (
                                                            <span className="text-gray-400">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-500">
                                                        {row.reference ?? (
                                                            <span className="text-gray-400">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-medium text-red-600">
                                                        {fmt(row.amount)}
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
                                                    Total
                                                </td>
                                                <td className="px-4 py-3 text-right text-red-600">
                                                    {fmt(summary.total_amount)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Category breakdown sidebar — 1 col */}
                    <div className="lg:col-span-1">
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-4 py-3">
                                <h3 className="text-sm font-medium text-gray-700">
                                    By Category
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {byCategory.length === 0 ? (
                                    <p className="px-4 py-6 text-center text-xs text-gray-400">
                                        No data available.
                                    </p>
                                ) : (
                                    byCategory.map((cat, idx) => {
                                        const total = Number(
                                            summary.total_amount,
                                        );
                                        const catTotal = Number(cat.total);
                                        const pct =
                                            total > 0
                                                ? Math.round(
                                                      (catTotal / total) * 100,
                                                  )
                                                : 0;

                                        return (
                                            <div
                                                key={idx}
                                                className="px-4 py-3"
                                            >
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                                                        {cat.category_name ??
                                                            "Uncategorised"}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {pct}%
                                                    </span>
                                                </div>
                                                {/* Progress bar */}
                                                <div className="mb-1 h-1.5 w-full rounded-full bg-gray-100">
                                                    <div
                                                        className="h-1.5 rounded-full bg-red-400 transition-all"
                                                        style={{
                                                            width: `${pct}%`,
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-right text-xs font-semibold text-red-600">
                                                    {fmt(cat.total)}
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Category sidebar total */}
                            {byCategory.length > 0 && (
                                <div className="border-t-2 border-gray-200 bg-gray-50 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Total
                                        </span>
                                        <span className="text-sm font-bold text-red-600">
                                            {fmt(summary.total_amount)}
                                        </span>
                                    </div>
                                </div>
                            )}
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
