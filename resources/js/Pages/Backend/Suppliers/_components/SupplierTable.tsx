import { router } from "@inertiajs/react";
import { Pencil, Trash2, RotateCcw } from "lucide-react";
import { confirmAction } from "@/lib/confirm";
import { toast } from "sonner";

interface Supplier {
    id: number;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    country: string | null;
    opening_balance: string;
    is_active: boolean;
    deleted_at: string | null;
}

interface Props {
    suppliers: {
        data: Supplier[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search?: string;
        status?: string;
        trashed?: boolean;
    };
    canEdit: boolean;
    canDelete: boolean;
    canRestore: boolean;
    onEdit: (supplier: Supplier) => void;
}

export default function SupplierTable({
    suppliers,
    filters,
    canEdit,
    canDelete,
    canRestore,
    onEdit,
}: Props) {
    const handleDelete = async (supplier: Supplier) => {
        const ok = await confirmAction({
            title: "Delete Supplier?",
            text: `"${supplier.name}" will be soft deleted and can be restored later.`,
            confirmButtonText: "Yes, Delete",
        });
        if (!ok) return;

        router.delete(route("backend.suppliers.destroy", supplier.id), {
            preserveScroll: true,
            onSuccess: () => toast.success("Supplier deleted successfully."),
            onError: () => toast.error("Failed to delete supplier."),
        });
    };

    const handleRestore = async (supplier: Supplier) => {
        const ok = await confirmAction({
            title: "Restore Supplier?",
            text: `"${supplier.name}" will be restored and become active again.`,
            confirmButtonText: "Yes, Restore",
        });
        if (!ok) return;

        router.post(
            route("backend.suppliers.restore", supplier.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success("Supplier restored successfully."),
                onError: () => toast.error("Failed to restore supplier."),
            },
        );
    };

    const handlePageChange = (url: string | null) => {
        if (!url) return;
        router.get(url, {}, { preserveScroll: true });
    };

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                #
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Name
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Company
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Contact
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                City / Country
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Opening Balance
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Status
                            </th>
                            <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {suppliers.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-sm"
                                >
                                    No suppliers found matching current filters.
                                </td>
                            </tr>
                        ) : (
                            suppliers.data.map((supplier, index) => (
                                <tr
                                    key={supplier.id}
                                    className={`transition-colors ${
                                        supplier.deleted_at
                                            ? "bg-rose-50/50 dark:bg-rose-950/20"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                    }`}
                                >
                                    <td className="px-4 py-3.5 text-xs text-slate-400">
                                        {(suppliers.current_page - 1) *
                                            suppliers.per_page +
                                            index +
                                            1}
                                    </td>
                                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                                        {supplier.name}
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                                        {supplier.company ?? (
                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                                        <div>
                                            {supplier.email ?? (
                                                <span className="text-slate-300 dark:text-slate-600">
                                                    —
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {supplier.phone ?? ""}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-xs">
                                        {[supplier.city, supplier.country]
                                            .filter(Boolean)
                                            .join(", ") || (
                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-900 dark:text-slate-100 font-semibold font-mono">
                                        ৳
                                        {Number(supplier.opening_balance).toFixed(
                                            2,
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        {supplier.deleted_at ? (
                                            <span className="inline-flex items-center rounded-md bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                                                Deleted
                                            </span>
                                        ) : supplier.is_active ? (
                                            <span className="inline-flex items-center rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {supplier.deleted_at ? (
                                                canRestore && (
                                                    <button
                                                        onClick={() =>
                                                            handleRestore(supplier)
                                                        }
                                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw size={15} />
                                                    </button>
                                                )
                                            ) : (
                                                <>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() =>
                                                                onEdit(supplier)
                                                            }
                                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    supplier,
                                                                )
                                                            }
                                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-500 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={15} />
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
            </div>

            {/* Pagination */}
            {suppliers.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Showing{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {(suppliers.current_page - 1) * suppliers.per_page + 1}
                        </span>
                        –
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {Math.min(
                                suppliers.current_page * suppliers.per_page,
                                suppliers.total,
                            )}
                        </span>{" "}
                        of <span className="font-semibold text-slate-700 dark:text-slate-200">{suppliers.total}</span> suppliers
                    </p>
                    <div className="flex gap-1 flex-wrap">
                        {suppliers.links.map((link, i) => (
                            <button
                                key={i}
                                onClick={() => handlePageChange(link.url)}
                                disabled={!link.url}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                    link.active
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
