import React from "react";

interface Customer {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface Props {
    customers: Customer[];
    paymentMethods: PaymentMethod[];
    customerId: number | null;
    paymentMethodId: number | null;
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

export default function CheckoutPanel({
    customers,
    paymentMethods,
    customerId,
    paymentMethodId,
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
    onDiscountChange,
    onTaxChange,
    onPaidAmountChange,
    onNoteChange,
    onCheckout,
}: Props) {
    return (
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
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

            {/* ── Payment Method ── */}
            <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                    Payment Method
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

            {/* ── Discount & Tax ── */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                        Discount (৳)
                    </label>
                    <input
                        type="number"
                        min={0}
                        max={subtotal}
                        value={discount || ""}
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
                        Tax (৳)
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={tax || ""}
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
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>৳{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>- ৳{discount.toFixed(2)}</span>
                    </div>
                )}
                {tax > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Tax</span>
                        <span>+ ৳{tax.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-800">
                    <span>Grand Total</span>
                    <span>৳{grandTotal.toFixed(2)}</span>
                </div>
            </div>

            {/* ── Paid Amount ── */}
            <div>
                <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-600">
                        Paid Amount (৳)
                    </label>
                    {/* Quick fill buttons */}
                    <div className="flex gap-1">
                        <button
                            onClick={() => onPaidAmountChange(grandTotal)}
                            className="rounded px-2 py-0.5 text-xs bg-green-100 text-green-700 hover:bg-green-200"
                        >
                            Full
                        </button>
                        <button
                            onClick={() =>
                                onPaidAmountChange(
                                    parseFloat((grandTotal / 2).toFixed(2)),
                                )
                            }
                            className="rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                            Half
                        </button>
                        <button
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
                    max={grandTotal}
                    value={paidAmount || ""}
                    onChange={(e) =>
                        onPaidAmountChange(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                               focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {/* ── Due Amount + Payment Status ── */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Due Amount</span>
                    <span className="font-semibold text-gray-800">
                        ৳{dueAmount.toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Status</span>
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${paymentStatusColors[paymentStatus]}`}
                    >
                        {paymentStatus}
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
                onClick={onCheckout}
                disabled={cartEmpty || processing}
                className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white
                           hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50
                           transition-colors"
            >
                {processing
                    ? "Processing..."
                    : `Complete Sale — ৳${grandTotal.toFixed(2)}`}
            </button>
        </div>
    );
}
