import { Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Eye, Pencil, Trash2, RotateCcw, Paperclip } from "lucide-react";
import { confirmAction } from "@/lib/confirm";
import { toast } from "sonner";

interface InvestmentType {
    id: number;
    name: string;
}

interface Investment {
    id: number;
    title: string;
    investor_name: string;
    amount: string;
    investment_date: string;
    reference: string | null;
    attachment: string | null;
    status: "active" | "withdrawn";
    investment_type: InvestmentType;
    creator: { id: number; name: string } | null;
    deleted_at: string | null;
    created_at: string;
}

interface Props {
    investments: {
        data: Investment[];
        links: any[];
        meta: any;
    };
    can: {
        edit: boolean;
        delete: boolean;
        restore: boolean;
    };
    onEdit: (investment: Investment) => void;
}

function formatCurrency(value: string | number): string {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default function InvestmentTable({ investments, can, onEdit }: Props) {
    async function handleDelete(investment: Investment) {
        const ok = await confirmAction({
            title: "Delete Investment",
            text: `Are you sure you want to delete "${investment.title}"?`,
            confirmButtonText: "Yes, Delete",
        });
        if (!ok) return;

        router.delete(route("backend.investments.destroy", investment.id), {
            preserveScroll: true,
            onSuccess: () => toast.success("Investment deleted successfully."),
        });
    }

    async function handleRestore(investment: Investment) {
        const ok = await confirmAction({
            title: "Restore Investment",
            text: `Restore "${investment.title}"?`,
            confirmButtonText: "Yes, Restore",
        });
        if (!ok) return;

        router.post(
            route("backend.investments.restore", investment.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success("Investment restored successfully."),
            },
        );
    }

    const data = investments.data ?? [];
    const meta = investments.meta ?? {};
    const links = investments.links ?? [];

    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Title / Investor
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Ref / Attach
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-10 text-center text-sm text-gray-400"
                                >
                                    No investments found.
                                </td>
                            </tr>
                        ) : (
                            data.map((investment, index) => {
                                const isTrashed = !!investment.deleted_at;
                                const isActive = investment.status === "active";
                                const rowNum =
                                    ((meta.current_page ?? 1) - 1) *
                                        (meta.per_page ?? 15) +
                                    index +
                                    1;

                                return (
                                    <tr
                                        key={investment.id}
                                        className={`hover:bg-gray-50 transition-colors ${isTrashed ? "opacity-60" : ""}`}
                                    >
                                        {/* # */}
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                            {rowNum}
                                        </td>

                                        {/* Title / Investor */}
                                        <td className="px-4 py-3">
                                            <Link
                                                href={route(
                                                    "backend.investments.show",
                                                    investment.id,
                                                )}
                                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                            >
                                                {investment.title}
                                            </Link>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {investment.investor_name}
                                            </p>
                                        </td>

                                        {/* Type */}
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {investment.investment_type?.name ??
                                                "—"}
                                        </td>

                                        {/* Amount */}
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-semibold text-green-700">
                                                ৳{" "}
                                                {formatCurrency(
                                                    investment.amount,
                                                )}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatDate(
                                                investment.investment_date,
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    isActive
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-amber-100 text-amber-700"
                                                }`}
                                            >
                                                {isActive
                                                    ? "Active"
                                                    : "Withdrawn"}
                                            </span>
                                        </td>

                                        {/* Ref / Attachment */}
                                        <td className="px-4 py-3">
                                            {investment.reference ? (
                                                <span className="text-xs font-mono text-gray-600">
                                                    {investment.reference}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-300">
                                                    —
                                                </span>
                                            )}
                                            {investment.attachment && (
                                                <Paperclip className="ml-1 inline h-3 w-3 text-gray-400" />
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* View */}
                                                <Link
                                                    href={route(
                                                        "backend.investments.show",
                                                        investment.id,
                                                    )}
                                                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>

                                                {isTrashed ? (
                                                    can.restore && (
                                                        <button
                                                            onClick={() =>
                                                                handleRestore(
                                                                    investment,
                                                                )
                                                            }
                                                            className="rounded-md p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                                                            title="Restore"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </button>
                                                    )
                                                ) : (
                                                    <>
                                                        {can.edit && (
                                                            <button
                                                                onClick={() =>
                                                                    onEdit(
                                                                        investment,
                                                                    )
                                                                }
                                                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        investment,
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
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {(meta?.last_page ?? 1) > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                    <p className="text-sm text-gray-500">
                        Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}{" "}
                        investments
                    </p>
                    <div className="flex items-center gap-1">
                        {links.map((link: any, i: number) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.visit(link.url, {
                                        preserveScroll: true,
                                    })
                                }
                                className={`rounded-md px-3 py-1.5 text-sm ${
                                    link.active
                                        ? "bg-indigo-600 text-white font-medium"
                                        : link.url
                                          ? "text-gray-600 hover:bg-gray-100"
                                          : "text-gray-300 cursor-not-allowed"
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
