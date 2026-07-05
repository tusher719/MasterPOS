import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import useFlashToast from "@/hooks/useFlashToast";
import { confirmAction } from "@/lib/confirm";
import { toast } from "sonner";
import {
    ArrowLeft,
    Printer,
    Trash2,
    RotateCcw,
    CheckCircle,
    Clock,
    AlertCircle,
} from "lucide-react";

interface SaleItem {
    id: number;
    product: { id: number; name: string; sku: string | null } | null;
    quantity: number;
    unit_price: number;
    discount: number;
    subtotal: number;
}

interface Sale {
    id: number;
    reference_no: string;
    sale_date: string;
    customer: {
        id: number;
        name: string;
        phone: string | null;
        email: string | null;
    } | null;
    payment_method: { id: number; name: string } | null;
    creator: { id: number; name: string } | null;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    tax: number;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    payment_status: "paid" | "partial" | "due";
    note: string | null;
    deleted_at: string | null;
    created_at: string;
}

interface Props {
    sale: Sale;
    can: {
        delete: boolean;
        restore: boolean;
    };
}

const paymentStatusConfig = {
    paid: {
        label: "Paid",
        icon: CheckCircle,
        classes: "bg-green-100 text-green-700",
    },
    partial: {
        label: "Partial",
        icon: Clock,
        classes: "bg-amber-100 text-amber-700",
    },
    due: {
        label: "Due",
        icon: AlertCircle,
        classes: "bg-red-100 text-red-600",
    },
};

export default function SaleShow({ sale, can }: Props) {
    useFlashToast();

    const isDeleted = !!sale.deleted_at;
    const statusConfig = paymentStatusConfig[sale.payment_status];
    const StatusIcon = statusConfig.icon;

    const handleVoid = async () => {
        const ok = await confirmAction({
            title: "Void Sale?",
            text: `Sale ${sale.reference_no} will be voided and stock will be restored.`,
            confirmButtonText: "Yes, Void",
        });
        if (!ok) return;

        router.delete(route("backend.pos.sales.destroy", sale.id), {
            onSuccess: () => toast.success("Sale voided successfully."),
            onError: () => toast.error("Failed to void sale."),
        });
    };

    const handleRestore = async () => {
        const ok = await confirmAction({
            title: "Restore Sale?",
            text: `Sale ${sale.reference_no} will be restored and stock will be re-applied.`,
            confirmButtonText: "Yes, Restore",
        });
        if (!ok) return;

        router.post(
            route("backend.pos.sales.restore", sale.id),
            {},
            {
                onSuccess: () => toast.success("Sale restored successfully."),
                onError: () => toast.error("Failed to restore sale."),
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Sale — ${sale.reference_no}`} />

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* ── Page Header ── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("backend.pos.sales.index")}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {sale.reference_no}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Sale Receipt
                            </p>
                        </div>
                        {isDeleted && (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">
                                Voided
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 rounded-lg border border-gray-300
                                       px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            <Printer size={15} />
                            Print
                        </button>

                        {can.delete && !isDeleted && (
                            <button
                                onClick={handleVoid}
                                className="flex items-center gap-2 rounded-lg border border-red-200
                                           bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100"
                            >
                                <Trash2 size={15} />
                                Void Sale
                            </button>
                        )}

                        {can.restore && isDeleted && (
                            <button
                                onClick={handleRestore}
                                className="flex items-center gap-2 rounded-lg border border-green-200
                                           bg-green-50 px-3 py-2 text-sm text-green-600 hover:bg-green-100"
                            >
                                <RotateCcw size={15} />
                                Restore
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Sale Info Grid ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Sale Details */}
                    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                            Sale Details
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Reference</span>
                                <span className="font-medium text-gray-800">
                                    {sale.reference_no}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Sale Date</span>
                                <span className="text-gray-700">
                                    {sale.sale_date}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    Created By
                                </span>
                                <span className="text-gray-700">
                                    {sale.creator?.name ?? "—"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    Payment Method
                                </span>
                                <span className="text-gray-700">
                                    {sale.payment_method?.name ?? "—"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">
                                    Payment Status
                                </span>
                                <span
                                    className={`flex items-center gap-1 rounded-full px-2 py-0.5
                                                  text-xs font-medium ${statusConfig.classes}`}
                                >
                                    <StatusIcon size={11} />
                                    {statusConfig.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                            Customer
                        </h2>
                        {sale.customer ? (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Name</span>
                                    <span className="font-medium text-gray-800">
                                        {sale.customer.name}
                                    </span>
                                </div>
                                {sale.customer.phone && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">
                                            Phone
                                        </span>
                                        <span className="text-gray-700">
                                            {sale.customer.phone}
                                        </span>
                                    </div>
                                )}
                                {sale.customer.email && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">
                                            Email
                                        </span>
                                        <span className="text-gray-700">
                                            {sale.customer.email}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm italic text-gray-400">
                                Walk-in Customer
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Sale Items ── */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-3">
                        <h2 className="text-sm font-semibold text-gray-700">
                            Items ({sale.items.length})
                        </h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-3 text-left font-medium text-gray-500">
                                    #
                                </th>
                                <th className="px-5 py-3 text-left font-medium text-gray-500">
                                    Product
                                </th>
                                <th className="px-5 py-3 text-right font-medium text-gray-500">
                                    Unit Price
                                </th>
                                <th className="px-5 py-3 text-right font-medium text-gray-500">
                                    Qty
                                </th>
                                <th className="px-5 py-3 text-right font-medium text-gray-500">
                                    Discount
                                </th>
                                <th className="px-5 py-3 text-right font-medium text-gray-500">
                                    Subtotal
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sale.items.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-3 text-gray-400">
                                        {index + 1}
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="font-medium text-gray-800">
                                            {item.product?.name ??
                                                "Deleted Product"}
                                        </p>
                                        {item.product?.sku && (
                                            <p className="text-xs text-gray-400">
                                                {item.product.sku}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right text-gray-700">
                                        ৳{Number(item.unit_price).toFixed(2)}
                                    </td>
                                    <td className="px-5 py-3 text-right text-gray-700">
                                        {item.quantity}
                                    </td>
                                    <td className="px-5 py-3 text-right text-green-600">
                                        {Number(item.discount) > 0
                                            ? `৳${Number(item.discount).toFixed(2)}`
                                            : "—"}
                                    </td>
                                    <td className="px-5 py-3 text-right font-medium text-gray-800">
                                        ৳{Number(item.subtotal).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Totals + Note ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Note */}
                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                        <h2 className="mb-2 text-sm font-semibold text-gray-700">
                            Note
                        </h2>
                        {sale.note ? (
                            <p className="text-sm text-gray-600">{sale.note}</p>
                        ) : (
                            <p className="text-sm italic text-gray-400">
                                No note added.
                            </p>
                        )}
                    </div>

                    {/* Totals */}
                    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-2">
                        <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                            Payment Summary
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>৳{Number(sale.subtotal).toFixed(2)}</span>
                            </div>
                            {Number(sale.discount) > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>
                                        − ৳{Number(sale.discount).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            {Number(sale.tax) > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax</span>
                                    <span>
                                        + ৳{Number(sale.tax).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div
                                className="flex justify-between border-t border-gray-100 pt-2
                                            text-base font-bold text-gray-800"
                            >
                                <span>Grand Total</span>
                                <span>
                                    ৳{Number(sale.grand_total).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Paid</span>
                                <span className="font-medium text-green-600">
                                    ৳{Number(sale.paid_amount).toFixed(2)}
                                </span>
                            </div>
                            {Number(sale.due_amount) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Due</span>
                                    <span className="font-medium text-red-600">
                                        ৳{Number(sale.due_amount).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
