// resources/js/Pages/Backend/POS/Sales/_components/CollectCodPaymentModal.tsx
//
// Item 4.5 — COD Delivery + Payment Collection modal.
// Triggered from SaleTable row action for COD orders that are not yet delivered.
// Single combined action: marks delivered + creates SalePayment entry.

import { router } from "@inertiajs/react";
import { PackageCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaymentMethodBank {
    id: number;
    bank_name: string;
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

interface CodSale {
    id: number;
    reference_no: string;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    customer: { name: string } | null;
}

interface Props {
    sale: CodSale;
    paymentMethods: PaymentMethod[];
    onClose: () => void;
}

// ── Charge helpers ────────────────────────────────────────────────────────────

function calcMethodCharge(method: PaymentMethod, base: number): number {
    if (!method.charge_enabled) return 0;
    if (method.online_charge_type === "percent")
        return parseFloat(
            ((base * method.online_charge_value) / 100).toFixed(2),
        );
    if (method.online_charge_type === "fixed")
        return Number(method.online_charge_value);
    return 0;
}

function calcBankCharge(bank: PaymentMethodBank, base: number): number {
    if (!bank.charge_enabled) return 0;
    if (bank.charge_type === "percent")
        return parseFloat(((base * bank.charge_value) / 100).toFixed(2));
    if (bank.charge_type === "fixed") return Number(bank.charge_value);
    return 0;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CollectCodPaymentModal({
    sale,
    paymentMethods,
    onClose,
}: Props) {
    const today = new Date().toISOString().split("T")[0];

    // Form state
    const [amount, setAmount] = useState(
        sale.due_amount > 0
            ? sale.due_amount.toFixed(2)
            : sale.grand_total.toFixed(2),
    );
    const [paymentMethodId, setPaymentMethodId] = useState<number | "">("");
    const [paymentMethodBankId, setPaymentMethodBankId] = useState<number | "">(
        "",
    );
    const [paymentCharge, setPaymentCharge] = useState(0);
    const [transactionId, setTransactionId] = useState("");
    const [paymentReference, setPaymentReference] = useState("");
    const [collectionDate, setCollectionDate] = useState(today);
    const [note, setNote] = useState("");
    const [processing, setProcessing] = useState(false);

    const amountRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        amountRef.current?.focus();
    }, []);

    // ── Derived ──────────────────────────────────────────────────────────────
    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId);
    const isBankTransfer = selectedMethod?.type === "bank_transfer";
    const isMobileBanking = selectedMethod?.type === "mobile_banking";
    const activeBanks = selectedMethod?.banks.filter((b) => b.is_active) ?? [];
    const selectedBank = activeBanks.find((b) => b.id === paymentMethodBankId);

    // ── Charge recalculation on method / bank change ──────────────────────────
    const handleMethodChange = (id: number | "") => {
        setPaymentMethodId(id);
        setPaymentMethodBankId("");
        setTransactionId("");
        setPaymentReference("");

        if (!id) {
            setPaymentCharge(0);
            return;
        }
        const method = paymentMethods.find((m) => m.id === id);
        if (!method) {
            setPaymentCharge(0);
            return;
        }

        if (method.type === "bank_transfer") {
            setPaymentCharge(0); // applied at bank level
        } else {
            // charge base = collected amount (customer pays charge on top)
            const base = Math.max(0, Number(amount) || 0);
            setPaymentCharge(calcMethodCharge(method, base));
        }
    };

    const handleBankChange = (bankId: number | "") => {
        setPaymentMethodBankId(bankId);
        if (!bankId || !selectedMethod) {
            setPaymentCharge(0);
            return;
        }
        const bank = activeBanks.find((b) => b.id === bankId);
        if (!bank) {
            setPaymentCharge(0);
            return;
        }
        setPaymentCharge(
            calcBankCharge(bank, Math.max(0, Number(amount) || 0)),
        );
    };

    // Recompute charge when amount changes (charge is on the collected amount)
    const handleAmountChange = (val: string) => {
        setAmount(val);
        const base = Math.max(0, Number(val) || 0);
        if (isBankTransfer && selectedBank) {
            setPaymentCharge(calcBankCharge(selectedBank, base));
        } else if (selectedMethod && !isBankTransfer) {
            setPaymentCharge(calcMethodCharge(selectedMethod, base));
        }
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = () => {
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount <= 0) {
            toast.error("Enter a valid collected amount.");
            return;
        }
        if (!paymentMethodId) {
            toast.error("Select a payment method.");
            return;
        }
        if (isBankTransfer && !paymentMethodBankId) {
            toast.error("Select a bank for bank transfer.");
            return;
        }
        if (!collectionDate) {
            toast.error("Select a collection date.");
            return;
        }

        setProcessing(true);
        router.post(
            route("backend.pos.sales.collect-cod-payment", sale.id),
            {
                amount: parsedAmount,
                payment_method_id: paymentMethodId,
                payment_method_bank_id: paymentMethodBankId || null,
                payment_charge: paymentCharge,
                transaction_id: transactionId || null,
                payment_reference: paymentReference || null,
                collection_date: collectionDate,
                note: note || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        "Payment collected. Order marked as delivered.",
                    );
                    onClose();
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(
                        typeof first === "string"
                            ? first
                            : "Failed to collect payment.",
                    );
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    // ── UI ────────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <PackageCheck size={18} className="text-green-600" />
                        <div>
                            <h2 className="font-semibold text-gray-800">
                                Collect COD Payment
                            </h2>
                            <p className="text-xs text-gray-500">
                                {sale.reference_no}
                                {sale.customer && ` · ${sale.customer.name}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Order summary */}
                <div className="mx-5 mt-4 rounded-md bg-gray-50 px-4 py-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                        <span>Order Total</span>
                        <span className="font-medium text-gray-800">
                            ৳{Number(sale.grand_total).toFixed(2)}
                        </span>
                    </div>
                    {sale.paid_amount > 0 && (
                        <div className="mt-1 flex justify-between text-gray-600">
                            <span>Previously Paid</span>
                            <span className="text-green-700">
                                ৳{Number(sale.paid_amount).toFixed(2)}
                            </span>
                        </div>
                    )}
                    <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 font-medium">
                        <span className="text-gray-700">Due Amount</span>
                        <span className="text-amber-700">
                            ৳{Number(sale.due_amount).toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-4 px-5 py-4">
                    {/* Collected Amount */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Collected Amount{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            ref={amountRef}
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                       focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                            placeholder="0.00"
                        />
                        {Number(amount) < sale.due_amount &&
                            Number(amount) > 0 && (
                                <p className="mt-1 text-xs text-amber-600">
                                    Partial collection — remaining due: ৳
                                    {(sale.due_amount - Number(amount)).toFixed(
                                        2,
                                    )}
                                </p>
                            )}
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Payment Method{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={paymentMethodId}
                            onChange={(e) =>
                                handleMethodChange(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : "",
                                )
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                       focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                        >
                            <option value="">Select method…</option>
                            {paymentMethods.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Bank sub-list (bank_transfer only) */}
                    {isBankTransfer && activeBanks.length > 0 && (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Select Bank{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={paymentMethodBankId}
                                onChange={(e) =>
                                    handleBankChange(
                                        e.target.value
                                            ? Number(e.target.value)
                                            : "",
                                    )
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                           focus:border-indigo-500 focus:outline-none focus:ring-1
                                           focus:ring-indigo-500"
                            >
                                <option value="">Select bank…</option>
                                {activeBanks.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.bank_name}
                                        {b.charge_enabled &&
                                            ` (${b.charge_label ?? "charge applies"})`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Payment charge display */}
                    {paymentCharge > 0 && (
                        <div className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-sm">
                            <span className="text-amber-700">
                                {selectedMethod?.charge_label ??
                                    selectedBank?.charge_label ??
                                    "Payment Charge"}
                            </span>
                            <span className="font-medium text-amber-700">
                                +৳{paymentCharge.toFixed(2)}
                            </span>
                        </div>
                    )}

                    {/* Transaction ID (mobile_banking) */}
                    {isMobileBanking && (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
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
                                placeholder="TrxID…"
                            />
                        </div>
                    )}

                    {/* Payment Reference (bank_transfer) */}
                    {isBankTransfer && (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
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
                                placeholder="Reference / Cheque No."
                            />
                        </div>
                    )}

                    {/* 2-col: Collection Date + Note */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Collection Date{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={collectionDate}
                                onChange={(e) =>
                                    setCollectionDate(e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                           focus:border-indigo-500 focus:outline-none focus:ring-1
                                           focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Note
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                           focus:border-indigo-500 focus:outline-none focus:ring-1
                                           focus:ring-indigo-500"
                                placeholder="Optional…"
                            />
                        </div>
                    </div>

                    {/* Confirmation notice */}
                    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                        This action will mark the order as{" "}
                        <strong>Delivered</strong> and record the payment
                        immediately. Partial collection is allowed.
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm
                                   text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2
                                   text-sm font-semibold text-white hover:bg-green-700
                                   disabled:opacity-50"
                    >
                        <PackageCheck size={15} />
                        {processing
                            ? "Processing…"
                            : "Mark Delivered & Collect"}
                    </button>
                </div>
            </div>
        </div>
    );
}
