import React from "react";
import { Link } from "@inertiajs/react";
import { Eye, Trash2, RotateCcw, Package, User } from "lucide-react";
import { confirmAction } from "@/lib/confirm";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

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

const paymentStatusRing: Record<string, string> = {
    paid: "before:bg-green-400",
    partial: "before:bg-amber-400",
    due: "before:bg-red-400",
};

export default function SaleGrid({ sales, can }: Props) {
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sales.map((sale, index) => {
                const isDeleted = !!sale.deleted_at;
                return (
                    <div
                        key={sale.id}
                        style={{
                            animation: `cardIn 0.3s ease-out ${index * 0.03}s both`,
                        }}
                        className={`
                            relative flex flex-col overflow-hidden rounded-xl border bg-white p-4
                            shadow-sm transition-all duration-200 ease-out
                            before:absolute before:left-0 before:top-0 before:h-full before:w-1
                            ${paymentStatusRing[sale.payment_status]}
                            ${
                                isDeleted
                                    ? "opacity-60 grayscale"
                                    : "hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
                            }
                        `}
                    >
                        <style>{`
                            @keyframes cardIn {
                                0% { opacity: 0; transform: translateY(8px); }
                                100% { opacity: 1; transform: translateY(0); }
                            }
                        `}</style>

                        {/* Header */}
                        <div className="mb-3 flex items-start justify-between pl-2">
                            <div>
                                <p className="font-semibold text-indigo-600">
                                    {sale.reference_no}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {sale.sale_date}
                                </p>
                            </div>
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${paymentStatusBadge[sale.payment_status]}`}
                            >
                                {sale.payment_status}
                            </span>
                        </div>

                        {isDeleted && (
                            <span className="mb-2 ml-2 inline-block w-fit rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                                Voided
                            </span>
                        )}

                        {/* Customer + Items */}
                        <div className="mb-3 space-y-1.5 pl-2 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-600">
                                <User size={13} className="text-gray-400" />
                                {sale.customer?.name ?? (
                                    <span className="italic text-gray-400">
                                        Walk-in
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                                <Package size={13} className="text-gray-400" />
                                {sale.items_count} item
                                {sale.items_count !== 1 ? "s" : ""}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2.5 pl-2 text-xs">
                            <div>
                                <p className="text-gray-400">Total</p>
                                <p className="font-semibold text-gray-800">
                                    ৳{Number(sale.grand_total).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400">Paid</p>
                                <p className="font-semibold text-green-600">
                                    ৳{Number(sale.paid_amount).toFixed(2)}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-gray-400">Due</p>
                                <p
                                    className={`font-semibold ${
                                        Number(sale.due_amount) > 0
                                            ? "text-red-500"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {Number(sale.due_amount) > 0
                                        ? `৳${Number(sale.due_amount).toFixed(2)}`
                                        : "—"}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto flex items-center justify-end gap-1 border-t border-gray-100 pt-2">
                            {can.view && !isDeleted && (
                                <Link
                                    href={route(
                                        "backend.pos.sales.show",
                                        sale.id,
                                    )}
                                    className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
                                    title="View Receipt"
                                >
                                    <Eye size={15} />
                                </Link>
                            )}
                            {can.delete && !isDeleted && (
                                <button
                                    onClick={() => handleVoid(sale)}
                                    className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                    title="Void Sale"
                                >
                                    <Trash2 size={15} />
                                </button>
                            )}
                            {can.restore && isDeleted && (
                                <button
                                    onClick={() => handleRestore(sale)}
                                    className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                                    title="Restore Sale"
                                >
                                    <RotateCcw size={15} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
