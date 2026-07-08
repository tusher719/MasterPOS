import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
    ShoppingCart,
    DollarSign,
    TrendingDown,
    CreditCard,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";
import ReportFilters from "./_components/ReportFilters";
import ExportBar from "./_components/ExportBar";

interface SaleRow {
    id: number;
    reference_no: string;
    sale_date: string;
    customer_name: string | null;
    payment_method: string | null;
    subtotal: string;
    discount: string;
    tax: string;
    grand_total: string;
    paid_amount: string;
    due_amount: string;
    payment_status: "paid" | "partial" | "due";
}

interface Summary {
    total_sales: number;
    total_revenue: string;
    total_discount: string;
    total_tax: string;
    total_paid: string;
    total_due: string;
}

interface Props {
    rows: SaleRow[];
    summary: Summary;
    filters: { from: string; to: string };
    can: { export: boolean };
}

const STATUS_BADGE: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    due: "bg-red-100   text-red-600",
};

function fmt(val: string | number): string {
    return Number(val).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function SalesReport({ rows, summary, filters, can }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Sales Report" />

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
                        Sales Report
                    </h1>
                </div>

                {/* Print-only title */}
                <div className="hidden print:block">
                    <h1 className="text-xl font-bold text-gray-800">
                        Sales Report
                    </h1>
                    <p className="text-sm text-gray-500">
                        Period: {filters.from} — {filters.to}
                    </p>
                </div>

                {/* Filters */}
                <div className="print:hidden">
                    <ReportFilters
                        filters={filters}
                        routeName="backend.reports.sales"
                    />
                </div>

                {/* Summary KPI cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <KpiCard
                        label="Total Sales"
                        value={String(summary.total_sales)}
                        icon={
                            <ShoppingCart className="h-4 w-4 text-indigo-600" />
                        }
                        accent="border-l-indigo-500"
                        plain
                    />
                    <KpiCard
                        label="Revenue"
                        value={fmt(summary.total_revenue)}
                        icon={<DollarSign className="h-4 w-4 text-green-600" />}
                        accent="border-l-green-500"
                    />
                    <KpiCard
                        label="Discount"
                        value={fmt(summary.total_discount)}
                        icon={
                            <TrendingDown className="h-4 w-4 text-amber-600" />
                        }
                        accent="border-l-amber-500"
                    />
                    <KpiCard
                        label="Tax"
                        value={fmt(summary.total_tax)}
                        icon={<DollarSign className="h-4 w-4 text-blue-600" />}
                        accent="border-l-blue-500"
                    />
                    <KpiCard
                        label="Paid"
                        value={fmt(summary.total_paid)}
                        icon={<CreditCard className="h-4 w-4 text-green-600" />}
                        accent="border-l-green-500"
                    />
                    <KpiCard
                        label="Due"
                        value={fmt(summary.total_due)}
                        icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                        accent="border-l-red-500"
                    />
                </div>

                {/* Export bar */}
                <div className="print:hidden">
                    <ExportBar
                        canExport={can.export}
                        reportType="sales"
                        filters={filters}
                        rowCount={rows.length}
                    />
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        #
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Reference
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Customer
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Payment Method
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Subtotal
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Discount
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Tax
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Grand Total
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Paid
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Due
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
                                            colSpan={12}
                                            className="py-12 text-center text-sm text-gray-400"
                                        >
                                            No sales found for the selected
                                            period.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row, idx) => (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-gray-50 transition"
                                        >
                                            <td className="px-4 py-2.5 text-gray-400">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-2.5 font-medium text-gray-800">
                                                {row.reference_no}
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-600">
                                                {row.sale_date}
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-600">
                                                {row.customer_name ?? (
                                                    <span className="text-gray-400">
                                                        Walk-in
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-600">
                                                {row.payment_method ?? "—"}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">
                                                {fmt(row.subtotal)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-amber-600">
                                                {fmt(row.discount)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-blue-600">
                                                {fmt(row.tax)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                                                {fmt(row.grand_total)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-green-600">
                                                {fmt(row.paid_amount)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-red-500">
                                                {fmt(row.due_amount)}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium
                                                    ${STATUS_BADGE[row.payment_status] ?? "bg-gray-100 text-gray-500"}`}
                                                >
                                                    {row.payment_status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        row.payment_status.slice(
                                                            1,
                                                        )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>

                            {/* Footer totals */}
                            {rows.length > 0 && (
                                <tfoot>
                                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-gray-700">
                                        <td
                                            colSpan={5}
                                            className="px-4 py-3 text-right text-xs uppercase tracking-wide text-gray-500"
                                        >
                                            Totals
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {fmt(summary.total_revenue)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-amber-600">
                                            {fmt(summary.total_discount)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-blue-600">
                                            {fmt(summary.total_tax)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {fmt(summary.total_revenue)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-green-600">
                                            {fmt(summary.total_paid)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-red-500">
                                            {fmt(summary.total_due)}
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// ── Shared KPI card ────────────────────────────────────────────────────────────

interface KpiProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    accent: string;
    plain?: boolean; // no currency symbol
}

function KpiCard({ label, value, icon, accent, plain = false }: KpiProps) {
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
            <p className="text-lg font-bold text-gray-800">
                {plain ? value : value}
            </p>
        </div>
    );
}
