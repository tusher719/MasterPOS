import {
    AppDateRangeInput,
    DEFAULT_PERIOD_PRESETS,
} from "@/Components/DatePicker";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    PurchaseReturn,
    PurchaseReturnIndexProps,
    PurchaseReturnType,
} from "@/types/purchase-return";
import { router } from "@inertiajs/react";
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardList,
    Package,
    PackageX,
    Plus,
    RotateCcw,
    Trash2,
    Truck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import ConfirmReturnModal from "./_components/ConfirmReturnModal";
import CreateReturnModal from "./_components/CreateReturnModal";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    draft: "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<string, string> = {
    draft: "Draft",
    confirmed: "Confirmed",
};

const TYPE_COLORS: Record<PurchaseReturnType, string> = {
    supplier_return: "bg-blue-100 text-blue-700",
    damage_wastage: "bg-red-100 text-red-700",
};

const TYPE_LABELS: Record<PurchaseReturnType, string> = {
    supplier_return: "Supplier Return",
    damage_wastage: "Damage / Wastage",
};

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
        <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                        {value}
                    </p>
                </div>
                <div className={`rounded-lg p-2.5 ${color}`}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"}`}
        >
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

// ─── Type Badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: PurchaseReturnType }) {
    return (
        <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[type] ?? "bg-gray-100 text-gray-600"}`}
        >
            {TYPE_LABELS[type] ?? type}
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PurchaseReturnsIndex({
    returns,
    stats,
    filters,
    can,
}: PurchaseReturnIndexProps) {
    // ── Local state ──────────────────────────────────────────────────────────
    const [createOpen, setCreateOpen] = useState(false);
    const [confirmReturn, setConfirmReturn] = useState<PurchaseReturn | null>(
        null,
    );

    // Filter state — initialized from server-side filters
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [returnType, setReturnType] = useState(filters.return_type ?? "");
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? "");
    const [dateTo, setDateTo] = useState(filters.date_to ?? "");
    const [trashed, setTrashed] = useState(filters.trashed === "true");

    // ── Filter helpers ───────────────────────────────────────────────────────

    const applyFilters = (overrides: Partial<typeof filters> = {}) => {
        router.get(
            route("backend.purchase-returns.index"),
            {
                search,
                status,
                return_type: returnType,
                date_from: dateFrom,
                date_to: dateTo,
                trashed: trashed ? "true" : "",
                ...overrides,
            },
            { preserveScroll: true, replace: true },
        );
    };

    const resetFilters = () => {
        setSearch("");
        setStatus("");
        setReturnType("");
        setDateFrom("");
        setDateTo("");
        setTrashed(false);
        router.get(
            route("backend.purchase-returns.index"),
            {},
            { replace: true },
        );
    };

    const hasActiveFilter = !!(
        search ||
        status ||
        returnType ||
        dateFrom ||
        dateTo ||
        trashed
    );

    // ── Actions ──────────────────────────────────────────────────────────────

    const handleDelete = (pr: PurchaseReturn) => {
        Swal.fire({
            title: "Delete this return?",
            text: "Only draft returns can be deleted. This action can be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, delete it",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.delete(route("backend.purchase-returns.destroy", pr.id), {
                preserveScroll: true,
                onSuccess: () => toast.success("Return deleted."),
                onError: (e) =>
                    toast.error(e.delete ?? "Could not delete return."),
            });
        });
    };

    const handleRestore = (pr: PurchaseReturn) => {
        router.post(
            route("backend.purchase-returns.restore", pr.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Return restored."),
            },
        );
    };

    const meta = returns.meta ?? {};
    const isTrashView = trashed;

    return (
        <AuthenticatedLayout>
            <div className="space-y-6">
                {/* ── Page Header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Purchase Returns
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track supplier returns and damage/wastage write-offs
                        </p>
                    </div>

                    {can.create && !isTrashView && (
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus size={16} />
                            New Return
                        </button>
                    )}
                </div>

                {/* ── Stats Cards ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <StatCard
                        label="Total"
                        value={stats.total}
                        icon={ClipboardList}
                        color="bg-indigo-100 text-indigo-600"
                    />
                    <StatCard
                        label="Draft"
                        value={stats.draft}
                        icon={AlertTriangle}
                        color="bg-amber-100 text-amber-600"
                    />
                    <StatCard
                        label="Confirmed"
                        value={stats.confirmed}
                        icon={CheckCircle2}
                        color="bg-green-100 text-green-600"
                    />
                    <StatCard
                        label="Supplier Returns"
                        value={stats.supplier_returns}
                        icon={Truck}
                        color="bg-blue-100 text-blue-600"
                    />
                    <StatCard
                        label="Damage / Wastage"
                        value={stats.damage_wastage}
                        icon={PackageX}
                        color="bg-red-100 text-red-600"
                    />
                </div>

                {/* ── Filters ──────────────────────────────────────────────── */}
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    {/* Row 1 — search + date range */}
                    <div className="flex flex-wrap gap-3">
                        <input
                            type="text"
                            placeholder="Search by purchase reference..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && applyFilters({ search })
                            }
                            className="w-64 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                        <AppDateRangeInput
                            startValue={dateFrom}
                            endValue={dateTo}
                            onStartChange={setDateFrom}
                            onEndChange={setDateTo}
                            onChange={(s, e) => {
                                setDateFrom(s);
                                setDateTo(e);
                            }}
                            presets={DEFAULT_PERIOD_PRESETS}
                        />
                    </div>

                    {/* Row 2 — status + type pills */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Status filter */}
                        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                            {
                                // explicitly type options so opt.value matches state setter types
                            }
                            {(
                                [
                                    { label: "All", value: "" as "" | "draft" | "confirmed" },
                                    { label: "Draft", value: "draft" as "" | "draft" | "confirmed" },
                                    { label: "Confirmed", value: "confirmed" as "" | "draft" | "confirmed" },
                                ] as { label: string; value: "" | "draft" | "confirmed" }[]
                            ).map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setStatus(opt.value);
                                        applyFilters({ status: opt.value });
                                    }}
                                    className={`px-3 py-1.5 transition-colors ${
                                        status === opt.value
                                            ? "bg-indigo-600 text-white"
                                            : "bg-card text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Return type filter */}
                        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                            {[
                                { label: "All Types", value: "" as const },
                                {
                                    label: "Supplier Return",
                                    value: "supplier_return" as const,
                                },
                                {
                                    label: "Damage / Wastage",
                                    value: "damage_wastage" as const,
                                },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setReturnType(opt.value);
                                        applyFilters({
                                            return_type: opt.value,
                                        });
                                    }}
                                    className={`px-3 py-1.5 transition-colors ${
                                        returnType === opt.value
                                            ? "bg-indigo-600 text-white"
                                            : "bg-card text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Trashed toggle */}
                        <button
                            onClick={() => {
                                const next = !trashed;
                                setTrashed(next);
                                applyFilters({ trashed: next ? "true" : "" });
                            }}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                trashed
                                    ? "border-red-300 bg-red-50 text-red-600"
                                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                            }`}
                        >
                            <Trash2 size={14} />
                            Deleted
                        </button>

                        {hasActiveFilter && (
                            <button
                                onClick={resetFilters}
                                className="text-sm text-indigo-600 hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Table ────────────────────────────────────────────────── */}
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Purchase Ref
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Supplier
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Return Date
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Items
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                    Total Value
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Created By
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {returns.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="py-12 text-center text-muted-foreground"
                                    >
                                        <Package
                                            size={32}
                                            className="mx-auto mb-2 opacity-30"
                                        />
                                        No purchase returns found
                                    </td>
                                </tr>
                            ) : (
                                returns.data.map((pr) => (
                                    <tr
                                        key={pr.id}
                                        className={`hover:bg-muted/40 transition-colors ${pr.deleted_at ? "opacity-60" : ""}`}
                                    >
                                        <td className="px-4 py-3 font-mono text-xs text-foreground">
                                            {pr.purchase?.reference_no ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-foreground">
                                            {pr.purchase?.supplier?.name ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {pr.return_date}
                                        </td>
                                        <td className="px-4 py-3">
                                            <TypeBadge type={pr.return_type} />
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {pr.items_count ?? 0}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-foreground">
                                            ৳
                                            {Number(
                                                pr.total_return_value,
                                            ).toLocaleString("en-BD", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={pr.status} />
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {pr.created_by_user?.name ?? "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {/* Confirm button — draft only */}
                                                {can.confirm &&
                                                    pr.status === "draft" &&
                                                    !pr.deleted_at && (
                                                        <button
                                                            onClick={() =>
                                                                setConfirmReturn(
                                                                    pr,
                                                                )
                                                            }
                                                            className="rounded-md p-1.5 text-green-500 hover:bg-green-50 hover:text-green-700"
                                                            title="Confirm return"
                                                        >
                                                            <CheckCircle2
                                                                size={16}
                                                            />
                                                        </button>
                                                    )}

                                                {/* Delete button — draft + not trashed */}
                                                {can.delete &&
                                                    pr.status === "draft" &&
                                                    !pr.deleted_at && (
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(pr)
                                                            }
                                                            className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                                                            title="Delete return"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}

                                                {/* Restore button — trashed only */}
                                                {can.delete &&
                                                    pr.deleted_at && (
                                                        <button
                                                            onClick={() =>
                                                                handleRestore(
                                                                    pr,
                                                                )
                                                            }
                                                            className="rounded-md p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600"
                                                            title="Restore"
                                                        >
                                                            <RotateCcw
                                                                size={16}
                                                            />
                                                        </button>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ───────────────────────────────────────────── */}
                {(meta.last_page ?? 1) > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Page {meta.current_page} of {meta.last_page} —{" "}
                            {meta.total} records
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={!returns.links.prev}
                                onClick={() =>
                                    returns.links.prev &&
                                    router.get(returns.links.prev)
                                }
                                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                disabled={!returns.links.next}
                                onClick={() =>
                                    returns.links.next &&
                                    router.get(returns.links.next)
                                }
                                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ───────────────────────────────────────────────────── */}
            {createOpen && (
                <CreateReturnModal onClose={() => setCreateOpen(false)} />
            )}

            {confirmReturn && (
                <ConfirmReturnModal
                    purchaseReturn={confirmReturn}
                    onClose={() => setConfirmReturn(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
