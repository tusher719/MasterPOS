import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Users,
    DollarSign,
    CreditCard,
    AlertCircle,
    ArrowLeft,
    Trophy,
} from "lucide-react";
import { useState, useMemo } from "react";
import ReportFilters from "./_components/ReportFilters";
import ExportBar from "./_components/ExportBar";

interface LedgerRow {
    id: number;
    reference_no: string;
    sale_date: string;
    customer_id: number | null;
    customer_name: string | null;
    customer_phone: string | null;
    payment_method: string | null;
    grand_total: string;
    paid_amount: string;
    due_amount: string;
    payment_status: "paid" | "partial" | "due";
}

interface TopCustomer {
    id: number;
    name: string;
    total_orders: number;
    total_spent: string;
    total_due: string;
}

interface Customer {
    id: number;
    name: string;
    phone: string | null;
}

interface Summary {
    total_sales: number;
    total_revenue: string;
    total_paid: string;
    total_due: string;
}

interface Props {
    rows: LedgerRow[];
    topCustomers: TopCustomer[];
    customers: Customer[];
    summary: Summary;
    filters: { from: string; to: string; customer_id?: string | null };
    can: { export: boolean };
}

const PAYMENT_BADGE: Record<string, string> = {
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

// Medal colors for top 3
const MEDAL: Record<number, string> = {
    0: "text-yellow-500",
    1: "text-gray-400",
    2: "text-amber-600",
};

export default function CustomerLedger({
    rows,
    topCustomers,
    customers,
    summary,
    filters,
    can,
}: Props) {
    const [search, setSearch] = useState("");

    // Client-side search within already-filtered rows
    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(
            (r) =>
                (r.customer_name ?? "").toLowerCase().includes(q) ||
                (r.customer_phone ?? "").toLowerCase().includes(q) ||
                r.reference_no.toLowerCase().includes(q),
        );
    }, [rows, search]);

    // Per-customer subtotals from filtered rows
    const customerTotals = useMemo(() => {
        const map = new Map<
            string,
            { orders: number; revenue: number; due: number }
        >();
        for (const r of filtered) {
            const key = r.customer_name ?? "Walk-in";
            const cur = map.get(key) ?? { orders: 0, revenue: 0, due: 0 };
            map.set(key, {
                orders: cur.orders + 1,
                revenue: cur.revenue + Number(r.grand_total),
                due: cur.due + Number(r.due_amount),
            });
        }
        return Array.from(map.entries())
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .slice(0, 5);
    }, [filtered]);

    return (
        <AuthenticatedLayout>
            <Head title="Customer Ledger" />

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
                        Customer Ledger
                    </h1>
                </div>

                {/* Print-only title */}
                <div className="hidden print:block">
                    <h1 className="text-xl font-bold text-gray-800">
                        Customer Ledger
                    </h1>
                    <p className="text-sm text-gray-500">
                        Period: {filters.from} — {filters.to}
                    </p>
                </div>

                {/* Filters — with customer dropdown */}
                <div className="print:hidden">
                    <ReportFilters
                        filters={filters}
                        routeName="backend.reports.customer-ledger"
                        showCustomerFilter
                        customers={customers}
                    />
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <KpiCard
                        label="Total Transactions"
                        value={String(summary.total_sales)}
                        icon={<Users className="h-4 w-4 text-indigo-600" />}
                        accent="border-l-indigo-500"
                        plain
                    />
                    <KpiCard
                        label="Total Revenue"
                        value={fmt(summary.total_revenue)}
                        icon={<DollarSign className="h-4 w-4 text-green-600" />}
                        accent="border-l-green-500"
                    />
                    <KpiCard
                        label="Total Collected"
                        value={fmt(summary.total_paid)}
                        icon={<CreditCard className="h-4 w-4 text-blue-600" />}
                        accent="border-l-blue-500"
                    />
                    <KpiCard
                        label="Total Due"
                        value={fmt(summary.total_due)}
                        icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                        accent="border-l-red-500"
                    />
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                    {/* Main ledger table — 3 cols */}
                    <div className="lg:col-span-3 space-y-3">
                        {/* Search + export */}
                        <div
                            className="print:hidden flex flex-wrap items-center gap-3
                                        rounded-lg border border-gray-200 bg-white px-4 py-3"
                        >
                            <input
                                type="text"
                                placeholder="Search customer, phone, reference…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="rounded-md border border-gray-300 px-3 py-1.5
                                           text-sm focus:border-indigo-500 focus:ring-1
                                           focus:ring-indigo-500 focus:outline-none
                                           min-w-[220px]"
                            />
                            <div className="ml-auto">
                                <ExportBar
                                    canExport={can.export}
                                    reportType="customer-ledger"
                                    filters={filters}
                                    rowCount={filtered.length}
                                />
                            </div>
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
                                                Phone
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Payment Method
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
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={10}
                                                    className="py-12 text-center text-sm text-gray-400"
                                                >
                                                    No transactions found for
                                                    the selected filters.
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map((row, idx) => (
                                                <tr
                                                    key={row.id}
                                                    className="transition hover:bg-gray-50"
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
                                                    <td className="px-4 py-2.5 text-gray-700">
                                                        {row.customer_name ?? (
                                                            <span className="text-gray-400">
                                                                Walk-in
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-500">
                                                        {row.customer_phone ?? (
                                                            <span className="text-gray-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-500">
                                                        {row.payment_method ?? (
                                                            <span className="text-gray-300">
                                                                —
                                                            </span>
                                                        )}
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
                                                            className={`rounded-full px-2 py-0.5
                                                            text-xs font-medium
                                                            ${
                                                                PAYMENT_BADGE[
                                                                    row
                                                                        .payment_status
                                                                ] ??
                                                                "bg-gray-100 text-gray-500"
                                                            }`}
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
                                    {filtered.length > 0 && (
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
                                                    Totals ({filtered.length}{" "}
                                                    transactions)
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {fmt(
                                                        filtered.reduce(
                                                            (s, r) =>
                                                                s +
                                                                Number(
                                                                    r.grand_total,
                                                                ),
                                                            0,
                                                        ),
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-green-600">
                                                    {fmt(
                                                        filtered.reduce(
                                                            (s, r) =>
                                                                s +
                                                                Number(
                                                                    r.paid_amount,
                                                                ),
                                                            0,
                                                        ),
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-red-500">
                                                    {fmt(
                                                        filtered.reduce(
                                                            (s, r) =>
                                                                s +
                                                                Number(
                                                                    r.due_amount,
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

                    {/* Sidebar — 1 col */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Top customers (period) */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-amber-500" />
                                <h3 className="text-sm font-medium text-gray-700">
                                    Top Customers
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {topCustomers.length === 0 ? (
                                    <p className="px-4 py-6 text-center text-xs text-gray-400">
                                        No customer data.
                                    </p>
                                ) : (
                                    topCustomers.map((c, idx) => (
                                        <div key={c.id} className="px-4 py-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span
                                                        className={`text-sm font-bold shrink-0
                                                        ${MEDAL[idx] ?? "text-gray-400"}`}
                                                    >
                                                        #{idx + 1}
                                                    </span>
                                                    <span
                                                        className="truncate text-xs
                                                                     font-medium text-gray-700"
                                                    >
                                                        {c.name}
                                                    </span>
                                                </div>
                                                <span
                                                    className="shrink-0 text-xs font-bold
                                                                 text-indigo-600"
                                                >
                                                    {fmt(c.total_spent)}
                                                </span>
                                            </div>
                                            <div
                                                className="mt-1 flex items-center justify-between
                                                            pl-6 text-xs text-gray-400"
                                            >
                                                <span>
                                                    {c.total_orders} orders
                                                </span>
                                                {Number(c.total_due) > 0 && (
                                                    <span className="text-red-400">
                                                        Due: {fmt(c.total_due)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Current filter breakdown */}
                        {customerTotals.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white">
                                <div className="border-b border-gray-100 px-4 py-3">
                                    <h3 className="text-sm font-medium text-gray-700">
                                        Current View Breakdown
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Top 5 by revenue in filtered results
                                    </p>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {customerTotals.map(
                                        ([name, totals], idx) => {
                                            const totalRevenue =
                                                filtered.reduce(
                                                    (s, r) =>
                                                        s +
                                                        Number(r.grand_total),
                                                    0,
                                                );
                                            const pct =
                                                totalRevenue > 0
                                                    ? Math.round(
                                                          (totals.revenue /
                                                              totalRevenue) *
                                                              100,
                                                      )
                                                    : 0;

                                            return (
                                                <div
                                                    key={idx}
                                                    className="px-4 py-3"
                                                >
                                                    <div className="mb-1 flex items-center justify-between">
                                                        <span
                                                            className="max-w-[120px] truncate
                                                                     text-xs font-medium text-gray-700"
                                                        >
                                                            {name}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                    <div className="mb-1 h-1.5 w-full rounded-full bg-gray-100">
                                                        <div
                                                            className="h-1.5 rounded-full bg-indigo-400
                                                                   transition-all"
                                                            style={{
                                                                width: `${pct}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-400">
                                                            {totals.orders}{" "}
                                                            orders
                                                        </span>
                                                        <span className="text-xs font-semibold text-indigo-600">
                                                            {fmt(
                                                                totals.revenue,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        )}
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
