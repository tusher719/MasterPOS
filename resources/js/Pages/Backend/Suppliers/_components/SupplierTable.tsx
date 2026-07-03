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
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            #
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Name
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Company
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Contact
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            City / Country
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Opening Balance
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Status
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {suppliers.data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={8}
                                className="px-4 py-10 text-center text-gray-400"
                            >
                                No suppliers found.
                            </td>
                        </tr>
                    ) : (
                        suppliers.data.map((supplier, index) => (
                            <tr
                                key={supplier.id}
                                className={
                                    supplier.deleted_at
                                        ? "bg-red-50/40"
                                        : "hover:bg-gray-50"
                                }
                            >
                                <td className="px-4 py-3 text-gray-500">
                                    {(suppliers.current_page - 1) *
                                        suppliers.per_page +
                                        index +
                                        1}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-800">
                                    {supplier.name}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {supplier.company ?? (
                                        <span className="text-gray-300">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    <div>
                                        {supplier.email ?? (
                                            <span className="text-gray-300">
                                                —
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {supplier.phone ?? ""}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {[supplier.city, supplier.country]
                                        .filter(Boolean)
                                        .join(", ") || (
                                        <span className="text-gray-300">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-700 font-medium">
                                    ৳
                                    {Number(supplier.opening_balance).toFixed(
                                        2,
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {supplier.deleted_at ? (
                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                                            Deleted
                                        </span>
                                    ) : supplier.is_active ? (
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                                            Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        {supplier.deleted_at ? (
                                            canRestore && (
                                                <button
                                                    onClick={() =>
                                                        handleRestore(supplier)
                                                    }
                                                    className="rounded-md p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
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
                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
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
                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
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

            {/* Pagination */}
            {suppliers.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                    <p className="text-sm text-gray-500">
                        Showing{" "}
                        {(suppliers.current_page - 1) * suppliers.per_page + 1}–
                        {Math.min(
                            suppliers.current_page * suppliers.per_page,
                            suppliers.total,
                        )}{" "}
                        of {suppliers.total} suppliers
                    </p>
                    <div className="flex gap-1">
                        {suppliers.links.map((link, i) => (
                            <button
                                key={i}
                                onClick={() => handlePageChange(link.url)}
                                disabled={!link.url}
                                className={`rounded px-3 py-1 text-sm ${
                                    link.active
                                        ? "bg-indigo-600 text-white"
                                        : "text-gray-500 hover:bg-gray-100 disabled:opacity-40"
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
