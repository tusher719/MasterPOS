import { usePage } from "@inertiajs/react";
import { CreditCard, Landmark, Phone, Truck } from "lucide-react";
import {
    PaymentMethod,
    PaymentMethodBank,
    PaymentType,
    calcBankCharge,
} from "../Index";

interface Customer {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
}

interface Props {
    customers: Customer[];
    paymentMethods: PaymentMethod[];
    customerId: number | null;
    paymentMethodId: number | null;
    paymentMethodBankId: number | null;
    paymentType: PaymentType | null;
    paymentCharge: number;
    transactionId: string;
    paymentReference: string;
    discount: number;
    tax: number;
    paidAmount: number;
    note: string;
    subtotal: number;
    grandTotal: number;
    dueAmount: number;
    paymentStatus: "paid" | "partial" | "due";
    processing: boolean;
    cartEmpty: boolean;
    onCustomerChange: (id: number | null) => void;
    onPaymentMethodChange: (id: number | null) => void;
    onPaymentMethodBankChange: (id: number | null) => void;
    onPaymentTypeChange: (type: PaymentType) => void;
    onTransactionIdChange: (val: string) => void;
    onPaymentReferenceChange: (val: string) => void;
    onDiscountChange: (value: number) => void;
    onTaxChange: (value: number) => void;
    onPaidAmountChange: (value: number) => void;
    onNoteChange: (value: string) => void;
    onCheckout: () => void;
}

const paymentStatusColors = {
    paid: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    due: "bg-red-100 text-red-600",
};

const PAYMENT_TYPE_OPTIONS: {
    value: PaymentType;
    label: string;
    icon: React.ReactNode;
    short: string;
}[] = [
    {
        value: "full_paid",
        label: "Full Paid",
        short: "Full",
        icon: <CreditCard size={13} />,
    },
    {
        value: "half_paid",
        label: "Half Paid",
        short: "Half",
        icon: <Phone size={13} />,
    },
    {
        value: "cash_on_delivery",
        label: "Cash on Delivery",
        short: "COD",
        icon: <Truck size={13} />,
    },
];

export default function CheckoutPanel({
    customers,
    paymentMethods,
    customerId,
    paymentMethodId,
    paymentMethodBankId,
    paymentType,
    paymentCharge,
    transactionId,
    paymentReference,
    discount,
    tax,
    paidAmount,
    note,
    subtotal,
    grandTotal,
    dueAmount,
    paymentStatus,
    processing,
    cartEmpty,
    onCustomerChange,
    onPaymentMethodChange,
    onPaymentMethodBankChange,
    onPaymentTypeChange,
    onTransactionIdChange,
    onPaymentReferenceChange,
    onDiscountChange,
    onTaxChange,
    onPaidAmountChange,
    onNoteChange,
    onCheckout,
}: Props) {
    const { settings } = usePage().props as any;
    const currency = settings?.currency_symbol ?? "৳";

    // Normalize all decimals — Laravel serializes as strings
    const subtotalNum = Number(subtotal);
    const discountNum = Number(discount);
    const taxNum = Number(tax);
    const grandTotalNum = Number(grandTotal);
    const dueAmountNum = Number(dueAmount);
    const paidAmountNum = Number(paidAmount);
    const paymentChargeNum = Number(paymentCharge);

    const isCOD = paymentType === "cash_on_delivery";

    // Selected payment method object
    const selectedMethod =
        paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
    const isBankTransfer = selectedMethod?.type === "bank_transfer";
    const isMobileBanking = selectedMethod?.type === "mobile_banking";

    // Active banks for the selected bank_transfer method
    const activeBanks: PaymentMethodBank[] = isBankTransfer
        ? (selectedMethod?.banks ?? []).filter((b) => b.is_active)
        : [];

    const selectedBank =
        activeBanks.find((b) => b.id === paymentMethodBankId) ?? null;

    // Charge label to show
    const chargeLabel: string | null = (() => {
        if (paymentChargeNum <= 0) return null;
        if (isBankTransfer && selectedBank?.charge_label)
            return selectedBank.charge_label;
        if (!isBankTransfer && selectedMethod?.charge_label)
            return selectedMethod.charge_label;
        return "Payment Charge";
    })();

    return (
        <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
            {/* ── Customer Select ── */}
            <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                    Customer <span className="text-gray-400">(optional)</span>
                </label>
                <select
                    value={customerId ?? ""}
                    onChange={(e) =>
                        onCustomerChange(
                            e.target.value ? Number(e.target.value) : null,
                        )
                    }
                    className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm
                               focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    <option value="">Walk-in Customer</option>
                    {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ""}
                        </option>
                    ))}
                </select>
            </div>

            {/* ── Payment Type ── */}
            <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Payment Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                    {PAYMENT_TYPE_OPTIONS.map((opt) => {
                        const active = paymentType === opt.value;
                        const colorMap: Record<PaymentType, string> = {
                            full_paid:
                                "border-green-500 bg-green-50 text-green-700",
                            half_paid:
                                "border-amber-400 bg-amber-50 text-amber-700",
                            cash_on_delivery:
                                "border-indigo-500 bg-indigo-50 text-indigo-700",
                        };
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => onPaymentTypeChange(opt.value)}
                                className={`flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-2
                                           text-xs font-medium transition-all
                                           ${
                                               active
                                                   ? colorMap[opt.value]
                                                   : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                                           }`}
                            >
                                {opt.icon}
                                <span>{opt.short}</span>
                            </button>
                        );
                    })}
                </div>
                {paymentType && (
                    <p className="mt-1 text-center text-[11px] text-gray-400">
                        {PAYMENT_TYPE_OPTIONS.find(
                            (o) => o.value === paymentType,
                        )?.label ?? ""}
                    </p>
                )}
            </div>

            {/* ── Payment Method (hidden for COD) ── */}
            {!isCOD && (
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                        Payment Method <span className="text-red-400">*</span>
                    </label>
                    <select
                        value={paymentMethodId ?? ""}
                        onChange={(e) =>
                            onPaymentMethodChange(
                                e.target.value ? Number(e.target.value) : null,
                            )
                        }
                        className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm
                                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">Select method</option>
                        {paymentMethods.map((pm) => (
                            <option key={pm.id} value={pm.id}>
                                {pm.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* ── Bank Sub-list (bank_transfer only) ── */}
            {!isCOD && isBankTransfer && activeBanks.length > 0 && (
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                        Select Bank <span className="text-red-400">*</span>
                    </label>
                    <div className="space-y-1.5 rounded-md border border-gray-200 p-2">
                        {activeBanks.map((bank) => {
                            const selected = paymentMethodBankId === bank.id;
                            const base = Math.max(
                                0,
                                subtotalNum - discountNum + taxNum,
                            );
                            const charge = calcBankCharge(bank, base);
                            return (
                                <button
                                    key={bank.id}
                                    type="button"
                                    onClick={() =>
                                        onPaymentMethodBankChange(bank.id)
                                    }
                                    className={`flex w-full items-center justify-between rounded-md
                                               px-3 py-2 text-left text-sm transition-colors
                                               ${
                                                   selected
                                                       ? "border border-indigo-400 bg-indigo-50"
                                                       : "border border-transparent hover:bg-gray-50"
                                               }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Landmark
                                            size={13}
                                            className={
                                                selected
                                                    ? "text-indigo-600"
                                                    : "text-gray-400"
                                            }
                                        />
                                        <div>
                                            <p
                                                className={`text-xs font-medium ${selected ? "text-indigo-700" : "text-gray-700"}`}
                                            >
                                                {bank.bank_name}
                                            </p>
                                            {bank.account_number && (
                                                <p className="text-[11px] text-gray-400">
                                                    {bank.account_number}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {charge > 0 && (
                                        <span className="text-[11px] text-amber-600">
                                            +{currency}
                                            {charge.toFixed(2)}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Transaction ID (mobile banking) ── */}
            {!isCOD && isMobileBanking && (
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                        Transaction ID{" "}
                        <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => onTransactionIdChange(e.target.value)}
                        placeholder="e.g. 8N5X7ABCDE"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            )}

            {/* ── Payment Reference (bank transfer) ── */}
            {!isCOD && isBankTransfer && (
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                        Payment Reference{" "}
                        <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) =>
                            onPaymentReferenceChange(e.target.value)
                        }
                        placeholder="e.g. TRF-20260801"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            )}

            {/* ── Discount & Tax ── */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                        Discount ({currency})
                    </label>
                    <input
                        type="number"
                        min={0}
                        max={subtotalNum}
                        value={discountNum || ""}
                        onChange={(e) =>
                            onDiscountChange(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                        Tax ({currency})
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={taxNum || ""}
                        onChange={(e) =>
                            onTaxChange(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* ── Totals Breakdown ── */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>
                        {currency}
                        {subtotalNum.toFixed(2)}
                    </span>
                </div>
                {discountNum > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>
                            − {currency}
                            {discountNum.toFixed(2)}
                        </span>
                    </div>
                )}
                {taxNum > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Tax</span>
                        <span>
                            + {currency}
                            {taxNum.toFixed(2)}
                        </span>
                    </div>
                )}
                {paymentChargeNum > 0 && (
                    <div className="flex justify-between text-sm text-amber-600">
                        <span>{chargeLabel ?? "Payment Charge"}</span>
                        <span>
                            + {currency}
                            {paymentChargeNum.toFixed(2)}
                        </span>
                    </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-800">
                    <span>Grand Total</span>
                    <span>
                        {currency}
                        {grandTotalNum.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* ── Paid Amount (hidden for COD) ── */}
            {!isCOD && (
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-600">
                            Paid Amount ({currency})
                        </label>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() =>
                                    onPaidAmountChange(grandTotalNum)
                                }
                                className="rounded px-2 py-0.5 text-xs bg-green-100 text-green-700 hover:bg-green-200"
                            >
                                Full
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    onPaidAmountChange(
                                        parseFloat(
                                            (grandTotalNum / 2).toFixed(2),
                                        ),
                                    )
                                }
                                className="rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
                            >
                                Half
                            </button>
                            <button
                                type="button"
                                onClick={() => onPaidAmountChange(0)}
                                className="rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
                            >
                                None
                            </button>
                        </div>
                    </div>
                    <input
                        type="number"
                        min={0}
                        max={grandTotalNum}
                        value={paidAmountNum || ""}
                        onChange={(e) =>
                            onPaidAmountChange(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            )}

            {/* COD notice */}
            {isCOD && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5">
                    <p className="text-xs text-indigo-700">
                        <span className="font-semibold">
                            Cash on Delivery —
                        </span>{" "}
                        payment collected on delivery. No upfront payment
                        required.
                    </p>
                </div>
            )}

            {/* ── Due Amount + Payment Status ── */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-1.5">
                {!isCOD && (
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Due Amount</span>
                        <span className="font-semibold text-gray-800">
                            {currency}
                            {dueAmountNum.toFixed(2)}
                        </span>
                    </div>
                )}
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Status</span>
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize
                                    ${isCOD ? "bg-indigo-100 text-indigo-700" : paymentStatusColors[paymentStatus]}`}
                    >
                        {isCOD ? "COD" : paymentStatus}
                    </span>
                </div>
            </div>

            {/* ── Note ── */}
            <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                    Note <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                    value={note}
                    onChange={(e) => onNoteChange(e.target.value)}
                    rows={2}
                    placeholder="Any remarks..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                               focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {/* ── Checkout Button ── */}
            <button
                type="button"
                onClick={onCheckout}
                disabled={cartEmpty || processing || !paymentType}
                className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white
                           hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50
                           transition-colors"
            >
                {processing
                    ? "Processing..."
                    : `Complete Sale — ${currency}${grandTotalNum.toFixed(2)}`}
            </button>
        </div>
    );
}
