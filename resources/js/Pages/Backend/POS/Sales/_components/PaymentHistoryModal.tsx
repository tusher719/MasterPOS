// resources/js/Pages/Backend/POS/Sales/_components/PaymentHistoryModal.tsx

import { CheckCircle, Clock, CreditCard, Plus, X } from "lucide-react";
import { useState } from "react";
import AddPaymentModal from "./AddPaymentModal";

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

interface SalePayment {
    id: number;
    amount: number;
    payment_charge: number;
    payment_date: string;
    payment_status_manual: "pending_verification" | "verified" | "rejected";
    reference: string | null;
    transaction_id: string | null;
    note: string | null;
    payment_method: { id: number; name: string } | null;
    payment_method_bank: { id: number; bank_name: string } | null;
    verified_by: { id: number; name: string } | null;
    verified_at: string | null;
    created_at: string;
}

interface SaleSummary {
    id: number;
    reference_no: string;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    payment_status: "paid" | "partial" | "due";
    customer: { name: string } | null;
    sale_payments: SalePayment[];
}

interface Props {
    sale: SaleSummary;
    paymentMethods: PaymentMethod[];
    canAddPayment: boolean;
    onClose: () => void;
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

const statusBadge: Record<string, string> = {
    verified: "bg-green-100 text-green-700",
    pending_verification: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-600",
};

const statusLabel: Record<string, string> = {
    verified: "Verified",
    pending_verification: "Pending",
    rejected: "Rejected",
};

const paymentStatusBadge: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    due: "bg-red-100 text-red-600",
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PaymentHistoryModal({
    sale,
    paymentMethods,
    canAddPayment,
    onClose,
}: Props) {
    const [showAddPayment, setShowAddPayment] = useState(false);

    const totalCharge = sale.sale_payments.reduce(
        (sum, p) => sum + Number(p.payment_charge ?? 0),
        0,
    );

    const totalVerified = sale.sale_payments
        .filter((p) => p.payment_status_manual === "verified")
        .reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                <div
                    className="flex w-full max-w-lg flex-col rounded-lg bg-white shadow-xl"
                    style={{ maxHeight: "90vh" }}
                >
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <div>
                            <h2 className="text-base font-semibold text-gray-800">
                                Payment History
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

                    {/* ── Summary bar ── */}
                    <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50">
                        <div className="px-4 py-3 text-center">
                            <p className="text-xs text-gray-500">Grand Total</p>
                            <p className="mt-0.5 text-sm font-bold text-gray-800">
                                ৳{Number(sale.grand_total).toFixed(2)}
                            </p>
                        </div>
                        <div className="px-4 py-3 text-center">
                            <p className="text-xs text-gray-500">Total Paid</p>
                            <p className="mt-0.5 text-sm font-bold text-green-600">
                                ৳{Number(sale.paid_amount).toFixed(2)}
                            </p>
                        </div>
                        <div className="px-4 py-3 text-center">
                            <p className="text-xs text-gray-500">Due</p>
                            <p
                                className={`mt-0.5 text-sm font-bold ${Number(sale.due_amount) > 0 ? "text-red-500" : "text-gray-400"}`}
                            >
                                {Number(sale.due_amount) > 0
                                    ? `৳${Number(sale.due_amount).toFixed(2)}`
                                    : "—"}
                            </p>
                        </div>
                    </div>

                    {/* ── Payment status badge ── */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-2">
                        <span className="text-xs text-gray-500">
                            {sale.sale_payments.length} payment entry(s)
                            {totalCharge > 0 && (
                                <span className="ml-2 text-amber-600">
                                    · ৳{totalCharge.toFixed(2)} in charges
                                </span>
                            )}
                        </span>
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${paymentStatusBadge[sale.payment_status]}`}
                        >
                            {sale.payment_status}
                        </span>
                    </div>

                    {/* ── Payment list ── */}
                    <div className="flex-1 overflow-y-auto px-5 py-3">
                        {sale.sale_payments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <CreditCard
                                    size={32}
                                    className="mb-2 opacity-30"
                                />
                                <p className="text-sm">
                                    No payments recorded yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sale.sale_payments.map((payment, i) => (
                                    <div
                                        key={payment.id}
                                        className="rounded-lg border border-gray-200 bg-white p-4"
                                    >
                                        {/* Row 1 — amount + status */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="text-base font-bold text-gray-800">
                                                    ৳
                                                    {Number(
                                                        payment.amount,
                                                    ).toFixed(2)}
                                                </span>
                                                {Number(
                                                    payment.payment_charge,
                                                ) > 0 && (
                                                    <span className="ml-2 text-xs text-amber-600">
                                                        +৳
                                                        {Number(
                                                            payment.payment_charge,
                                                        ).toFixed(2)}{" "}
                                                        charge
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">
                                                    #{i + 1}
                                                </span>
                                                <span
                                                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[payment.payment_status_manual]}`}
                                                >
                                                    {payment.payment_status_manual ===
                                                    "verified" ? (
                                                        <CheckCircle
                                                            size={10}
                                                        />
                                                    ) : (
                                                        <Clock size={10} />
                                                    )}
                                                    {
                                                        statusLabel[
                                                            payment
                                                                .payment_status_manual
                                                        ]
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {/* Row 2 — method + date */}
                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                            {payment.payment_method && (
                                                <span>
                                                    💳{" "}
                                                    {
                                                        payment.payment_method
                                                            .name
                                                    }
                                                    {payment.payment_method_bank && (
                                                        <span className="ml-1 text-gray-400">
                                                            ·{" "}
                                                            {
                                                                payment
                                                                    .payment_method_bank
                                                                    .bank_name
                                                            }
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                            <span>
                                                📅{" "}
                                                {formatDate(
                                                    payment.payment_date,
                                                )}
                                            </span>
                                        </div>

                                        {/* Row 3 — TxID / reference */}
                                        {(payment.transaction_id ||
                                            payment.reference) && (
                                            <div className="mt-1 text-xs text-gray-500">
                                                {payment.transaction_id && (
                                                    <span>
                                                        TxID:{" "}
                                                        <span className="font-medium text-gray-700">
                                                            {
                                                                payment.transaction_id
                                                            }
                                                        </span>
                                                    </span>
                                                )}
                                                {payment.reference && (
                                                    <span
                                                        className={
                                                            payment.transaction_id
                                                                ? " · "
                                                                : ""
                                                        }
                                                    >
                                                        Ref:{" "}
                                                        <span className="font-medium text-gray-700">
                                                            {payment.reference}
                                                        </span>
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Row 4 — verified by */}
                                        {payment.verified_by && (
                                            <div className="mt-1 text-xs text-gray-400">
                                                Verified by{" "}
                                                {payment.verified_by.name}
                                            </div>
                                        )}

                                        {/* Row 5 — note */}
                                        {payment.note && (
                                            <div className="mt-2 rounded bg-gray-50 px-2 py-1 text-xs text-gray-500">
                                                {payment.note}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
                        <button
                            onClick={onClose}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm
                                       text-gray-600 hover:bg-gray-50"
                        >
                            Close
                        </button>
                        {canAddPayment && Number(sale.due_amount) > 0 && (
                            <button
                                onClick={() => setShowAddPayment(true)}
                                className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2
                                           text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                <Plus size={15} />
                                Add Payment
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Add Payment Modal (z-[70] — above this modal) ── */}
            {showAddPayment && (
                <AddPaymentModal
                    sale={sale}
                    paymentMethods={paymentMethods}
                    onClose={() => setShowAddPayment(false)}
                />
            )}
        </>
    );
}
