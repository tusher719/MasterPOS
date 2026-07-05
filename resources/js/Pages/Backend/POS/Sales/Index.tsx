import React, { useCallback, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import useFlashToast from "@/hooks/useFlashToast";
import SaleStatsCards from "./_components/SaleStatsCards";
import SaleTable from "./_components/SaleTable";
import SaleGrid from "./_components/SaleGrid";
import { Plus, List, LayoutGrid } from "lucide-react";

interface Sale {
    id: number;
    reference_no: string;
    sale_date: string;
    customer: { id: number; name: string } | null;
    payment_method: { id: number; name: string } | null;
    items_count: number;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    payment_status: "paid" | "partial" | "due";
    deleted_at: string | null;
    created_at: string;
}

interface PaginatedSales {
    data: Sale[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Stats {
    total: number;
    today: number;
    total_revenue: number;
    due_amount: number;
}

interface Filters {
    search?: string;
    status?: string;
    trashed?: string;
    date_from?: string;
    date_to?: string;
}

interface Props {
    sales: PaginatedSales;
    stats: Stats;
    filters: Filters;
    can: {
        view: boolean;
        create: boolean;
        delete: boolean;
        restore: boolean;
    };
}

const VIEW_STORAGE_KEY = "masterpos_sales_view";

export default function SalesIndex({ sales, stats, filters, can }: Props) {
    useFlashToast();

    const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
        if (typeof window === "undefined") return "list";
        return (
            (window.localStorage.getItem(VIEW_STORAGE_KEY) as
                | "list"
                | "grid"
                | null) ?? "list"
        );
    });

    const handleViewChange = (mode: "list" | "grid") => {
        setViewMode(mode);
        window.localStorage.setItem(VIEW_STORAGE_KEY, mode);
    };

    const handleFilter = useCallback(
        (key: string, value: string) => {
            router.get(
                route("backend.pos.sales.index"),
                { ...filters, [key]: value || undefined },
                { preserveState: true, replace: true },
            );
        },
        [filters],
    );

    const handleClearFilters = () => {
        router.get(route("backend.pos.sales.index"), {}, { replace: true });
    };

    const hasFilters =
        filters.search ||
        filters.status ||
        filters.trashed ||
        filters.date_from ||
        filters.date_to;

    return (
        <AuthenticatedLayout>
            <Head title="Sales History" />

            <div className="space-y-6 p-6">
                {/* ── Page Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Sales History
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {sales.total} total sales recorded
                        </p>
                    </div>
                    {can.create && (
                        <Link
                            href={route("backend.pos.index")}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2
                                       text-sm font-semibold text-white transition-colors
                                       hover:bg-indigo-700 active:scale-95"
                        >
                            <Plus size={16} />
                            New Sale
                        </Link>
                    )}
                </div>

                {/* ── Stats Cards ── */}
                <SaleStatsCards stats={stats} />

                {/* ── Filters ── */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <input
                            type="text"
                            placeholder="Search reference or customer..."
                            value={filters.search ?? ""}
                            onChange={(e) =>
                                handleFilter("search", e.target.value)
                            }
                            className="w-64 rounded-md border border-gray-300 px-3 py-2 text-sm
                                       transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                        />

                        {/* Payment Status */}
                        <select
                            value={filters.status ?? ""}
                            onChange={(e) =>
                                handleFilter("status", e.target.value)
                            }
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm
                                       transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="due">Due</option>
                        </select>

                        {/* Date From */}
                        <input
                            type="date"
                            value={filters.date_from ?? ""}
                            onChange={(e) =>
                                handleFilter("date_from", e.target.value)
                            }
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm
                                       transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                        />

                        {/* Date To */}
                        <input
                            type="date"
                            value={filters.date_to ?? ""}
                            onChange={(e) =>
                                handleFilter("date_to", e.target.value)
                            }
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm
                                       transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                        />

                        {/* Voided Toggle */}
                        <label
                            className="flex cursor-pointer items-center gap-2 rounded-md
                                          border border-gray-300 px-3 py-2 text-sm text-gray-600
                                          transition-colors hover:bg-gray-50"
                        >
                            <input
                                type="checkbox"
                                checked={!!filters.trashed}
                                onChange={(e) =>
                                    handleFilter(
                                        "trashed",
                                        e.target.checked ? "1" : "",
                                    )
                                }
                                className="rounded border-gray-300 text-indigo-600
                                           focus:ring-indigo-500"
                            />
                            Show Voided
                        </label>

                        {/* Clear Filters */}
                        {hasFilters && (
                            <button
                                onClick={handleClearFilters}
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm
                                           text-gray-600 transition-colors hover:bg-gray-50"
                            >
                                Clear Filters
                            </button>
                        )}

                        {/* ── View Toggle ── */}
                        <div className="ml-auto flex items-center rounded-md border border-gray-300 p-0.5">
                            <button
                                onClick={() => handleViewChange("list")}
                                title="List view"
                                className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-all
                                    ${
                                        viewMode === "list"
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "text-gray-500 hover:bg-gray-100"
                                    }`}
                            >
                                <List size={14} />
                                List
                            </button>
                            <button
                                onClick={() => handleViewChange("grid")}
                                title="Grid view"
                                className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-all
                                    ${
                                        viewMode === "grid"
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "text-gray-500 hover:bg-gray-100"
                                    }`}
                            >
                                <LayoutGrid size={14} />
                                Grid
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Sales List / Grid ── */}
                <div
                    key={viewMode}
                    style={{ animation: "viewFadeIn 0.25s ease-out" }}
                >
                    <style>{`
                        @keyframes viewFadeIn {
                            0% { opacity: 0; transform: translateY(4px); }
                            100% { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                    {viewMode === "list" ? (
                        <SaleTable sales={sales.data} can={can} />
                    ) : (
                        <SaleGrid sales={sales.data} can={can} />
                    )}
                </div>

                {/* ── Pagination ── */}
                {sales.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing{" "}
                            {(sales.current_page - 1) * sales.per_page + 1}–
                            {Math.min(
                                sales.current_page * sales.per_page,
                                sales.total,
                            )}{" "}
                            of {sales.total} sales
                        </p>
                        <div className="flex gap-1">
                            {sales.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.get(link.url)
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`rounded-md px-3 py-1.5 text-sm border transition-all
                                        ${
                                            link.active
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
