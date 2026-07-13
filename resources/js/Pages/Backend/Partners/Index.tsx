import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Partner, PartnerIndexProps } from "@/types/partner";
import {
    PARTNER_STATUS_COLORS,
    PARTNER_TYPE_COLORS,
    PARTNER_TYPE_LABELS,
    getPartnerTypes,
} from "@/types/partner-colors";
import { Head, router } from "@inertiajs/react";
import {
    Eye,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    ShieldAlert,
    Trash2,
    Users,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import CreatePartnerModal from "./_components/CreatePartnerModal";
import EditPartnerModal from "./_components/EditPartnerModal";

export default function Index({
    partners,
    filters,
    stats,
    investmentOptions,
    can,
}: PartnerIndexProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [typeFilter, setTypeFilter] = useState(filters.type ?? "");
    const [statusFilter, setStatusFilter] = useState(filters.status ?? "");
    const [trashedFilter, setTrashedFilter] = useState(filters.trashed ?? "");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const {
        data = [],
        meta = { last_page: 1, from: 0, to: 0, total: 0 },
        links = {},
    } = partners ?? {};

    // -------------------------------------------------------------------------
    // Filtering
    // -------------------------------------------------------------------------

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            route("backend.partners.index"),
            {
                search,
                type: typeFilter,
                status: statusFilter,
                trashed: trashedFilter,
                ...overrides,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") applyFilters({ search });
    };

    const handleReset = () => {
        setSearch("");
        setTypeFilter("");
        setStatusFilter("");
        setTrashedFilter("");
        router.get(
            route("backend.partners.index"),
            {},
            { preserveState: false },
        );
    };

    // -------------------------------------------------------------------------
    // Selection
    // -------------------------------------------------------------------------

    const allIds = data.map((p) => p.id);
    const allSelected =
        allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

    const toggleAll = () => setSelectedIds(allSelected ? [] : allIds);
    const toggleOne = (id: number) =>
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    // -------------------------------------------------------------------------
    // Actions
    // -------------------------------------------------------------------------

    const handleDelete = (partner: Partner) => {
        Swal.fire({
            title: "Delete Partner?",
            text: `"${partner.name}" will be soft-deleted and can be restored later.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("backend.partners.destroy", { partner: partner.id }),
                    {
                        onSuccess: () =>
                            toast.success("Partner deleted successfully."),
                        onError: () => toast.error("Failed to delete partner."),
                    },
                );
            }
        });
    };

    const handleRestore = (partner: Partner) => {
        Swal.fire({
            title: "Restore Partner?",
            text: `"${partner.name}" will be restored.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#4f46e5",
            confirmButtonText: "Yes, restore it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route("backend.partners.restore", { id: partner.id }),
                    {},
                    {
                        onSuccess: () =>
                            toast.success("Partner restored successfully."),
                        onError: () =>
                            toast.error("Failed to restore partner."),
                    },
                );
            }
        });
    };

    const handleForceDelete = (partner: Partner) => {
        Swal.fire({
            title: "Permanently Delete?",
            text: `"${partner.name}" and all its linked data will be permanently removed. This cannot be undone.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, permanently delete!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("backend.partners.force-delete", { id: partner.id }),
                    {
                        onSuccess: () =>
                            toast.success("Partner permanently deleted."),
                        onError: () =>
                            toast.error(
                                "Failed to permanently delete partner.",
                            ),
                    },
                );
            }
        });
    };

    const handleBulkAction = (
        action: "delete" | "restore" | "force_delete",
    ) => {
        if (selectedIds.length === 0) {
            toast.error("No partners selected.");
            return;
        }

        const labels: Record<string, string> = {
            delete: "delete",
            restore: "restore",
            force_delete: "permanently delete",
        };

        Swal.fire({
            title: `Bulk ${labels[action]}?`,
            text: `This will ${labels[action]} ${selectedIds.length} selected partner(s).`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: `Yes, ${labels[action]}!`,
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route("backend.partners.bulk-action"),
                    { action, ids: selectedIds },
                    {
                        onSuccess: () => {
                            toast.success(
                                `Partners ${labels[action]}d successfully.`,
                            );
                            setSelectedIds([]);
                        },
                        onError: () => toast.error("Bulk action failed."),
                    },
                );
            }
        });
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <AuthenticatedLayout>
            <Head title="Partners" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-indigo-600" />
                        <h1 className="text-2xl font-bold text-gray-800">
                            Partners
                        </h1>
                    </div>
                    {can.create && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            Add Partner
                        </button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    {[
                        {
                            label: "Total",
                            value: stats.total,
                            color: "text-gray-800",
                        },
                        {
                            label: "Active",
                            value: stats.active,
                            color: "text-green-600",
                        },
                        {
                            label: "Capital",
                            value: stats.capital,
                            color: "text-blue-600",
                        },
                        {
                            label: "Working",
                            value: stats.working,
                            color: "text-purple-600",
                        },
                        {
                            label: "Product",
                            value: stats.product,
                            color: "text-orange-600",
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-lg border border-gray-200 bg-white p-4"
                        >
                            <p className="text-sm text-gray-500">
                                {stat.label}
                            </p>
                            <p
                                className={`mt-1 text-2xl font-bold ${stat.color}`}
                            >
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search name, code, phone, email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="w-full rounded-md border-gray-300 pl-9 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Type filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(
                                    e.target.value as typeof typeFilter,
                                );
                                applyFilters({ type: e.target.value });
                            }}
                            className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">All Types</option>
                            <option value="capital">Capital</option>
                            <option value="working">Working</option>
                            <option value="product">Product</option>
                        </select>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(
                                    e.target.value as typeof statusFilter,
                                );
                                applyFilters({ status: e.target.value });
                            }}
                            className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        {/* Trashed filter */}
                        {(can.restore || can.forceDelete) && (
                            <select
                                value={trashedFilter}
                                onChange={(e) => {
                                    setTrashedFilter(
                                        e.target.value as typeof trashedFilter,
                                    );
                                    applyFilters({ trashed: e.target.value });
                                }}
                                className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Active Records</option>
                                <option value="1">Deleted Records</option>
                            </select>
                        )}

                        <button
                            onClick={() => applyFilters({ search })}
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Search
                        </button>
                        <button
                            onClick={handleReset}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <span className="text-sm font-medium text-amber-800">
                            {selectedIds.length} selected
                        </span>
                        <div className="flex gap-2">
                            {can.delete && trashedFilter !== "1" && (
                                <button
                                    onClick={() => handleBulkAction("delete")}
                                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                >
                                    Bulk Delete
                                </button>
                            )}
                            {can.restore && trashedFilter === "1" && (
                                <button
                                    onClick={() => handleBulkAction("restore")}
                                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                                >
                                    Bulk Restore
                                </button>
                            )}
                            {can.forceDelete && trashedFilter === "1" && (
                                <button
                                    onClick={() =>
                                        handleBulkAction("force_delete")
                                    }
                                    className="rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900"
                                >
                                    Bulk Permanent Delete
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="ml-auto text-xs text-amber-700 hover:underline"
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="w-10 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Code
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Types
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Phone
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-12 text-center text-gray-400"
                                    >
                                        No partners found.
                                    </td>
                                </tr>
                            ) : (
                                data.map((partner) => (
                                    <tr
                                        key={partner.id}
                                        className={`hover:bg-gray-50 ${partner.deleted_at ? "opacity-60" : ""}`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(
                                                    partner.id,
                                                )}
                                                onChange={() =>
                                                    toggleOne(partner.id)
                                                }
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-xs text-gray-500">
                                                {partner.code ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            {partner.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {getPartnerTypes(partner).map(
                                                    (type) => (
                                                        <span
                                                            key={type}
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PARTNER_TYPE_COLORS[type]}`}
                                                        >
                                                            {
                                                                PARTNER_TYPE_LABELS[
                                                                    type
                                                                ]
                                                            }
                                                        </span>
                                                    ),
                                                )}
                                                {getPartnerTypes(partner)
                                                    .length === 0 && (
                                                    <span className="text-xs text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {partner.phone ?? "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {partner.deleted_at ? (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                                                    Deleted
                                                </span>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PARTNER_STATUS_COLORS[partner.is_active ? "active" : "inactive"]}`}
                                                >
                                                    {partner.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {!partner.deleted_at && (
                                                    <>
                                                        <a
                                                            href={route(
                                                                "backend.partners.show",
                                                                {
                                                                    partner:
                                                                        partner.id,
                                                                },
                                                            )}
                                                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                                                            title="View"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </a>
                                                        {can.edit && (
                                                            <button
                                                                onClick={() =>
                                                                    setEditingPartner(
                                                                        partner,
                                                                    )
                                                                }
                                                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        partner,
                                                                    )
                                                                }
                                                                className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {partner.deleted_at && (
                                                    <>
                                                        {can.restore && (
                                                            <button
                                                                onClick={() =>
                                                                    handleRestore(
                                                                        partner,
                                                                    )
                                                                }
                                                                className="rounded-md p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                                                                title="Restore"
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {can.forceDelete && (
                                                            <button
                                                                onClick={() =>
                                                                    handleForceDelete(
                                                                        partner,
                                                                    )
                                                                }
                                                                className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                                title="Permanently Delete"
                                                            >
                                                                <ShieldAlert className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {(meta?.last_page ?? 1) > 1 && (
                        <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between text-sm text-gray-500">
                            <span>
                                Showing {meta.from ?? 0}–{meta.to ?? 0} of{" "}
                                {meta.total ?? 0}
                            </span>
                            <div className="flex gap-1">
                                {partners.links &&
                                    Object.entries(partners.links).map(
                                        ([key, url]) => {
                                            if (!url) return null;
                                            const labels: Record<
                                                string,
                                                string
                                            > = {
                                                first: "«",
                                                prev: "‹",
                                                next: "›",
                                                last: "»",
                                            };
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() =>
                                                        router.get(
                                                            url as string,
                                                        )
                                                    }
                                                    className="rounded-md border border-gray-200 px-3 py-1 hover:bg-gray-50"
                                                >
                                                    {labels[key]}
                                                </button>
                                            );
                                        },
                                    )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreatePartnerModal onClose={() => setShowCreateModal(false)} />
            )}
            {editingPartner && (
                <EditPartnerModal
                    partner={editingPartner}
                    onClose={() => setEditingPartner(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
