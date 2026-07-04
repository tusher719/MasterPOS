// resources/js/Pages/Backend/Purchases/_components/PaymentModal.tsx

import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { X, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentMethod {
    id: number;
    name: string;
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
    paymentMethods: PaymentMethod[];
    onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentModal({
    purchase,
    paymentMethods,
    onClose,
}: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        payment_method_id: "" as number | "",
        amount: purchase.due_amount,
        payment_date: new Date().toISOString().split("T")[0],
        reference: "",
        note: "",
    });

    // Close on Escape key
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        post(route("backend.purchases.payments.store", purchase.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Payment recorded successfully.");
                reset();
                onClose();
            },
            onError: () => {
                toast.error("Failed to record payment. Please check the form.");
            },
        });
    }

    function formatCurrency(value: number): string {
        return (
            "৳ " +
            Number(value).toLocaleString("en-BD", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
        );
    }

    function inputClass(error?: string) {
        return `w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1
            ${
                error
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            }`;
    }

    return (
        // ── Overlay ──────────────────────────────────────────────────────────
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-base font-semibold text-gray-800">
                            Record Payment
                        </h2>
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
                    <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {purchase.reference_no}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-xs text-gray-500">Grand Total</p>
                            <p className="text-sm font-semibold text-gray-800">
                                {formatCurrency(purchase.grand_total)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Paid</p>
                            <p className="text-sm font-semibold text-green-600">
                                {formatCurrency(purchase.paid_amount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Due</p>
                            <p className="text-sm font-semibold text-red-500">
                                {formatCurrency(purchase.due_amount)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Form ─────────────────────────────────────────────────── */}
                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    {/* Amount */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Amount (৳) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min={0.01}
                            max={purchase.due_amount}
                            step="0.01"
                            value={data.amount}
                            onChange={(e) =>
                                setData(
                                    "amount",
                                    parseFloat(e.target.value) || 0,
                                )
                            }
                            className={inputClass(errors.amount)}
                        />
                        {errors.amount && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                {errors.amount}
                            </p>
                        )}
                        {/* Quick fill buttons */}
                        <div className="mt-1.5 flex gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setData("amount", purchase.due_amount)
                                }
                                className="rounded border border-gray-200 px-2 py-0.5
                                           text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Full Due
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setData(
                                        "amount",
                                        parseFloat(
                                            (purchase.due_amount / 2).toFixed(
                                                2,
                                            ),
                                        ),
                                    )
                                }
                                className="rounded border border-gray-200 px-2 py-0.5
                                           text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Half
                            </button>
                        </div>
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Payment Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={data.payment_date}
                            onChange={(e) =>
                                setData("payment_date", e.target.value)
                            }
                            className={inputClass(errors.payment_date)}
                        />
                        {errors.payment_date && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                {errors.payment_date}
                            </p>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Payment Method
                        </label>
                        <select
                            value={data.payment_method_id}
                            onChange={(e) =>
                                setData(
                                    "payment_method_id",
                                    Number(e.target.value) || "",
                                )
                            }
                            className={inputClass(errors.payment_method_id)}
                        >
                            <option value="">Select method…</option>
                            {paymentMethods.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                        {errors.payment_method_id && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                {errors.payment_method_id}
                            </p>
                        )}
                    </div>

                    {/* Reference */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Reference
                            <span className="ml-1 text-xs text-gray-400">
                                (cheque no, txn id…)
                            </span>
                        </label>
                        <input
                            type="text"
                            value={data.reference}
                            onChange={(e) =>
                                setData("reference", e.target.value)
                            }
                            placeholder="Optional reference…"
                            className={inputClass(errors.reference)}
                        />
                        {errors.reference && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                {errors.reference}
                            </p>
                        )}
                    </div>

                    {/* Note */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Note
                        </label>
                        <textarea
                            rows={2}
                            value={data.note}
                            onChange={(e) => setData("note", e.target.value)}
                            placeholder="Optional note…"
                            className={inputClass(errors.note)}
                        />
                        {errors.note && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                {errors.note}
                            </p>
                        )}
                    </div>

                    {/* ── Footer ───────────────────────────────────────────── */}
                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2
                                       text-sm font-medium text-gray-700 hover:bg-gray-50
                                       disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium
                                       text-white hover:bg-indigo-700 disabled:opacity-50
                                       transition-colors"
                        >
                            {processing ? "Saving…" : "Record Payment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
