// resources/js/Pages/Backend/Purchases/Show.tsx

import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Pencil,
    Printer,
    Download,
    Copy,
    CreditCard,
    Trash2,
    RotateCcw,
    Package,
} from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/lib/confirm";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    PurchaseStatusBadge,
    PaymentStatusBadge,
} from "./_components/StatusBadge";
import PaymentModal from "./_components/PaymentModal";
import PaymentsListModal from "./_components/PaymentsListModal";
import useFlashToast from "@/hooks/useFlashToast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
}

interface PurchaseItem {
    id: number;
    product: Product;
    quantity: number;
    unit_cost: number;
    subtotal: number;
}

interface PaymentMethod {
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
    created_by: { id: number; name: string } | null;
    created_at: string;
}

interface User {
    id: number;
    name: string;
}

interface Purchase {
    id: number;
    reference_no: string;
    purchase_date: string;
    purchase_status: string;
    payment_status: string;
    subtotal: number;
    discount: number;
    tax: number;
    shipping_cost: number;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    note: string | null;
    supplier: Supplier;
    items: PurchaseItem[];
    payments: Payment[];
    created_by: User | null;
    updated_by: User | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

interface Can {
    edit: boolean;
    delete: boolean;
    payment: boolean;
}

interface Props {
    purchase: Purchase;
    purchaseStatuses: Record<string, string>;
    paymentStatuses: Record<string, string>;
    paymentMethods: PaymentMethod[];
    can: Can;
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

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
    return (
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {title}
        </h3>
    );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
            <span className="shrink-0 text-sm text-gray-500">{label}</span>
            <span className="text-right text-sm font-medium text-gray-800">
                {value}
            </span>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Show({
    purchase,
    purchaseStatuses,
    paymentStatuses,
    paymentMethods,
    can,
}: Props) {
    useFlashToast();

    const [paymentModal, setPaymentModal] = useState(false);
    const [paymentsListModal, setPaymentsListModal] = useState(false);

    const isDeleted = !!purchase.deleted_at;
    const isCancelled = purchase.purchase_status === "cancelled";
    const isReceived = purchase.purchase_status === "received";
    const canEdit = can.edit && !isDeleted && !isCancelled && !isReceived;
    const canPay = can.payment && !isDeleted && purchase.due_amount > 0;

    // ── Actions ───────────────────────────────────────────────────────────────

    async function handleDelete() {
        const ok = await confirmAction({
            title: "Delete Purchase?",
            text: `Purchase ${purchase.reference_no} will be soft deleted.`,
            confirmButtonText: "Yes, delete it",
        });
        if (!ok) return;

        router.delete(route("backend.purchases.destroy", purchase.id), {
            onSuccess: () => toast.success("Purchase deleted successfully."),
            onError: () => toast.error("Failed to delete purchase."),
        });
    }

    async function handleRestore() {
        const ok = await confirmAction({
            title: "Restore Purchase?",
            text: `Purchase ${purchase.reference_no} will be restored.`,
            confirmButtonText: "Yes, restore it",
        });
        if (!ok) return;

        router.post(
            route("backend.purchases.restore", purchase.id),
            {},
            {
                onSuccess: () =>
                    toast.success("Purchase restored successfully."),
                onError: () => toast.error("Failed to restore purchase."),
            },
        );
    }

    async function handleDuplicate() {
        const ok = await confirmAction({
            title: "Duplicate Purchase?",
            text: `A new draft will be created from ${purchase.reference_no}.`,
            confirmButtonText: "Yes, duplicate it",
        });
        if (!ok) return;

        router.post(
            route("backend.purchases.duplicate", purchase.id),
            {},
            {
                onSuccess: () =>
                    toast.success("Purchase duplicated successfully."),
                onError: () => toast.error("Failed to duplicate purchase."),
            },
        );
    }

    function handlePrint() {
        window.print();
    }

    function handlePdf() {
        window.open(route("backend.purchases.pdf", purchase.id), "_blank");
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Purchase — ${purchase.reference_no}`} />

            <div className="space-y-5">
                {/* ── Page Header ───────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("backend.purchases.index")}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {purchase.reference_no}
                                </h1>
                                <PurchaseStatusBadge
                                    status={purchase.purchase_status}
                                />
                                <PaymentStatusBadge
                                    status={purchase.payment_status}
                                />
                                {isDeleted && (
                                    <span
                                        className="rounded-full bg-red-100 px-2.5 py-0.5
                                                     text-xs font-medium text-red-500"
                                    >
                                        Deleted
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {formatDate(purchase.purchase_date)}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        {canEdit && (
                            <Link
                                href={route(
                                    "backend.purchases.edit",
                                    purchase.id,
                                )}
                                className="inline-flex items-center gap-1.5 rounded-lg border
                                           border-gray-300 bg-white px-3 py-2 text-sm font-medium
                                           text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 rounded-lg border
                                       border-gray-300 bg-white px-3 py-2 text-sm font-medium
                                       text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </button>

                        <button
                            type="button"
                            onClick={handlePdf}
                            className="inline-flex items-center gap-1.5 rounded-lg border
                                       border-gray-300 bg-white px-3 py-2 text-sm font-medium
                                       text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            PDF
                        </button>

                        <button
                            type="button"
                            onClick={handleDuplicate}
                            className="inline-flex items-center gap-1.5 rounded-lg border
                                       border-gray-300 bg-white px-3 py-2 text-sm font-medium
                                       text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Copy className="h-4 w-4" />
                            Duplicate
                        </button>

                        {canPay && (
                            <button
                                type="button"
                                onClick={() => setPaymentModal(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg
                                           bg-indigo-600 px-3 py-2 text-sm font-medium
                                           text-white hover:bg-indigo-700 transition-colors"
                            >
                                <CreditCard className="h-4 w-4" />
                                Record Payment
                            </button>
                        )}

                        {/* Payment History — opens the same PaymentsListModal used
                            elsewhere, directly on this page (no navigation). */}
                        <button
                            type="button"
                            onClick={() => setPaymentsListModal(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg border
                                       border-gray-300 bg-white px-3 py-2 text-sm font-medium
                                       text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Package className="h-4 w-4" />
                            Payment History
                        </button>

                        {!isDeleted && can.delete && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="inline-flex items-center gap-1.5 rounded-lg border
                                           border-red-200 bg-red-50 px-3 py-2 text-sm font-medium
                                           text-red-600 hover:bg-red-100 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        )}

                        {isDeleted && (
                            <button
                                type="button"
                                onClick={handleRestore}
                                className="inline-flex items-center gap-1.5 rounded-lg border
                                           border-green-200 bg-green-50 px-3 py-2 text-sm font-medium
                                           text-green-700 hover:bg-green-100 transition-colors"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Restore
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Main Content Grid ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Left Column — Items + Payments */}
                    <div className="space-y-5 lg:col-span-2">
                        {/* Purchase Items */}
                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                            <SectionHeader title="Purchase Items" />

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50">
                                            <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                #
                                            </th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                Product
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                Qty
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                Unit Cost
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {purchase.items.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-3 py-2.5 text-gray-400">
                                                    {index + 1}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <p className="font-medium text-gray-800">
                                                        {item.product.name}
                                                    </p>
                                                    {item.product.sku && (
                                                        <p className="text-xs text-gray-400">
                                                            SKU:{" "}
                                                            {item.product.sku}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-right text-gray-700">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-3 py-2.5 text-right text-gray-700">
                                                    {formatCurrency(
                                                        item.unit_cost,
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-medium text-gray-800">
                                                    {formatCurrency(
                                                        item.subtotal,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="mt-4 border-t border-gray-100 pt-4">
                                <div className="ml-auto w-full max-w-xs space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">
                                            Subtotal
                                        </span>
                                        <span className="text-gray-800">
                                            {formatCurrency(purchase.subtotal)}
                                        </span>
                                    </div>
                                    {purchase.discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">
                                                Discount
                                            </span>
                                            <span className="text-red-500">
                                                −{" "}
                                                {formatCurrency(
                                                    purchase.discount,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {purchase.tax > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">
                                                Tax
                                            </span>
                                            <span className="text-gray-800">
                                                + {formatCurrency(purchase.tax)}
                                            </span>
                                        </div>
                                    )}
                                    {purchase.shipping_cost > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">
                                                Shipping
                                            </span>
                                            <span className="text-gray-800">
                                                +{" "}
                                                {formatCurrency(
                                                    purchase.shipping_cost,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-bold">
                                        <span className="text-gray-800">
                                            Grand Total
                                        </span>
                                        <span className="text-indigo-600 text-base">
                                            {formatCurrency(
                                                purchase.grand_total,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">
                                            Paid
                                        </span>
                                        <span className="text-green-600 font-medium">
                                            {formatCurrency(
                                                purchase.paid_amount,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-gray-800">
                                            Due
                                        </span>
                                        <span
                                            className={
                                                purchase.due_amount > 0
                                                    ? "text-red-500"
                                                    : "text-green-600"
                                            }
                                        >
                                            {formatCurrency(
                                                purchase.due_amount,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment History */}
                        <div
                            id="payments"
                            className="rounded-lg border border-gray-200 bg-white p-5"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <SectionHeader
                                    title={`Payment History (${purchase.payments.length})`}
                                />
                                {canPay && (
                                    <button
                                        type="button"
                                        onClick={() => setPaymentModal(true)}
                                        className="inline-flex items-center gap-1.5 rounded-lg
                                                   bg-indigo-600 px-3 py-1.5 text-xs font-medium
                                                   text-white hover:bg-indigo-700 transition-colors"
                                    >
                                        <CreditCard className="h-3.5 w-3.5" />
                                        Record Payment
                                    </button>
                                )}
                            </div>

                            {purchase.payments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <CreditCard className="mb-2 h-8 w-8 text-gray-300" />
                                    <p className="text-sm text-gray-400">
                                        No payments recorded yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {purchase.payments.map((payment, index) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-start justify-between rounded-lg
                                                       border border-gray-100 p-3"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span
                                                        className="flex h-5 w-5 shrink-0 items-center
                                                                     justify-center rounded-full bg-indigo-100
                                                                     text-xs font-medium text-indigo-700"
                                                    >
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-sm font-semibold text-gray-800">
                                                        {formatCurrency(
                                                            Number(
                                                                payment.amount,
                                                            ),
                                                        )}
                                                    </span>
                                                    {payment.payment_method && (
                                                        <span
                                                            className="rounded-full bg-blue-100 px-2 py-0.5
                                                                         text-xs text-blue-700"
                                                        >
                                                            {
                                                                payment
                                                                    .payment_method
                                                                    .name
                                                            }
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(
                                                            payment.payment_date,
                                                        )}
                                                    </span>
                                                </div>
                                                {payment.reference && (
                                                    <p className="mt-0.5 text-xs text-gray-500">
                                                        Ref: {payment.reference}
                                                    </p>
                                                )}
                                                {payment.note && (
                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        {payment.note}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Note */}
                        {purchase.note && (
                            <div className="rounded-lg border border-gray-200 bg-white p-5">
                                <SectionHeader title="Note" />
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {purchase.note}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column — Supplier + Meta */}
                    <div className="space-y-5">
                        {/* Supplier Info */}
                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                            <SectionHeader title="Supplier" />
                            <div className="space-y-1">
                                <p className="font-medium text-gray-800">
                                    {purchase.supplier.name}
                                </p>
                                {purchase.supplier.email && (
                                    <p className="text-sm text-gray-500">
                                        {purchase.supplier.email}
                                    </p>
                                )}
                                {purchase.supplier.phone && (
                                    <p className="text-sm text-gray-500">
                                        {purchase.supplier.phone}
                                    </p>
                                )}
                                {purchase.supplier.address && (
                                    <p className="text-sm text-gray-500">
                                        {purchase.supplier.address}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Purchase Info */}
                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                            <SectionHeader title="Purchase Info" />
                            <div>
                                <InfoRow
                                    label="Reference"
                                    value={purchase.reference_no}
                                />
                                <InfoRow
                                    label="Date"
                                    value={formatDate(purchase.purchase_date)}
                                />
                                <InfoRow
                                    label="Purchase Status"
                                    value={
                                        <PurchaseStatusBadge
                                            status={purchase.purchase_status}
                                        />
                                    }
                                />
                                <InfoRow
                                    label="Payment Status"
                                    value={
                                        <PaymentStatusBadge
                                            status={purchase.payment_status}
                                        />
                                    }
                                />
                            </div>
                        </div>

                        {/* Audit Info */}
                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                            <SectionHeader title="Audit" />
                            <div>
                                <InfoRow
                                    label="Created By"
                                    value={purchase.created_by?.name ?? "—"}
                                />
                                <InfoRow
                                    label="Created At"
                                    value={formatDate(purchase.created_at)}
                                />
                                {purchase.updated_by && (
                                    <InfoRow
                                        label="Updated By"
                                        value={purchase.updated_by.name}
                                    />
                                )}
                                {purchase.updated_at !==
                                    purchase.created_at && (
                                    <InfoRow
                                        label="Updated At"
                                        value={formatDate(purchase.updated_at)}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                            <SectionHeader title="Quick Links" />
                            <div className="space-y-1">
                                <button
                                    type="button"
                                    onClick={() => setPaymentsListModal(true)}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2
                                               text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Package className="h-4 w-4 text-gray-400" />
                                    View All Payments
                                </button>
                                <Link
                                    href={
                                        route("backend.activity-logs.index") +
                                        `?subject_id=${purchase.id}&subject_type=Purchase`
                                    }
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2
                                               text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Package className="h-4 w-4 text-gray-400" />
                                    Activity Log
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Payment Modal ─────────────────────────────────────────────── */}
            {paymentModal && (
                <PaymentModal
                    purchase={purchase}
                    paymentMethods={paymentMethods}
                    onClose={() => setPaymentModal(false)}
                />
            )}

            {/* ── Payments List Modal ───────────────────────────────────────── */}
            {paymentsListModal && (
                <PaymentsListModal
                    purchase={purchase}
                    payments={purchase.payments}
                    canManage={can.payment}
                    onClose={() => setPaymentsListModal(false)}
                    onRecordNew={() => {
                        setPaymentsListModal(false);
                        setPaymentModal(true);
                    }}
                />
            )}
        </AuthenticatedLayout>
    );
}
