import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import useFlashToast from "@/hooks/useFlashToast";
import { Head, Link, router } from "@inertiajs/react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import SaleGrid from "./_components/SaleGrid";
import SaleStatsCards from "./_components/SaleStatsCards";
import SaleTable from "./_components/SaleTable";

export type OrderStatus =
    | "processing"
    | "confirmed"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "returned";

export type PaymentType = "full_paid" | "half_paid" | "cash_on_delivery";

export type DeliveryType =
    | "store_pickup"
    | "inside_dhaka"
    | "outside_dhaka"
    | "parallel";

export type DeliveryStatus = "pending" | "dispatched" | "delivered" | "failed";

export interface Sale {
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
    order_status: OrderStatus;
    payment_type: PaymentType | null;
    // ── Item 4.2 — Delivery ───────────────────────────────────────
    delivery_type: DeliveryType | null;
    delivery_charge: number | null;
    delivery_charge_free: boolean;
    delivery_address: string | null;
    delivery_contact_phone: string | null;
    delivery_status: DeliveryStatus | null;
    // ─────────────────────────────────────────────────────────────
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
    order_status?: string;
    payment_type?: string;
    delivery_type?: string;
    delivery_status?: string;
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

export const ORDER_STATUS_OPTIONS: {
    value: OrderStatus;
    label: string;
    classes: string;
}[] = [
    {
        value: "processing",
        label: "Processing",
        classes: "bg-amber-100 text-amber-700",
    },
    {
        value: "confirmed",
        label: "Confirmed",
        classes: "bg-blue-100 text-blue-700",
    },
    {
        value: "out_for_delivery",
        label: "Out for Delivery",
        classes: "bg-indigo-100 text-indigo-700",
    },
    {
        value: "delivered",
        label: "Delivered",
        classes: "bg-green-100 text-green-700",
    },
    {
        value: "cancelled",
        label: "Cancelled",
        classes: "bg-red-100 text-red-600",
    },
    {
        value: "returned",
        label: "Returned",
        classes: "bg-gray-100 text-gray-500",
    },
];

export const PAYMENT_TYPE_OPTIONS: {
    value: PaymentType;
    label: string;
    classes: string;
}[] = [
    {
        value: "full_paid",
        label: "Full Paid",
        classes: "bg-green-100 text-green-700",
    },
    {
        value: "half_paid",
        label: "Half Paid",
        classes: "bg-amber-100 text-amber-700",
    },
    {
        value: "cash_on_delivery",
        label: "Cash on Delivery",
        classes: "bg-blue-100 text-blue-700",
    },
];

export const DELIVERY_TYPE_OPTIONS: {
    value: DeliveryType;
    label: string;
    classes: string;
}[] = [
    {
        value: "store_pickup",
        label: "Store Pickup",
        classes: "bg-gray-100 text-gray-600",
    },
    {
        value: "inside_dhaka",
        label: "Inside Dhaka",
        classes: "bg-blue-100 text-blue-700",
    },
    {
        value: "outside_dhaka",
        label: "Outside Dhaka",
        classes: "bg-purple-100 text-purple-700",
    },
    {
        value: "parallel",
        label: "Parallel",
        classes: "bg-orange-100 text-orange-700",
    },
];

export const DELIVERY_STATUS_OPTIONS: {
    value: DeliveryStatus;
    label: string;
    classes: string;
}[] = [
    {
        value: "pending",
        label: "Pending",
        classes: "bg-amber-100 text-amber-700",
    },
    {
        value: "dispatched",
        label: "Dispatched",
        classes: "bg-blue-100 text-blue-700",
    },
    {
        value: "delivered",
        label: "Delivered",
        classes: "bg-green-100 text-green-700",
    },
    {
        value: "failed",
        label: "Failed",
        classes: "bg-red-100 text-red-600",
    },
];

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
        filters.order_status ||
        filters.payment_type ||
        filters.delivery_type ||
        filters.delivery_status ||
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
                    {/* Row 1 — search + payment status + dates + voided + view toggle */}
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
                                       focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                        />

                        {/* Payment Status */}
                        <select
                            value={filters.status ?? ""}
                            onChange={(e) =>
                                handleFilter("status", e.target.value)
                            }
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm
                                       focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                        >
                            <option value="">All Payment Status</option>
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
                                       focus:border-indigo-500 focus:outline-none focus:ring-1
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
                                       focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                        />

                        {/* Voided Toggle */}
                        <label
                            className="flex cursor-pointer items-center gap-2 rounded-md
                                          border border-gray-300 px-3 py-2 text-sm text-gray-600
                                          hover:bg-gray-50"
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
                                           text-gray-600 hover:bg-gray-50"
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

                    {/* Row 2 — Order Status + Payment Type button groups */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        {/* Order Status segment */}
                        <div className="flex items-center gap-1">
                            <span className="mr-1 text-xs font-medium text-gray-500">
                                Order:
                            </span>
                            <button
                                onClick={() => handleFilter("order_status", "")}
                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all
                                    ${
                                        !filters.order_status
                                            ? "bg-gray-700 text-white"
                                            : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                All
                            </button>
                            {ORDER_STATUS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() =>
                                        handleFilter(
                                            "order_status",
                                            filters.order_status === opt.value
                                                ? ""
                                                : opt.value,
                                        )
                                    }
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all
                                        ${
                                            filters.order_status === opt.value
                                                ? opt.classes +
                                                  " ring-1 ring-inset ring-current"
                                                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Payment Type segment */}
                        <div className="flex items-center gap-1">
                            <span className="mr-1 text-xs font-medium text-gray-500">
                                Type:
                            </span>
                            <button
                                onClick={() => handleFilter("payment_type", "")}
                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all
                                    ${
                                        !filters.payment_type
                                            ? "bg-gray-700 text-white"
                                            : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                All
                            </button>
                            {PAYMENT_TYPE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() =>
                                        handleFilter(
                                            "payment_type",
                                            filters.payment_type === opt.value
                                                ? ""
                                                : opt.value,
                                        )
                                    }
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all
                                        ${
                                            filters.payment_type === opt.value
                                                ? opt.classes +
                                                  " ring-1 ring-inset ring-current"
                                                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Row 3 — Delivery Type + Delivery Status button groups */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        {/* Delivery Type segment */}
                        <div className="flex items-center gap-1">
                            <span className="mr-1 text-xs font-medium text-gray-500">
                                Delivery:
                            </span>
                            <button
                                onClick={() =>
                                    handleFilter("delivery_type", "")
                                }
                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all
                                    ${
                                        !filters.delivery_type
                                            ? "bg-gray-700 text-white"
                                            : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                All
                            </button>
                            {DELIVERY_TYPE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() =>
                                        handleFilter(
                                            "delivery_type",
                                            filters.delivery_type === opt.value
                                                ? ""
                                                : opt.value,
                                        )
                                    }
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all
                                        ${
                                            filters.delivery_type === opt.value
                                                ? opt.classes +
                                                  " ring-1 ring-inset ring-current"
                                                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Delivery Status segment */}
                        <div className="flex items-center gap-1">
                            <span className="mr-1 text-xs font-medium text-gray-500">
                                D.Status:
                            </span>
                            <button
                                onClick={() =>
                                    handleFilter("delivery_status", "")
                                }
                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all
                                    ${
                                        !filters.delivery_status
                                            ? "bg-gray-700 text-white"
                                            : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                All
                            </button>
                            {DELIVERY_STATUS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() =>
                                        handleFilter(
                                            "delivery_status",
                                            filters.delivery_status ===
                                                opt.value
                                                ? ""
                                                : opt.value,
                                        )
                                    }
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all
                                        ${
                                            filters.delivery_status ===
                                            opt.value
                                                ? opt.classes +
                                                  " ring-1 ring-inset ring-current"
                                                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
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
