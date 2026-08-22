// resources/js/Pages/Backend/PreOrders/Index.tsx

import { AppDateRangeInput, DEFAULT_PERIOD_PRESETS } from "@/Components/DatePicker";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    PreOrder,
    PreOrderFilters,
    PreOrderIndexProps,
    PreOrderStatus,
} from "@/types/pre-order";
import {
    PRE_ORDER_STATUS_COLORS,
    PRE_ORDER_STATUS_LABELS,
    PRE_ORDER_STATUS_OPTIONS,
} from "@/types/pre-order-colors";
import { Head, router } from "@inertiajs/react";
import {
    AlertTriangle,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    Package,
    Plus,
    RotateCcw,
    Search,
    ShoppingCart,
    XCircle,
} from "lucide-react";
import { useState } from "react";
import CreatePreOrderModal from "./_components/CreatePreOrderModal";
import ConvertToSaleModal from "./_components/ConvertToSaleModal";
import UpdateStatusModal from "./_components/UpdateStatusModal";
import EditPreOrderModal from "./_components/EditPreOrderModal";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
                </div>
                <div className={`rounded-lg p-2 ${color}`}>
                    <Icon size={18} />
                </div>
            </div>
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PreOrderStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRE_ORDER_STATUS_COLORS[status]}`}
        >
            {PRE_ORDER_STATUS_LABELS[status]}
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PreOrdersIndex({
    preOrders,
    stats,
    filters,
    can,
}: PreOrderIndexProps) {
    const { data, meta, links } = {
        data:  preOrders?.data  ?? [],
        meta:  preOrders?.meta  ?? {},
        links: preOrders?.links ?? [],
    };

    // ── Filter state ──────────────────────────────────────────────────────────
    const [search,   setSearch]   = useState(filters.search   ?? "");
    const [status,   setStatus]   = useState(filters.status   ?? "");
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? "");
    const [dateTo,   setDateTo]   = useState(filters.date_to   ?? "");
    const [trashed,  setTrashed]  = useState(filters.trashed  ?? "");

    // ── Modal state ───────────────────────────────────────────────────────────
    const [showCreate,       setShowCreate]       = useState(false);
    const [editTarget,       setEditTarget]       = useState<PreOrder | null>(null);
    const [statusTarget,     setStatusTarget]     = useState<PreOrder | null>(null);
    const [convertTarget,    setConvertTarget]    = useState<PreOrder | null>(null);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const hasFilters = !!(search || status || dateFrom || dateTo || trashed);

    function applyFilters(overrides: Partial<PreOrderFilters> = {}) {
        router.get(
            route("backend.pre-orders.index"),
            {
                search:    search    || undefined,
                status:    status    || undefined,
                date_from: dateFrom  || undefined,
                date_to:   dateTo    || undefined,
                trashed:   trashed   || undefined,
                ...overrides,
            },
            { preserveScroll: true, replace: true },
        );
    }

    function resetFilters() {
        setSearch("");
        setStatus("");
        setDateFrom("");
        setDateTo("");
        setTrashed("");
        router.get(route("backend.pre-orders.index"), {}, { replace: true });
    }

    function handleDelete(preOrder: PreOrder) {
        if (!confirm(`Delete pre-order for "${preOrder.customer_name_snapshot}"?`)) return;
        router.delete(route("backend.pre-orders.destroy", preOrder.id), {
            preserveScroll: true,
        });
    }

    function handleRestore(preOrder: PreOrder) {
        router.post(
            route("backend.pre-orders.restore", preOrder.id),
            {},
            { preserveScroll: true },
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Pre-Orders" />

            <div className="space-y-6">

                {/* ── Page Header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Pre-Orders</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage bookings and advance orders
                        </p>
                    </div>
                    {can.create && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus size={16} />
                            New Pre-Order
                        </button>
                    )}
                </div>

                {/* ── Stats ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                    <StatCard label="Total"     value={stats.total}     icon={BookOpen}     color="bg-gray-100 text-gray-600"   />
                    <StatCard label="Pending"   value={stats.pending}   icon={Clock}        color="bg-amber-100 text-amber-600" />
                    <StatCard label="Confirmed" value={stats.confirmed} icon={CheckCircle2} color="bg-blue-100 text-blue-600"   />
                    <StatCard label="Ready"     value={stats.ready}     icon={Package}      color="bg-indigo-100 text-indigo-600"/>
                    <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle2} color="bg-green-100 text-green-600" />
                    <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle}      color="bg-red-100 text-red-600"     />
                    <StatCard label="Overdue"   value={stats.overdue}   icon={AlertTriangle} color="bg-orange-100 text-orange-600"/>
                </div>

                {/* ── Filters ──────────────────────────────────────────────── */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap gap-3">

                        {/* Search */}
                        <div className="relative min-w-[200px] flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search name, phone, product..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Date range */}
                        <div className="min-w-[260px]">
                            <AppDateRangeInput
                                startValue={dateFrom}
                                endValue={dateTo}
                                onStartChange={setDateFrom}
                                onEndChange={setDateTo}
                                onChange={(start, end) => {
                                    setDateFrom(start);
                                    setDateTo(end);
                                }}
                                presets={DEFAULT_PERIOD_PRESETS}
                            />
                        </div>

                        {/* Apply / Reset */}
                        <button
                            onClick={() => applyFilters()}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Apply
                        </button>
                        {hasFilters && (
                            <button
                                onClick={resetFilters}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Status filter row */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        {PRE_ORDER_STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    setStatus(opt.value);
                                    applyFilters({ status: opt.value });
                                }}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                    status === opt.value
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}

                        {/* Trashed toggle */}
                        <button
                            onClick={() => {
                                const next = trashed === "only" ? "" : "only";
                                setTrashed(next);
                                applyFilters({ trashed: next });
                            }}
                            className={`ml-auto rounded-full px-3 py-1 text-xs font-medium transition ${
                                trashed === "only"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                        >
                            {trashed === "only" ? "Showing Deleted" : "Show Deleted"}
                        </button>
                    </div>
                </div>

                {/* ── Table ────────────────────────────────────────────────── */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Booking Date</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Delivery Date</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500">Advance</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500">Due</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-sm text-gray-400">
                                        No pre-orders found.
                                    </td>
                                </tr>
                            ) : (
                                data.map((preOrder) => (
                                    <tr
                                        key={preOrder.id}
                                        className={`hover:bg-gray-50 ${preOrder.deleted_at ? "opacity-60" : ""}`}
                                    >
                                        {/* Customer */}
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-800">
                                                {preOrder.customer_name_snapshot}
                                            </p>
                                            {preOrder.customer_phone_snapshot && (
                                                <p className="text-xs text-gray-400">
                                                    {preOrder.customer_phone_snapshot}
                                                </p>
                                            )}
                                        </td>

                                        {/* Product */}
                                        <td className="px-4 py-3 text-gray-600">
                                            {preOrder.product_name_snapshot ?? (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>

                                        {/* Booking date */}
                                        <td className="px-4 py-3 text-gray-600">
                                            {preOrder.booking_date?.slice(0, 10)}
                                        </td>

                                        {/* Expected delivery */}
                                        <td className="px-4 py-3">
                                            {preOrder.expected_delivery_date ? (
                                                <span className="text-gray-600">
                                                    {preOrder.expected_delivery_date.slice(0, 10)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>

                                        {/* Total */}
                                        <td className="px-4 py-3 text-right font-medium text-gray-800">
                                            ৳{Number(preOrder.total_amount).toLocaleString()}
                                        </td>

                                        {/* Advance */}
                                        <td className="px-4 py-3 text-right text-green-700">
                                            ৳{Number(preOrder.advance_amount).toLocaleString()}
                                        </td>

                                        {/* Due */}
                                        <td className="px-4 py-3 text-right text-red-600">
                                            ৳{Number(preOrder.due_amount).toLocaleString()}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <StatusBadge status={preOrder.status} />
                                            {preOrder.linked_sale_id && (
                                                <span className="ml-1 text-xs text-indigo-500">
                                                    (Converted)
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            {preOrder.deleted_at ? (
                                                // Restored deleted row
                                                can.manage && (
                                                    <button
                                                        onClick={() => handleRestore(preOrder)}
                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw size={15} />
                                                    </button>
                                                )
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    {/* Edit */}
                                                    {can.manage && !preOrder.deleted_at && (
                                                        <button
                                                            onClick={() => setEditTarget(preOrder)}
                                                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                                                            title="Edit"
                                                        >
                                                            <Calendar size={15} />
                                                        </button>
                                                    )}

                                                    {/* Update status */}
                                                    {can.manage &&
                                                        !preOrder.deleted_at &&
                                                        !["delivered", "cancelled"].includes(preOrder.status) && (
                                                        <button
                                                            onClick={() => setStatusTarget(preOrder)}
                                                            className="rounded-md p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                                                            title="Update Status"
                                                        >
                                                            <CheckCircle2 size={15} />
                                                        </button>
                                                    )}

                                                    {/* Convert to sale */}
                                                    {can.manage &&
                                                        !preOrder.deleted_at &&
                                                        !preOrder.linked_sale_id &&
                                                        !preOrder.isCancelled &&
                                                        preOrder.status !== "cancelled" && (
                                                        <button
                                                            onClick={() => setConvertTarget(preOrder)}
                                                            className="rounded-md p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                                                            title="Convert to Sale"
                                                        >
                                                            <ShoppingCart size={15} />
                                                        </button>
                                                    )}

                                                    {/* Delete */}
                                                    {can.manage && (
                                                        <button
                                                            onClick={() => handleDelete(preOrder)}
                                                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                            title="Delete"
                                                        >
                                                            <XCircle size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ───────────────────────────────────────────── */}
                {(meta?.last_page ?? 1) > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                            Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total ?? 0}
                        </span>
                        <div className="flex gap-1">
                            {links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`rounded px-3 py-1 text-xs ${
                                        link.active
                                            ? "bg-indigo-600 text-white"
                                            : link.url
                                            ? "border border-gray-200 hover:bg-gray-50"
                                            : "cursor-not-allowed opacity-40"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ───────────────────────────────────────────────────── */}
            {showCreate && (
                <CreatePreOrderModal onClose={() => setShowCreate(false)} />
            )}
            {editTarget && (
                <EditPreOrderModal
                    preOrder={editTarget}
                    onClose={() => setEditTarget(null)}
                />
            )}
            {statusTarget && (
                <UpdateStatusModal
                    preOrder={statusTarget}
                    onClose={() => setStatusTarget(null)}
                />
            )}
            {convertTarget && (
                <ConvertToSaleModal
                    preOrder={convertTarget}
                    onClose={() => setConvertTarget(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
