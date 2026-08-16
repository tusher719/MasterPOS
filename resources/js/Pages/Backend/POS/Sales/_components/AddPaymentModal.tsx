// resources/js/Pages/Backend/POS/Sales/_components/AddPaymentModal.tsx

import { router } from "@inertiajs/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PaymentMethodBank {
    id: number;
    bank_name: string;
    account_number: string | null;
    account_name: string | null;
    charge_type: "percent" | "fixed" | null;
    charge_value: number;
    charge_enabled: boolean;
    charge_label: string | null;
    is_active: boolean;
}

interface PaymentMethod {
    id: number;
    name: string;
    type: string | null;
    charge_enabled: boolean;
    online_charge_type: "percent" | "fixed" | null;
    online_charge_value: number;
    charge_label: string | null;
    banks: PaymentMethodBank[];
}

interface SaleSummary {
    id: number;
    reference_no: string;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    customer: { name: string } | null;
}

interface Props {
    sale: SaleSummary;
    paymentMethods: PaymentMethod[];
    onClose: () => void;
}

// ── Charge calculation helpers ────────────────────────────────────────────────

function calcMethodCharge(method: PaymentMethod, base: number): number {
    if (!method.charge_enabled) return 0;
    if (method.online_charge_type === "percent") {
        return (base * method.online_charge_value) / 100;
    }
    if (method.online_charge_type === "fixed") {
        return method.online_charge_value;
    }
    return 0;
}

function calcBankCharge(bank: PaymentMethodBank, base: number): number {
    if (!bank.charge_enabled) return 0;
    if (bank.charge_type === "percent") return (base * bank.charge_value) / 100;
    if (bank.charge_type === "fixed") return bank.charge_value;
    return 0;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AddPaymentModal({
    sale,
    paymentMethods,
    onClose,
}: Props) {
    const [amount, setAmount] = useState<string>(
        sale.due_amount > 0 ? sale.due_amount.toFixed(2) : "",
    );
    const [methodId, setMethodId] = useState<string>("");
    const [bankId, setBankId] = useState<string>("");
    const [paymentCharge, setPaymentCharge] = useState<number>(0);
    const [chargeLabel, setChargeLabel] = useState<string>("");
    const [transactionId, setTransactionId] = useState<string>("");
    const [paymentReference, setPaymentReference] = useState<string>("");
    const [paymentDate, setPaymentDate] = useState<string>(
        new Date().toISOString().slice(0, 10),
    );
    const [note, setNote] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    const selectedMethod =
        paymentMethods.find((m) => m.id === Number(methodId)) ?? null;
    const selectedBank =
        selectedMethod?.banks.find((b) => b.id === Number(bankId)) ?? null;
    const isBankTransfer = selectedMethod?.type === "bank_transfer";
    const isMobileBanking = selectedMethod?.type === "mobile_banking";

    // ── Recalculate charge when method / bank / amount changes ───────────────
    useEffect(() => {
        const base = Number(amount) || 0;
        if (!selectedMethod) {
            setPaymentCharge(0);
            setChargeLabel("");
            return;
        }
        if (isBankTransfer && selectedBank) {
            const charge = calcBankCharge(selectedBank, base);
            setPaymentCharge(charge);
            setChargeLabel(selectedBank.charge_label ?? "Bank Charge");
        } else {
            const charge = calcMethodCharge(selectedMethod, base);
            setPaymentCharge(charge);
            setChargeLabel(selectedMethod.charge_label ?? "Payment Charge");
        }
    }, [amount, methodId, bankId]);

    // ── Reset bank when method changes ───────────────────────────────────────
    useEffect(() => {
        setBankId("");
        setTransactionId("");
        setPaymentReference("");
    }, [methodId]);

    const handleSubmit = () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Payment amount must be greater than zero.");
            return;
        }
        if (!methodId) {
            toast.error("Please select a payment method.");
            return;
        }
        if (isBankTransfer && !bankId) {
            toast.error("Please select a bank for bank transfer.");
            return;
        }
        if (!paymentDate) {
            toast.error("Payment date is required.");
            return;
        }

        setSubmitting(true);

        router.post(
            route("backend.pos.sales.add-payment", sale.id),
            {
                amount,
                payment_method_id: methodId,
                payment_method_bank_id: bankId || null,
                payment_charge: paymentCharge,
                transaction_id: transactionId || null,
                payment_reference: paymentReference || null,
                payment_date: paymentDate,
                note: note || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Payment recorded successfully.");
                    onClose();
                },
                onError: (errs) => {
                    const first = Object.values(errs)[0];
                    toast.error(first ?? "Failed to record payment.");
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const remainingAfter = Math.max(0, sale.due_amount - Number(amount || 0));

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Add Payment
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            {sale.reference_no}
                            {sale.customer && ` · ${sale.customer.name}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-5 py-4">
                    {/* Due amount hint */}
                    <div className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-sm">
                        <span className="text-amber-700">Current Due</span>
                        <span className="font-bold text-amber-700">
                            ৳{sale.due_amount.toFixed(2)}
                        </span>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Payment Amount{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                       focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                            placeholder="0.00"
                        />
                        {Number(amount) > 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                                Remaining after this payment:{" "}
                                <span
                                    className={
                                        remainingAfter > 0
                                            ? "text-amber-600 font-medium"
                                            : "text-green-600 font-medium"
                                    }
                                >
                                    ৳{remainingAfter.toFixed(2)}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Payment Method{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={methodId}
                            onChange={(e) => setMethodId(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                       focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                        >
                            <option value="">Select method...</option>
                            {paymentMethods.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Bank sub-list (bank_transfer only) */}
                    {isBankTransfer && selectedMethod && (
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                Select Bank{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={bankId}
                                onChange={(e) => setBankId(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                           focus:border-indigo-500 focus:outline-none focus:ring-1
                                           focus:ring-indigo-500"
                            >
                                <option value="">Select bank...</option>
                                {selectedMethod.banks
                                    .filter((b) => b.is_active)
                                    .map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.bank_name}
                                            {b.charge_enabled
                                                ? ` (${b.charge_label ?? "charge applies"})`
                                                : ""}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}

                    {/* Payment Charge display */}
                    {paymentCharge > 0 && (
                        <div className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-xs">
                            <span className="text-amber-700">
                                {chargeLabel}
                            </span>
                            <span className="font-semibold text-amber-700">
                                +৳{paymentCharge.toFixed(2)}
                            </span>
                        </div>
                    )}

                    {/* Transaction ID (mobile banking) */}
                    {isMobileBanking && (
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                Transaction ID
                            </label>
                            <input
                                type="text"
                                value={transactionId}
                                onChange={(e) =>
                                    setTransactionId(e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                           focus:border-indigo-500 focus:outline-none focus:ring-1
                                           focus:ring-indigo-500"
                                placeholder="e.g. 8N7XQ1234"
                            />
                        </div>
                    )}

                    {/* Payment Reference (bank transfer) */}
                    {isBankTransfer && (
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                Payment Reference
                            </label>
                            <input
                                type="text"
                                value={paymentReference}
                                onChange={(e) =>
                                    setPaymentReference(e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                           focus:border-indigo-500 focus:outline-none focus:ring-1
                                           focus:ring-indigo-500"
                                placeholder="e.g. TXN-20260815"
                            />
                        </div>
                    )}

                    {/* Payment Date */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Payment Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                       focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                        />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Note
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                       focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                            placeholder="Optional note..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm
                                   text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold
                                   text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {submitting ? "Saving..." : "Record Payment"}
                    </button>
                </div>
            </div>
        </div>
    );
}
