import { Link, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { confirmAction } from "@/lib/confirm";

interface ExpenseCategory {
    id: number;
    name: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface Creator {
    id: number;
    name: string;
}

interface Expense {
    id: number;
    reference_no: string;
    title: string;
    expense_category_id: number;
    payment_method_id: number | null;
    amount: string;
    expense_date: string;
    reference: string | null;
    attachment: string | null;
    attachment_url: string | null;
    note: string | null;
    deleted_at: string | null;
    created_at: string;
    category: ExpenseCategory;
    payment_method: PaymentMethod | null;
    creator: Creator;
}

interface PaginatedExpenses {
    data: Expense[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Can {
    create: boolean;
    edit: boolean;
    delete: boolean;
    restore: boolean;
}

interface Props {
    expenses: PaginatedExpenses;
    can: Can;
    trashed: boolean;
    onEdit: (expense: Expense) => void;
}

function formatAmount(value: string | number): string {
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value));
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function ExpenseTable({
    expenses,
    can,
    trashed,
    onEdit,
}: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);

    const allIds = expenses.data.map((e) => e.id);
    const allSelected =
        allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

    function toggleAll() {
        setSelectedIds(allSelected ? [] : allIds);
    }

    function toggleOne(id: number) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }

    async function handleDelete(expense: Expense) {
        const ok = await confirmAction({
            title: "Delete Expense?",
            text: `"${expense.title}" will be moved to trash.`,
            confirmButtonText: "Yes, delete",
        });
        if (!ok) return;

        router.delete(route("backend.expenses.destroy", expense.id), {
            preserveScroll: true,
            onSuccess: () => toast.success("Expense moved to trash."),
            onError: () => toast.error("Failed to delete expense."),
        });
    }

    async function handleRestore(expense: Expense) {
        const ok = await confirmAction({
            title: "Restore Expense?",
            text: `"${expense.title}" will be restored.`,
            confirmButtonText: "Yes, restore",
        });
        if (!ok) return;

        router.post(
            route("backend.expenses.restore", expense.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Expense restored."),
                onError: () => toast.error("Failed to restore expense."),
            },
        );
    }

    async function handleBulkAction(action: "delete" | "restore") {
        if (selectedIds.length === 0) return;

        const label = action === "delete" ? "delete" : "restore";
        const ok = await confirmAction({
            title: `Bulk ${label}?`,
            text: `${selectedIds.length} expense(s) will be ${label}d.`,
            confirmButtonText: `Yes, ${label}`,
        });
        if (!ok) return;

        setBulkLoading(true);
        router.post(
            route("backend.expenses.bulk-action"),
            { action, ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    toast.success(
                        `${selectedIds.length} expense(s) ${label}d.`,
                    );
                },
                onError: () => toast.error(`Bulk ${label} failed.`),
                onFinish: () => setBulkLoading(false),
            },
        );
    }

    return (
        <div className="space-y-3">
            {/* Bulk action bar */}
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2.5">
                    <span className="text-sm font-medium text-indigo-700">
                        {selectedIds.length} selected
                    </span>
                    <div className="ml-auto flex gap-2">
                        {trashed && can.restore && (
                            <button
                                onClick={() => handleBulkAction("restore")}
                                disabled={bulkLoading}
                                className="rounded-md border border-green-200 bg-white px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                                Restore Selected
                            </button>
                        )}
                        {can.delete && (
                            <button
                                onClick={() => handleBulkAction("delete")}
                                disabled={bulkLoading}
                                className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                                Delete Selected
                            </button>
                        )}
                        <button
                            onClick={() => setSelectedIds([])}
                            className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500 hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="w-10 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reference
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Title / Category
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payment
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {expenses.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-12 text-center text-sm text-gray-400"
                                >
                                    No expenses found.
                                </td>
                            </tr>
                        ) : (
                            expenses.data.map((expense) => (
                                <tr
                                    key={expense.id}
                                    className={`hover:bg-gray-50 transition-colors ${
                                        expense.deleted_at ? "opacity-60" : ""
                                    }`}
                                >
                                    {/* Checkbox */}
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(
                                                expense.id,
                                            )}
                                            onChange={() =>
                                                toggleOne(expense.id)
                                            }
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </td>

                                    {/* Reference */}
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs text-indigo-600">
                                            {expense.reference_no}
                                        </span>
                                        {expense.deleted_at && (
                                            <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                                                Trashed
                                            </span>
                                        )}
                                    </td>

                                    {/* Title / Category */}
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-gray-800">
                                            {expense.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {expense.category.name}
                                        </p>
                                    </td>

                                    {/* Date */}
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {formatDate(expense.expense_date)}
                                    </td>

                                    {/* Payment method */}
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {expense.payment_method?.name ?? (
                                            <span className="text-gray-300">
                                                —
                                            </span>
                                        )}
                                    </td>

                                    {/* Amount */}
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-sm font-semibold text-gray-800">
                                            ৳ {formatAmount(expense.amount)}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            {/* View */}
                                            <Link
                                                href={route(
                                                    "backend.expenses.show",
                                                    expense.id,
                                                )}
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                title="View"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                    />
                                                </svg>
                                            </Link>

                                            {/* Edit */}
                                            {can.edit &&
                                                !expense.deleted_at && (
                                                    <button
                                                        onClick={() =>
                                                            onEdit(expense)
                                                        }
                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                        title="Edit"
                                                    >
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}

                                            {/* Restore */}
                                            {can.restore &&
                                                expense.deleted_at && (
                                                    <button
                                                        onClick={() =>
                                                            handleRestore(
                                                                expense,
                                                            )
                                                        }
                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                                                        title="Restore"
                                                    >
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}

                                            {/* Delete */}
                                            {can.delete &&
                                                !expense.deleted_at && (
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                expense,
                                                            )
                                                        }
                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                        title="Delete"
                                                    >
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
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

            {/* Pagination */}
            {expenses.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing{" "}
                        {(expenses.current_page - 1) * expenses.per_page + 1}–
                        {Math.min(
                            expenses.current_page * expenses.per_page,
                            expenses.total,
                        )}{" "}
                        of {expenses.total} expenses
                    </p>
                    <div className="flex gap-1">
                        {expenses.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? "#"}
                                preserveScroll
                                className={`rounded-md px-3 py-1.5 text-sm ${
                                    link.active
                                        ? "bg-indigo-600 text-white"
                                        : link.url
                                          ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                          : "border border-gray-100 text-gray-300 cursor-not-allowed"
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
