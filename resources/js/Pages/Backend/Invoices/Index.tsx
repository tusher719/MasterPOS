import { Head, router } from "@inertiajs/react";
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import useFlashToast from "@/hooks/useFlashToast";
import { useState, useCallback } from "react";

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface Invoice {
    id: number;
    reference_no: string;
    sale_date: string;
    customer: Customer | null;
    payment_method: PaymentMethod | null;
    grand_total: string;
    paid_amount: string;
    due_amount: string;
    payment_status: "paid" | "partial" | "due";
    deleted_at: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
}

interface Stats {
    total: number;
    paid: number;
    partial: number;
    due: number;
}

interface Filters {
    search?: string;
    payment_status?: string;
    date_from?: string;
    date_to?: string;
}

interface Props {
    invoices: Paginated<Invoice>;
    stats: Stats;
    filters: Filters;
    can: { view: boolean; print: boolean };
}

const statusConfig = {
    paid: { label: "Paid", classes: "bg-green-100 text-green-700" },
    partial: { label: "Partial", classes: "bg-amber-100 text-amber-700" },
    due: { label: "Due", classes: "bg-red-100 text-red-600" },
};

export default function InvoicesIndex({
    invoices,
    stats,
    filters,
    can,
}: Props) {
    useFlashToast();

    const [search, setSearch] = useState(filters.search ?? "");
    const [paymentStatus, setPaymentStatus] = useState(
        filters.payment_status ?? "",
    );
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? "");
    const [dateTo, setDateTo] = useState(filters.date_to ?? "");

    const applyFilters = useCallback(() => {
        router.get(
            route("backend.invoices.index"),
            {
                search: search || undefined,
                payment_status: paymentStatus || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, replace: true },
        );
    }, [search, paymentStatus, dateFrom, dateTo]);

    const resetFilters = () => {
        setSearch("");
        setPaymentStatus("");
        setDateFrom("");
        setDateTo("");
        router.get(route("backend.invoices.index"), {}, { replace: true });
    };

    const handlePageChange = (url: string | null) => {
        if (url) router.visit(url, { preserveState: true });
    };

    const formatCurrency = (value: string) =>
        parseFloat(value).toLocaleString("en-US", { minimumFractionDigits: 2 });

    return (
        <AuthenticatedLayout>
            <Head title="Invoices" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Invoices
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            View and download invoices for all completed sales
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-indigo-50 p-2">
                                <FileText className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {stats.total}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-green-50 p-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Paid</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {stats.paid}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-amber-50 p-2">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Partial</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {stats.partial}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-red-50 p-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Due</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {stats.due}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Search */}
                        <input
                            type="text"
                            placeholder="Search reference or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && applyFilters()
                            }
                            className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />

                        {/* Payment Status */}
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="due">Due</option>
                        </select>

                        {/* Date From */}
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />

                        {/* Date To */}
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <button
                            onClick={applyFilters}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={resetFilters}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Invoice Table */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Invoice
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Grand Total
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Paid
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Due
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {invoices.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-12 text-center text-sm text-gray-400"
                                    >
                                        No invoices found.
                                    </td>
                                </tr>
                            ) : (
                                invoices.data.map((invoice) => {
                                    const status =
                                        statusConfig[invoice.payment_status];
                                    return (
                                        <tr
                                            key={invoice.id}
                                            className={
                                                invoice.deleted_at
                                                    ? "bg-red-50/40"
                                                    : "hover:bg-gray-50"
                                            }
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-sm font-medium text-indigo-600">
                                                    {invoice.reference_no}
                                                </span>
                                                {invoice.deleted_at && (
                                                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                                                        Voided
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {new Date(
                                                    invoice.sale_date,
                                                ).toLocaleDateString("en-GB")}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {invoice.customer ? (
                                                    <div>
                                                        <p className="font-medium">
                                                            {
                                                                invoice.customer
                                                                    .name
                                                            }
                                                        </p>
                                                        {invoice.customer
                                                            .phone && (
                                                            <p className="text-xs text-gray-400">
                                                                {
                                                                    invoice
                                                                        .customer
                                                                        .phone
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">
                                                        Walk-in Customer
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                                                ৳
                                                {formatCurrency(
                                                    invoice.grand_total,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-green-600">
                                                ৳
                                                {formatCurrency(
                                                    invoice.paid_amount,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-red-500">
                                                ৳
                                                {formatCurrency(
                                                    invoice.due_amount,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.classes}`}
                                                >
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* View Invoice */}
                                                    <a
                                                        href={route(
                                                            "backend.invoices.show",
                                                            invoice.id,
                                                        )}
                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                                                        title="View Invoice"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </a>

                                                    {/* Download PDF */}
                                                    {can.print &&
                                                        !invoice.deleted_at && (
                                                            <a
                                                                href={route(
                                                                    "backend.invoices.pdf",
                                                                    invoice.id,
                                                                )}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="rounded-md p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                                                                title="Download PDF"
                                                            >
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                                    />
                                                                </svg>
                                                            </a>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {invoices.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3">
                            <p className="text-sm text-gray-500">
                                Showing {invoices.from}–{invoices.to} of{" "}
                                {invoices.total} invoices
                            </p>
                            <div className="flex gap-1">
                                {invoices.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() =>
                                            handlePageChange(link.url)
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        className={`rounded-md px-3 py-1 text-sm ${
                                            link.active
                                                ? "bg-indigo-600 text-white"
                                                : link.url
                                                  ? "text-gray-600 hover:bg-gray-100"
                                                  : "cursor-not-allowed text-gray-300"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
