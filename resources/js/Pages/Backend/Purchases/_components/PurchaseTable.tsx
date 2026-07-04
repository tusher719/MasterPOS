// resources/js/Pages/Backend/Purchases/_components/PurchaseTable.tsx

import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
    Eye,
    Pencil,
    Printer,
    Download,
    Copy,
    CreditCard,
    List,
    Activity,
    Trash2,
    RotateCcw,
    MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/lib/confirm";
import { PurchaseStatusBadge, PaymentStatusBadge } from "./StatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
    id: number;
    name: string;
}

interface Purchase {
    id: number;
    reference_no: string;
    purchase_date: string;
    purchase_status: string;
    payment_status: string;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    supplier: Supplier;
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
    from: number;
    to: number;
    total: number;
}

interface Can {
    create: boolean;
    edit: boolean;
    delete: boolean;
    restore: boolean;
    payment: boolean;
    export: boolean;
}

interface Props {
    purchases: Paginated<Purchase>;
    can: Can;
    selectedIds: number[];
    onSelect: (id: number) => void;
    onSelectAll: (ids: number[]) => void;
    onRecordPayment: (purchase: Purchase) => void;
    onViewPayments: (purchase: Purchase) => void;
}

// ─── Currency Helper ──────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
    return (
        "৳ " +
        Number(value).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────

function ActionMenu({
    purchase,
    can,
    onRecordPayment,
    onViewPayments,
}: {
    purchase: Purchase;
    can: Can;
    onRecordPayment: (purchase: Purchase) => void;
    onViewPayments: (purchase: Purchase) => void;
}) {
    const [open, setOpen] = useState(false);

    const isDeleted = !!purchase.deleted_at;
    const isCancelled = purchase.purchase_status === "cancelled";
    const isReceived = purchase.purchase_status === "received";
    const canEdit = can.edit && !isDeleted && !isCancelled && !isReceived;
    const canPay =
        can.payment &&
        !isDeleted &&
        purchase.due_amount > 0 &&
        purchase.payment_status !== "paid";

    async function handleDelete() {
        setOpen(false);
        const ok = await confirmAction({
            title: "Delete Purchase?",
            text: `Purchase ${purchase.reference_no} will be soft deleted.`,
            confirmButtonText: "Yes, delete it",
        });
        if (!ok) return;

        router.delete(route("backend.purchases.destroy", purchase.id), {
            preserveScroll: true,
            onSuccess: () => toast.success("Purchase deleted successfully."),
            onError: () => toast.error("Failed to delete purchase."),
        });
    }

    async function handleRestore() {
        setOpen(false);
        const ok = await confirmAction({
            title: "Restore Purchase?",
            text: `Purchase ${purchase.reference_no} will be restored.`,
            confirmButtonText: "Yes, restore it",
        });
        if (!ok) return;

        router.post(
            route("backend.purchases.restore", purchase.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success("Purchase restored successfully."),
                onError: () => toast.error("Failed to restore purchase."),
            },
        );
    }

    async function handleDuplicate() {
        setOpen(false);
        const ok = await confirmAction({
            title: "Duplicate Purchase?",
            text: `A new draft will be created from ${purchase.reference_no}.`,
            confirmButtonText: "Yes, duplicate it",
        });
        if (!ok) return;

        router.post(
            route("backend.purchases.duplicate", purchase.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success("Purchase duplicated successfully."),
                onError: () => toast.error("Failed to duplicate purchase."),
            },
        );
    }

    function handlePrint() {
        setOpen(false);
        window.open(
            route("backend.purchases.show", purchase.id) + "?print=1",
            "_blank",
        );
    }

    function handlePdf() {
        setOpen(false);
        window.open(route("backend.purchases.pdf", purchase.id), "_blank");
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
            >
                <MoreHorizontal className="h-4 w-4" />
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                    />

                    {/* Menu */}
                    <div
                        className="absolute right-0 z-20 mt-1 w-48 rounded-lg border
                                    border-gray-200 bg-white py-1 shadow-lg"
                    >
                        {/* View */}
                        <Link
                            href={route("backend.purchases.show", purchase.id)}
                            className="flex w-full items-center gap-2.5 px-3 py-2
                                       text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setOpen(false)}
                        >
                            <Eye className="h-4 w-4 text-gray-400" />
                            View
                        </Link>

                        {/* Edit */}
                        {canEdit && (
                            <Link
                                href={route(
                                    "backend.purchases.edit",
                                    purchase.id,
                                )}
                                className="flex w-full items-center gap-2.5 px-3 py-2
                                           text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                <Pencil className="h-4 w-4 text-gray-400" />
                                Edit
                            </Link>
                        )}

                        {/* Print */}
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex w-full items-center gap-2.5 px-3 py-2
                                       text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Printer className="h-4 w-4 text-gray-400" />
                            Print
                        </button>

                        {/* Download PDF */}
                        <button
                            type="button"
                            onClick={handlePdf}
                            className="flex w-full items-center gap-2.5 px-3 py-2
                                       text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Download className="h-4 w-4 text-gray-400" />
                            Download PDF
                        </button>

                        {/* Duplicate */}
                        {can.create && !isDeleted && (
                            <button
                                type="button"
                                onClick={handleDuplicate}
                                className="flex w-full items-center gap-2.5 px-3 py-2
                                           text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Copy className="h-4 w-4 text-gray-400" />
                                Duplicate
                            </button>
                        )}

                        {/* Divider */}
                        <div className="my-1 border-t border-gray-100" />

                        {/* Record Payment */}
                        {canPay && (
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    onRecordPayment(purchase);
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2
                                           text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <CreditCard className="h-4 w-4 text-gray-400" />
                                Record Payment
                            </button>
                        )}

                        {/* View Payments */}
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onViewPayments(purchase);
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2
                                       text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <List className="h-4 w-4 text-gray-400" />
                            View Payments
                        </button>

                        {/* Activity Log */}
                        <Link
                            href={
                                route("backend.activity-logs.index") +
                                `?subject_id=${purchase.id}&subject_type=Purchase`
                            }
                            className="flex w-full items-center gap-2.5 px-3 py-2
                                       text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setOpen(false)}
                        >
                            <Activity className="h-4 w-4 text-gray-400" />
                            Activity Log
                        </Link>

                        {/* Divider */}
                        <div className="my-1 border-t border-gray-100" />

                        {/* Delete / Restore */}
                        {!isDeleted && can.delete && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex w-full items-center gap-2.5 px-3 py-2
                                           text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        )}

                        {isDeleted && can.restore && (
                            <button
                                type="button"
                                onClick={handleRestore}
                                className="flex w-full items-center gap-2.5 px-3 py-2
                                           text-sm text-green-600 hover:bg-green-50 transition-colors"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Restore
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export default function PurchaseTable({
    purchases,
    can,
    selectedIds,
    onSelect,
    onSelectAll,
    onRecordPayment,
    onViewPayments,
}: Props) {
    const allIds = purchases.data.map((p) => p.id);
    const allSelected =
        allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
    const someSelected =
        allIds.some((id) => selectedIds.includes(id)) && !allSelected;

    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            {/* Checkbox */}
                            <th className="w-10 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => {
                                        if (el) el.indeterminate = someSelected;
                                    }}
                                    onChange={() =>
                                        onSelectAll(allSelected ? [] : allIds)
                                    }
                                    className="rounded border-gray-300 text-indigo-600
                                               focus:ring-indigo-500 cursor-pointer"
                                />
                            </th>

                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Reference
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Supplier
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Date
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Status
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                Grand Total
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                Paid
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                Due
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Payment
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {purchases.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={10}
                                    className="px-4 py-10 text-center text-sm text-gray-400"
                                >
                                    No purchases found.
                                </td>
                            </tr>
                        ) : (
                            purchases.data.map((purchase) => (
                                <tr
                                    key={purchase.id}
                                    className={`transition-colors hover:bg-gray-50
                                        ${purchase.deleted_at ? "opacity-60 bg-red-50/30" : ""}
                                        ${selectedIds.includes(purchase.id) ? "bg-indigo-50/40" : ""}
                                    `}
                                >
                                    {/* Checkbox */}
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(
                                                purchase.id,
                                            )}
                                            onChange={() =>
                                                onSelect(purchase.id)
                                            }
                                            className="rounded border-gray-300 text-indigo-600
                                                       focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </td>

                                    {/* Reference */}
                                    <td className="px-4 py-3">
                                        <Link
                                            href={route(
                                                "backend.purchases.show",
                                                purchase.id,
                                            )}
                                            className="font-medium text-indigo-600 hover:text-indigo-800
                                                       transition-colors"
                                        >
                                            {purchase.reference_no}
                                        </Link>
                                        {purchase.deleted_at && (
                                            <span
                                                className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5
                                                             text-xs text-red-500"
                                            >
                                                Deleted
                                            </span>
                                        )}
                                    </td>

                                    {/* Supplier */}
                                    <td className="px-4 py-3 text-gray-700">
                                        {purchase.supplier?.name ?? "—"}
                                    </td>

                                    {/* Date */}
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                        {new Date(
                                            purchase.purchase_date,
                                        ).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </td>

                                    {/* Purchase Status */}
                                    <td className="px-4 py-3">
                                        <PurchaseStatusBadge
                                            status={purchase.purchase_status}
                                        />
                                    </td>

                                    {/* Grand Total */}
                                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                                        {formatCurrency(purchase.grand_total)}
                                    </td>

                                    {/* Paid */}
                                    <td className="px-4 py-3 text-right text-green-700">
                                        {formatCurrency(purchase.paid_amount)}
                                    </td>

                                    {/* Due */}
                                    <td className="px-4 py-3 text-right text-red-500">
                                        {formatCurrency(purchase.due_amount)}
                                    </td>

                                    {/* Payment Status */}
                                    <td className="px-4 py-3">
                                        <PaymentStatusBadge
                                            status={purchase.payment_status}
                                        />
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3 text-center">
                                        <ActionMenu
                                            purchase={purchase}
                                            can={can}
                                            onRecordPayment={onRecordPayment}
                                            onViewPayments={onViewPayments}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {purchases.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-500">
                        Showing {purchases.from}–{purchases.to} of{" "}
                        {purchases.total} results
                    </p>

                    <div className="flex items-center gap-1">
                        {purchases.links.map((link, i) => (
                            <button
                                key={i}
                                type="button"
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                                className={`rounded-md px-2.5 py-1 text-xs transition-colors
                                    ${
                                        link.active
                                            ? "bg-indigo-600 text-white"
                                            : "text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
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
