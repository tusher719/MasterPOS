// resources/js/Pages/Backend/Purchases/_components/BulkActionBar.tsx

import React, { useState } from "react";
import {
    Trash2,
    RotateCcw,
    Download,
    Printer,
    ChevronDown,
    X,
    Check,
} from "lucide-react";
import { confirmAction } from "@/lib/confirm";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseDueInfo {
    id: number;
    due_amount: number;
    purchase_status: string;
    payment_status: string;
}

interface Props {
    selectedIds: number[];
    purchases: PurchaseDueInfo[]; // ← ADD: minimal due_amount info for the currently loaded page
    onClear: () => void;
    showTrashed: boolean;
    can: {
        delete: boolean;
        restore: boolean;
        edit: boolean;
        export: boolean;
    };
}

const PURCHASE_STATUSES = [
    { value: "draft", label: "Draft" },
    { value: "ordered", label: "Ordered" },
    { value: "received", label: "Received" },
    { value: "partial_received", label: "Partial Received" },
    { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUSES = [
    { value: "paid", label: "Paid" },
    { value: "partial", label: "Partial" },
    { value: "due", label: "Due" },
];

export default function BulkActionBar({
    selectedIds,
    purchases,
    onClear,
    showTrashed,
    can,
}: Props) {
    const [purchaseStatusOpen, setPurchaseStatusOpen] = useState(false);
    const [paymentStatusOpen, setPaymentStatusOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    if (selectedIds.length === 0) return null;

    // ─── Due-amount Guard ─────────────────────────────────────────────────────
    // Any selected purchase that still has a due amount cannot be manually
    // marked as "paid" — that would falsify payment records instead of
    // going through the actual payment flow.
    const selectedHasDue = selectedIds.some((id) => {
        const p = purchases.find((row) => row.id === id);
        return p ? p.due_amount > 0 : false;
    });

    // ─── Current Status Indicator ────────────────────────────────────────────
    // If every selected purchase shares the same status, show a checkmark
    // next to that option so the user can see what's currently set.
    function getCommonStatus(
        field: "purchase_status" | "payment_status",
    ): string | null {
        if (selectedIds.length === 0) return null;
        const first = purchases.find((p) => p.id === selectedIds[0])?.[field];
        if (!first) return null;
        const allSame = selectedIds.every(
            (id) => purchases.find((p) => p.id === id)?.[field] === first,
        );
        return allSame ? first : null;
    }

    const selectedPurchaseStatus = getCommonStatus("purchase_status");
    const selectedPaymentStatus = getCommonStatus("payment_status");

    // ─── Bulk Action Handler ──────────────────────────────────────────────────

    async function handleBulkAction(
        action: string,
        value?: string,
        confirmTitle?: string,
        confirmText?: string,
    ) {
        const ok = await confirmAction({
            title: confirmTitle ?? "Are you sure?",
            text:
                confirmText ??
                `This will affect ${selectedIds.length} selected record(s).`,
            confirmButtonText: "Yes, proceed",
        });

        if (!ok) return;

        setLoading(true);

        router.post(
            route("backend.purchases.bulk-action"),
            { action, ids: selectedIds, value },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onClear();
                    toast.success("Bulk action completed successfully.");
                },
                onError: () => {
                    toast.error("Bulk action failed. Please try again.");
                },
                onFinish: () => {
                    setLoading(false);
                    setPurchaseStatusOpen(false);
                    setPaymentStatusOpen(false);
                },
            },
        );
    }

    // ─── Export Handler ───────────────────────────────────────────────────────

    function handleExport(format: "excel" | "csv" | "pdf") {
        const params = new URLSearchParams({
            ids: selectedIds.join(","),
            format,
        });
        window.open(
            route("backend.purchases.index") + "?" + params.toString(),
            "_blank",
        );
    }

    // ─── Print Handler ────────────────────────────────────────────────────────

    function handlePrint() {
        window.print();
    }

    return (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
            <div
                className="flex items-center gap-2 rounded-xl border border-gray-200
                            bg-white px-4 py-3 shadow-xl"
            >
                {/* Count Badge */}
                <span
                    className="mr-1 rounded-full bg-indigo-600 px-2.5 py-0.5
                                 text-xs font-semibold text-white"
                >
                    {selectedIds.length} selected
                </span>

                {/* ── Delete ────────────────────────────────────────────────── */}
                {can.delete && !showTrashed && (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                            handleBulkAction(
                                "delete",
                                undefined,
                                "Delete Selected?",
                                `${selectedIds.length} purchase(s) will be soft deleted.`,
                            )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200
                                   bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600
                                   hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                    </button>
                )}

                {/* ── Restore ───────────────────────────────────────────────── */}
                {can.restore && showTrashed && (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                            handleBulkAction(
                                "restore",
                                undefined,
                                "Restore Selected?",
                                `${selectedIds.length} purchase(s) will be restored.`,
                            )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-green-200
                                   bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700
                                   hover:bg-green-100 disabled:opacity-50 transition-colors"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                    </button>
                )}

                {/* ── Change Purchase Status ────────────────────────────────── */}
                {can.edit && (
                    <div className="relative">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => {
                                setPurchaseStatusOpen((v) => !v);
                                setPaymentStatusOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200
                                       bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700
                                       hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                            Purchase Status
                            <ChevronDown className="h-3.5 w-3.5" />
                        </button>

                        {purchaseStatusOpen && (
                            <div
                                className="absolute bottom-full left-0 mb-2 w-44 rounded-lg
                                            border border-gray-200 bg-white py-1 shadow-lg z-10"
                            >
                                {PURCHASE_STATUSES.map((s) => {
                                    const isCurrent =
                                        s.value === selectedPurchaseStatus;
                                    return (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() =>
                                                handleBulkAction(
                                                    "change_purchase_status",
                                                    s.value,
                                                    `Change to "${s.label}"?`,
                                                    `${selectedIds.length} purchase(s) will be updated.`,
                                                )
                                            }
                                            className="flex w-full items-center justify-between px-3 py-1.5
                                                       text-left text-xs text-gray-700 hover:bg-gray-50
                                                       transition-colors"
                                        >
                                            {s.label}
                                            {isCurrent && (
                                                <Check className="h-3.5 w-3.5 text-indigo-600" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Change Payment Status ─────────────────────────────────── */}
                {can.edit && (
                    <div className="relative">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => {
                                setPaymentStatusOpen((v) => !v);
                                setPurchaseStatusOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200
                                       bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700
                                       hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                            Payment Status
                            <ChevronDown className="h-3.5 w-3.5" />
                        </button>

                        {paymentStatusOpen && (
                            <div
                                className="absolute bottom-full left-0 mb-2 w-48 rounded-lg
                                            border border-gray-200 bg-white py-1 shadow-lg z-10"
                            >
                                {PAYMENT_STATUSES.map((s) => {
                                    const isPaidOption = s.value === "paid";
                                    const disabledOption =
                                        isPaidOption && selectedHasDue;
                                    const isCurrent =
                                        s.value === selectedPaymentStatus;

                                    return (
                                        <button
                                            key={s.value}
                                            type="button"
                                            disabled={disabledOption}
                                            title={
                                                disabledOption
                                                    ? "Some selected purchases still have a due amount. Record the full payment first."
                                                    : undefined
                                            }
                                            onClick={() =>
                                                !disabledOption &&
                                                handleBulkAction(
                                                    "change_payment_status",
                                                    s.value,
                                                    `Change to "${s.label}"?`,
                                                    `${selectedIds.length} purchase(s) will be updated.`,
                                                )
                                            }
                                            className={`flex w-full items-center justify-between px-3 py-1.5
                                                        text-left text-xs transition-colors
                                                ${
                                                    disabledOption
                                                        ? "cursor-not-allowed text-gray-300"
                                                        : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            <span>
                                                {s.label}
                                                {disabledOption && (
                                                    <span className="ml-1.5 text-[10px] text-gray-300">
                                                        (due pending)
                                                    </span>
                                                )}
                                            </span>
                                            {isCurrent && !disabledOption && (
                                                <Check className="h-3.5 w-3.5 text-indigo-600" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Export ────────────────────────────────────────────────── */}
                {can.export && (
                    <div className="relative group">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200
                                       bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700
                                       hover:bg-gray-100 transition-colors"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Export
                            <ChevronDown className="h-3.5 w-3.5" />
                        </button>

                        <div
                            className="absolute bottom-full left-0 mb-2 hidden w-32 rounded-lg
                                        border border-gray-200 bg-white py-1 shadow-lg
                                        group-hover:block z-10"
                        >
                            {(["excel", "csv", "pdf"] as const).map((fmt) => (
                                <button
                                    key={fmt}
                                    type="button"
                                    onClick={() => handleExport(fmt)}
                                    className="w-full px-3 py-1.5 text-left text-xs
                                               text-gray-700 hover:bg-gray-50 transition-colors uppercase"
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Print ─────────────────────────────────────────────────── */}
                {can.export && (
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200
                                   bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700
                                   hover:bg-gray-100 transition-colors"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Print
                    </button>
                )}

                {/* ── Divider + Clear ───────────────────────────────────────── */}
                <div className="mx-1 h-5 w-px bg-gray-200" />

                <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5
                               text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                    Clear
                </button>
            </div>
        </div>
    );
}
