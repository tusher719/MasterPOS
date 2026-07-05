import React from "react";
import { X, Printer, CheckCircle } from "lucide-react";
import { CartItemRow } from "./CartItem";

interface SaleResult {
    id: number;
    reference_no: string;
    sale_date: string;
    customer_name: string | null;
    payment_method: string | null;
    subtotal: number;
    discount: number;
    tax: number;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    payment_status: "paid" | "partial" | "due";
    items: CartItemRow[];
    note: string | null;
}

interface Props {
    sale: SaleResult;
    businessName: string;
    onClose: () => void;
    onNewSale: () => void;
}

const paymentStatusColors = {
    paid: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    due: "bg-red-100 text-red-600",
};

export default function ReceiptModal({
    sale,
    businessName,
    onClose,
    onNewSale,
}: Props) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl flex flex-col max-h-[90vh]">
                {/* ── Modal Header ── */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={20} className="text-green-500" />
                        <h2 className="font-semibold text-gray-800">
                            Sale Complete
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── Receipt Body ── */}
                <div
                    className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
                    id="receipt-print-area"
                >
                    {/* Business Name */}
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-800">
                            {businessName}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Sales Receipt
                        </p>
                    </div>

                    {/* Reference & Date */}
                    <div className="rounded-lg bg-gray-50 px-4 py-3 space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Reference</span>
                            <span className="font-medium text-gray-800">
                                {sale.reference_no}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Date</span>
                            <span className="text-gray-700">
                                {sale.sale_date}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Customer</span>
                            <span className="text-gray-700">
                                {sale.customer_name ?? "Walk-in Customer"}
                            </span>
                        </div>
                        {sale.payment_method && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                    Payment Method
                                </span>
                                <span className="text-gray-700">
                                    {sale.payment_method}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                            Items
                        </p>
                        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                            {sale.items.map((item) => (
                                <div
                                    key={item.product_id}
                                    className="flex justify-between px-3 py-2"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm text-gray-800">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {item.quantity} × ৳
                                            {item.unit_price.toFixed(2)}
                                            {item.discount > 0 && (
                                                <span className="ml-1 text-green-600">
                                                    − ৳
                                                    {item.discount.toFixed(2)}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <p className="ml-3 text-sm font-medium text-gray-800">
                                        ৳{item.subtotal.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="rounded-lg border border-gray-200 px-4 py-3 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>৳{sale.subtotal.toFixed(2)}</span>
                        </div>
                        {sale.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount</span>
                                <span>− ৳{sale.discount.toFixed(2)}</span>
                            </div>
                        )}
                        {sale.tax > 0 && (
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Tax</span>
                                <span>+ ৳{sale.tax.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-800">
                            <span>Grand Total</span>
                            <span>৳{sale.grand_total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Paid</span>
                            <span className="text-green-600 font-medium">
                                ৳{sale.paid_amount.toFixed(2)}
                            </span>
                        </div>
                        {sale.due_amount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Due</span>
                                <span className="font-medium text-red-600">
                                    ৳{sale.due_amount.toFixed(2)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Status</span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${paymentStatusColors[sale.payment_status]}`}
                            >
                                {sale.payment_status}
                            </span>
                        </div>
                    </div>

                    {/* Note */}
                    {sale.note && (
                        <div className="rounded-lg bg-amber-50 px-4 py-2">
                            <p className="text-xs text-amber-700">
                                <span className="font-medium">Note: </span>
                                {sale.note}
                            </p>
                        </div>
                    )}

                    {/* Thank you */}
                    <p className="text-center text-xs text-gray-400">
                        Thank you for your purchase!
                    </p>
                </div>

                {/* ── Modal Footer ── */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2
                                   text-sm text-gray-600 hover:bg-gray-50"
                    >
                        <Printer size={15} />
                        Print
                    </button>
                    <button
                        onClick={onNewSale}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold
                                   text-white hover:bg-indigo-700"
                    >
                        New Sale
                    </button>
                </div>
            </div>
        </div>
    );
}
