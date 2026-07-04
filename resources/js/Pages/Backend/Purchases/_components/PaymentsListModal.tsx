// resources/js/Pages/Backend/Purchases/_components/PaymentsListModal.tsx

import React from "react";
import { router } from "@inertiajs/react";
import { X, List, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/lib/confirm";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentMethod {
    id: number;
    name: string;
}

interface CreatedBy {
    id: number;
    name: string;
}

interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    reference: string | null;
    note: string | null;
    payment_method: PaymentMethod | null;
    created_by: CreatedBy | null;
    created_at: string;
}

interface Purchase {
    id: number;
    reference_no: string;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
}

interface Props {
    purchase: Purchase;
    payments: Payment[];
    canManage: boolean;
    onClose: () => void;
    onRecordNew: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
    return (
        "৳ " +
        Number(value).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentsListModal({
    purchase,
    payments,
    canManage,
    onClose,
    onRecordNew,
}: Props) {
    // Close on Escape key
    React.useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    async function handleDelete(payment: Payment) {
        const ok = await confirmAction({
            title: "Delete Payment?",
            text: `Payment of ${formatCurrency(payment.amount)} on ${formatDate(payment.payment_date)} will be removed.`,
            confirmButtonText: "Yes, delete it",
        });

        if (!ok) return;

        router.delete(
            route("backend.purchases.payments.destroy", {
                purchase: purchase.id,
                payment: payment.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Payment deleted successfully."),
                onError: () => toast.error("Failed to delete payment."),
            },
        );
    }

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        // ── Overlay ──────────────────────────────────────────────────────────
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <List className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-base font-semibold text-gray-800">
                            Payment History
                        </h2>
                        <span
                            className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs
                                         font-medium text-indigo-700"
                        >
                            {purchase.reference_no}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* ── Purchase Summary ──────────────────────────────────────── */}
                <div className="mx-5 mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-xs text-gray-500">Grand Total</p>
                            <p className="text-sm font-semibold text-gray-800">
                                {formatCurrency(purchase.grand_total)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total Paid</p>
                            <p className="text-sm font-semibold text-green-600">
                                {formatCurrency(purchase.paid_amount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Due</p>
                            <p
                                className={`text-sm font-semibold ${
                                    purchase.due_amount > 0
                                        ? "text-red-500"
                                        : "text-green-600"
                                }`}
                            >
                                {formatCurrency(purchase.due_amount)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Payments List ─────────────────────────────────────────── */}
                <div className="max-h-80 overflow-y-auto px-5 py-4">
                    {payments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CreditCard className="mb-2 h-8 w-8 text-gray-300" />
                            <p className="text-sm text-gray-400">
                                No payments recorded yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {payments.map((payment, index) => (
                                <div
                                    key={payment.id}
                                    className="flex items-start justify-between rounded-lg
                                               border border-gray-100 bg-white p-3 hover:bg-gray-50
                                               transition-colors"
                                >
                                    {/* Left: Payment Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Index */}
                                            <span
                                                className="flex h-5 w-5 shrink-0 items-center
                                                             justify-center rounded-full bg-indigo-100
                                                             text-xs font-medium text-indigo-700"
                                            >
                                                {index + 1}
                                            </span>

                                            {/* Amount */}
                                            <span className="text-sm font-semibold text-gray-800">
                                                {formatCurrency(
                                                    Number(payment.amount),
                                                )}
                                            </span>

                                            {/* Payment Method */}
                                            {payment.payment_method && (
                                                <span
                                                    className="rounded-full bg-blue-100 px-2 py-0.5
                                                                 text-xs text-blue-700"
                                                >
                                                    {
                                                        payment.payment_method
                                                            .name
                                                    }
                                                </span>
                                            )}

                                            {/* Date */}
                                            <span className="text-xs text-gray-500">
                                                {formatDate(
                                                    payment.payment_date,
                                                )}
                                            </span>
                                        </div>

                                        {/* Reference */}
                                        {payment.reference && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Ref: {payment.reference}
                                            </p>
                                        )}

                                        {/* Note */}
                                        {payment.note && (
                                            <p className="mt-0.5 truncate text-xs text-gray-400">
                                                {payment.note}
                                            </p>
                                        )}

                                        {/* Recorded by */}
                                        {payment.created_by && (
                                            <p className="mt-0.5 text-xs text-gray-400">
                                                Recorded by{" "}
                                                {payment.created_by.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Right: Delete */}
                                    {canManage && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDelete(payment)
                                            }
                                            className="ml-3 shrink-0 rounded-md p-1.5 text-gray-400
                                                       hover:bg-red-50 hover:text-red-500
                                                       transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Footer ───────────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
                    {/* Total paid summary */}
                    <p className="text-sm text-gray-600">
                        {payments.length} payment
                        {payments.length !== 1 ? "s" : ""} —
                        <span className="ml-1 font-semibold text-gray-800">
                            {formatCurrency(totalPaid)} total
                        </span>
                    </p>

                    <div className="flex items-center gap-2">
                        {/* Record New Payment */}
                        {canManage && purchase.due_amount > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onRecordNew();
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600
                                           px-3 py-2 text-sm font-medium text-white
                                           hover:bg-indigo-700 transition-colors"
                            >
                                <CreditCard className="h-4 w-4" />
                                Record Payment
                            </button>
                        )}

                        {/* Close */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2
                                       text-sm font-medium text-gray-700 hover:bg-gray-50
                                       transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
