import React from "react";
import { Link } from "@inertiajs/react";
import { Eye, Trash2, RotateCcw } from "lucide-react";
import { confirmAction } from "@/lib/confirm";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/formatDateTime";

interface Customer {
    id: number;
    name: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface Sale {
    id: number;
    reference_no: string;
    sale_date: string;
    customer: Customer | null;
    payment_method: PaymentMethod | null;
    items_count: number;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    payment_status: "paid" | "partial" | "due";
    deleted_at: string | null;
    created_at: string;
}

interface Props {
    sales: Sale[];
    can: {
        view: boolean;
        delete: boolean;
        restore: boolean;
    };
}

const paymentStatusBadge: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    due: "bg-red-100 text-red-600",
};

export default function SaleTable({ sales, can }: Props) {
    const handleVoid = async (sale: Sale) => {
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

    const handleRestore = async (sale: Sale) => {
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

    if (sales.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white py-16 text-center text-gray-400">
                <p className="text-sm">No sales found.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Reference
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Date
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Customer
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Items
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">
                            Grand Total
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">
                            Paid
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">
                            Due
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Status
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {sales.map((sale) => {
                        const isDeleted = !!sale.deleted_at;
                        return (
                            <tr
                                key={sale.id}
                                className={
                                    isDeleted
                                        ? "bg-red-50 opacity-70"
                                        : "hover:bg-gray-50"
                                }
                            >
                                {/* Reference */}
                                <td className="px-4 py-3">
                                    <span className="font-medium text-indigo-600">
                                        {sale.reference_no}
                                    </span>
                                    {isDeleted && (
                                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                                            Voided
                                        </span>
                                    )}
                                </td>

                                {/* Date */}
                                <td className="px-4 py-3 text-gray-600">
                                    {formatDateTime(sale.sale_date)}
                                </td>

                                {/* Customer */}
                                <td className="px-4 py-3 text-gray-700">
                                    {sale.customer?.name ?? (
                                        <span className="text-gray-400 italic">
                                            Walk-in
                                        </span>
                                    )}
                                </td>

                                {/* Items Count */}
                                <td className="px-4 py-3 text-gray-600">
                                    {sale.items_count}
                                </td>

                                {/* Grand Total */}
                                <td className="px-4 py-3 text-right font-medium text-gray-800">
                                    ৳{Number(sale.grand_total).toFixed(2)}
                                </td>

                                {/* Paid */}
                                <td className="px-4 py-3 text-right text-green-600 font-medium">
                                    ৳{Number(sale.paid_amount).toFixed(2)}
                                </td>

                                {/* Due */}
                                <td className="px-4 py-3 text-right text-red-500 font-medium">
                                    {Number(sale.due_amount) > 0
                                        ? `৳${Number(sale.due_amount).toFixed(2)}`
                                        : "—"}
                                </td>

                                {/* Payment Status */}
                                <td className="px-4 py-3">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${paymentStatusBadge[sale.payment_status]}`}
                                    >
                                        {sale.payment_status}
                                    </span>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                        {/* View */}
                                        {can.view && !isDeleted && (
                                            <Link
                                                href={route(
                                                    "backend.pos.sales.show",
                                                    sale.id,
                                                )}
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                                                title="View Receipt"
                                            >
                                                <Eye size={15} />
                                            </Link>
                                        )}

                                        {/* Void */}
                                        {can.delete && !isDeleted && (
                                            <button
                                                onClick={() => handleVoid(sale)}
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                title="Void Sale"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}

                                        {/* Restore */}
                                        {can.restore && isDeleted && (
                                            <button
                                                onClick={() =>
                                                    handleRestore(sale)
                                                }
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                                                title="Restore Sale"
                                            >
                                                <RotateCcw size={15} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
