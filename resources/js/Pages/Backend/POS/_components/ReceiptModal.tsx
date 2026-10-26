import React from "react";
import { X, Printer, CheckCircle, ShieldCheck } from "lucide-react";
import { CartItemRow } from "./CartItem";

interface SaleResult {
    id: number;
    uuid?: string | null;
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
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
    partial: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    due: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800",
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors">
                {/* ── Modal Header ── */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={18} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                                Sale Completed
                            </h2>
                            <p className="text-xs text-slate-400">Transaction recorded</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Receipt Body ── */}
                <div
                    className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-slate-700 dark:text-slate-300"
                    id="receipt-print-area"
                >
                    {/* Business Name */}
                    <div className="text-center pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                            {businessName}
                        </h3>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mt-0.5">
                            Official Sales Receipt
                        </p>
                    </div>

                    {/* Reference & Date */}
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-4 py-3 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Reference No</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                {sale.reference_no}
                            </span>
                        </div>
                        {sale.uuid && (
                            <div className="flex justify-between text-[11px] items-center text-slate-400">
                                <span className="flex items-center gap-1 text-slate-400">
                                    <ShieldCheck size={12} className="text-emerald-500" />
                                    UUID Verification
                                </span>
                                <span className="font-mono text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={sale.uuid}>
                                    {sale.uuid}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Date & Time</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {sale.sale_date}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Customer</span>
                            <span className="text-slate-800 dark:text-slate-200 font-medium">
                                {sale.customer_name ?? "Walk-in Customer"}
                            </span>
                        </div>
                        {sale.payment_method && (
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Payment Via</span>
                                <span className="text-slate-800 dark:text-slate-200 font-medium">
                                    {sale.payment_method}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Purchased Items ({sale.items.length})
                        </p>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                            {sale.items.map((item, idx) => (
                                <div
                                    key={item.product_id ? `${item.product_id}-${idx}` : idx}
                                    className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                                >
                                    <div className="min-w-0 pr-3">
                                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                            {item.name}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            {item.quantity} × ৳{item.unit_price.toFixed(2)}
                                            {item.discount > 0 && ` (-৳${item.discount.toFixed(2)})`}
                                        </p>
                                    </div>
                                    <span className="font-semibold text-slate-900 dark:text-white shrink-0 font-mono">
                                        ৳{((item.quantity * item.unit_price) - (item.discount || 0)).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals Breakdown */}
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3.5 space-y-2">
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Subtotal</span>
                            <span className="font-medium font-mono text-slate-700 dark:text-slate-300">
                                ৳{sale.subtotal.toFixed(2)}
                            </span>
                        </div>
                        {sale.discount > 0 && (
                            <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                <span>Discount</span>
                                <span className="font-mono">− ৳{sale.discount.toFixed(2)}</span>
                            </div>
                        )}
                        {sale.tax > 0 && (
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>Tax</span>
                                <span className="font-mono">+ ৳{sale.tax.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-slate-200 dark:border-slate-700/60 pt-2 text-sm font-bold text-slate-900 dark:text-white">
                            <span>Grand Total</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                ৳{sale.grand_total.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                            <span>Paid Amount</span>
                            <span className="font-medium font-mono text-emerald-600 dark:text-emerald-400">
                                ৳{sale.paid_amount.toFixed(2)}
                            </span>
                        </div>
                        {sale.due_amount > 0 && (
                            <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 font-medium">
                                <span>Due Remaining</span>
                                <span className="font-mono">
                                    ৳{sale.due_amount.toFixed(2)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-1 text-xs">
                            <span className="text-slate-400">Payment Status</span>
                            <span
                                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${paymentStatusColors[sale.payment_status]}`}
                            >
                                {sale.payment_status}
                            </span>
                        </div>
                    </div>

                    {/* Note */}
                    {sale.note && (
                        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3.5 py-2">
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                                <span className="font-semibold">Note: </span>
                                {sale.note}
                            </p>
                        </div>
                    )}

                    {/* Thank you note */}
                    <div className="text-center pt-1 text-xs text-slate-400">
                        <p>Thank you for choosing {businessName}!</p>
                        <p className="text-[11px] mt-0.5 text-slate-500">Please retain this receipt for warranty and returns.</p>
                    </div>
                </div>

                {/* ── Modal Footer ── */}
                <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-5 py-3.5">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <Printer size={15} />
                        Print Thermal Receipt
                    </button>
                    <button
                        onClick={onNewSale}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-5 py-2 text-xs font-semibold text-white transition-colors shadow-md shadow-indigo-600/20"
                    >
                        Start New Sale
                    </button>
                </div>
            </div>
        </div>
    );
}
