// resources/js/Pages/Backend/POS/Sales/_components/SaleTable.tsx

import { confirmAction } from "@/lib/confirm";
import { formatDateTime } from "@/lib/formatDateTime";
import { Link, router } from "@inertiajs/react";
import {
    Eye,
    FileText,
    PackageCheck,
    RotateCcw,
    Trash2,
    Truck,
    Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
    COURIER_STATUS_OPTIONS,
    DELIVERY_STATUS_OPTIONS,
    DELIVERY_TYPE_OPTIONS,
    ORDER_STATUS_OPTIONS,
    PAYMENT_TYPE_OPTIONS,
    type PaymentMethod,
    type Sale,
} from "../Index";
import BulkStatusModal from "./BulkStatusModal";
import CollectCodPaymentModal from "./CollectCodPaymentModal";
import CourierModal from "./CourierModal";
import PaymentHistoryModal from "./PaymentHistoryModal";

interface Props {
    sales: Sale[];
    paymentMethods: PaymentMethod[];
    can: {
        view: boolean;
        create: boolean;
        delete: boolean;
        restore: boolean;
    };
}

const paymentStatusBadge: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    due: "bg-red-100 text-red-600",
};

function OrderStatusBadge({ status }: { status: Sale["order_status"] }) {
    const opt = ORDER_STATUS_OPTIONS.find((o) => o.value === status);
    if (!opt) return null;
    return (
        <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${opt.classes}`}
        >
            {opt.label}
        </span>
    );
}

function PaymentTypeBadge({ type }: { type: Sale["payment_type"] }) {
    if (!type) return <span className="text-gray-400">—</span>;
    const opt = PAYMENT_TYPE_OPTIONS.find((o) => o.value === type);
    if (!opt) return null;
    return (
        <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${opt.classes}`}
        >
            {opt.label}
        </span>
    );
}

function DeliveryTypeBadge({ type }: { type: Sale["delivery_type"] }) {
    if (!type) return <span className="text-gray-400">—</span>;
    const opt = DELIVERY_TYPE_OPTIONS.find((o) => o.value === type);
    if (!opt) return null;
    return (
        <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${opt.classes}`}
        >
            {opt.label}
        </span>
    );
}

function DeliveryStatusBadge({ status }: { status: Sale["delivery_status"] }) {
    if (!status) return <span className="text-gray-400">—</span>;
    const opt = DELIVERY_STATUS_OPTIONS.find((o) => o.value === status);
    if (!opt) return null;
    return (
        <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${opt.classes}`}
        >
            {opt.label}
        </span>
    );
}

function CourierStatusBadge({ status }: { status: Sale["courier_status"] }) {
    if (!status) return <span className="text-gray-400">—</span>;
    const opt = COURIER_STATUS_OPTIONS.find((o) => o.value === status);
    if (!opt) return null;
    return (
        <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${opt.classes}`}
        >
            {opt.label}
        </span>
    );
}

export default function SaleTable({ sales, paymentMethods, can }: Props) {
    const [codSale, setCodSale] = useState<Sale | null>(null);
    const [courierSale, setCourierSale] = useState<Sale | null>(null);
    const [paymentHistorySale, setPaymentHistorySale] = useState<Sale | null>(
        null,
    );
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showBulkModal, setShowBulkModal] = useState(false);

    const eligibleSales = sales.filter((s) => !s.deleted_at);
    const allSelected =
        eligibleSales.length > 0 &&
        eligibleSales.every((s) => selectedIds.includes(s.id));

    const toggleAll = () => {
        setSelectedIds(allSelected ? [] : eligibleSales.map((s) => s.id));
    };

    const toggleOne = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    // Direct from props — no fetch needed
    const handleOpenPaymentHistory = (sale: Sale) => {
        setPaymentHistorySale(sale);
    };

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

    const isCodCollectable = (sale: Sale) =>
        sale.payment_type === "cash_on_delivery" &&
        sale.delivery_status !== "delivered" &&
        !sale.deleted_at;

    if (sales.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white py-16 text-center text-gray-400">
                <p className="text-sm">No sales found.</p>
            </div>
        );
    }

    return (
        <>
            {/* ── Bulk Action Bar ── */}
            {selectedIds.length > 0 && (
                <div
                    className="mb-3 flex items-center justify-between rounded-lg
                                border border-indigo-200 bg-indigo-50 px-4 py-2.5"
                >
                    <span className="text-sm font-medium text-indigo-700">
                        {selectedIds.length} sale
                        {selectedIds.length > 1 ? "s" : ""} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold
                                       text-white hover:bg-indigo-700"
                        >
                            Update Status
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="rounded-md border border-indigo-300 px-3 py-1.5 text-xs
                                       font-medium text-indigo-600 hover:bg-indigo-100"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50">
                        <tr>
                            <th className="w-10 px-3 py-3">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    title="Select all"
                                />
                            </th>
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
                                Payment
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Order Status
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Type
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Delivery
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                D.Status
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Courier
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sales.map((sale) => {
                            const isDeleted = !!sale.deleted_at;
                            const isSelected = selectedIds.includes(sale.id);
                            const showCollect =
                                can.create && isCodCollectable(sale);

                            return (
                                <tr
                                    key={sale.id}
                                    className={
                                        isDeleted
                                            ? "bg-red-50 opacity-70"
                                            : isSelected
                                              ? "bg-indigo-50"
                                              : "hover:bg-gray-50"
                                    }
                                >
                                    {/* Checkbox */}
                                    <td className="px-3 py-3">
                                        {!isDeleted && (
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() =>
                                                    toggleOne(sale.id)
                                                }
                                                className="rounded border-gray-300 text-indigo-600
                                                           focus:ring-indigo-500"
                                            />
                                        )}
                                    </td>

                                    {/* Reference */}
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-indigo-600">
                                            {sale.reference_no}
                                        </span>
                                        {isDeleted && (
                                            <span
                                                className="ml-2 rounded-full bg-red-100 px-2 py-0.5
                                                             text-xs text-red-600"
                                            >
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
                                            <span className="italic text-gray-400">
                                                Walk-in
                                            </span>
                                        )}
                                    </td>

                                    {/* Items */}
                                    <td className="px-4 py-3 text-gray-600">
                                        {sale.items_count}
                                    </td>

                                    {/* Grand Total */}
                                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                                        ৳{Number(sale.grand_total).toFixed(2)}
                                    </td>

                                    {/* Paid */}
                                    <td className="px-4 py-3 text-right font-medium text-green-600">
                                        ৳{Number(sale.paid_amount).toFixed(2)}
                                    </td>

                                    {/* Due */}
                                    <td className="px-4 py-3 text-right font-medium text-red-500">
                                        {Number(sale.due_amount) > 0
                                            ? `৳${Number(sale.due_amount).toFixed(2)}`
                                            : "—"}
                                    </td>

                                    {/* Payment Status */}
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium
                                                          capitalize ${paymentStatusBadge[sale.payment_status]}`}
                                        >
                                            {sale.payment_status}
                                        </span>
                                    </td>

                                    {/* Order Status */}
                                    <td className="px-4 py-3">
                                        <OrderStatusBadge
                                            status={sale.order_status}
                                        />
                                    </td>

                                    {/* Payment Type */}
                                    <td className="px-4 py-3">
                                        <PaymentTypeBadge
                                            type={sale.payment_type}
                                        />
                                    </td>

                                    {/* Delivery Type */}
                                    <td className="px-4 py-3">
                                        <DeliveryTypeBadge
                                            type={sale.delivery_type}
                                        />
                                    </td>

                                    {/* Delivery Status */}
                                    <td className="px-4 py-3">
                                        <DeliveryStatusBadge
                                            status={sale.delivery_status}
                                        />
                                    </td>

                                    {/* Courier Status */}
                                    <td className="px-4 py-3">
                                        <CourierStatusBadge
                                            status={sale.courier_status}
                                        />
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            {/* View receipt */}
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

                                            {/* Payment History */}
                                            {!isDeleted && (
                                                <button
                                                    onClick={() =>
                                                        handleOpenPaymentHistory(
                                                            sale,
                                                        )
                                                    }
                                                    className="rounded-md p-1.5 text-gray-400
                                                               hover:bg-indigo-50 hover:text-indigo-600"
                                                    title="Payment History"
                                                >
                                                    <Wallet size={15} />
                                                </button>
                                            )}

                                            {/* Delivery Slip */}
                                            {!isDeleted &&
                                                sale.delivery_type &&
                                                sale.delivery_type !==
                                                    "store_pickup" && (
                                                    <a
                                                        href={route(
                                                            "backend.pos.sales.delivery-slip",
                                                            sale.id,
                                                        )}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="rounded-md p-1.5 text-gray-400
                                                               hover:bg-gray-100 hover:text-gray-600"
                                                        title="Download Delivery Slip"
                                                    >
                                                        <FileText size={15} />
                                                    </a>
                                                )}

                                            {/* Collect COD Payment */}
                                            {showCollect && (
                                                <button
                                                    onClick={() =>
                                                        setCodSale(sale)
                                                    }
                                                    className="flex items-center gap-1 rounded-md
                                                               border border-green-200 bg-green-50
                                                               px-2 py-1 text-xs font-medium
                                                               text-green-700 transition-colors
                                                               hover:bg-green-100"
                                                    title="Collect COD Payment & Mark Delivered"
                                                >
                                                    <PackageCheck size={13} />
                                                    Collect
                                                </button>
                                            )}

                                            {/* Courier info */}
                                            {can.create &&
                                                !isDeleted &&
                                                sale.delivery_type !==
                                                    "store_pickup" && (
                                                    <button
                                                        onClick={() =>
                                                            setCourierSale(sale)
                                                        }
                                                        className="rounded-md p-1.5 text-gray-400
                                                               hover:bg-indigo-50 hover:text-indigo-600"
                                                        title={
                                                            sale.courier_provider
                                                                ? "Edit Courier Info"
                                                                : "Add Courier Info"
                                                        }
                                                    >
                                                        <Truck size={15} />
                                                    </button>
                                                )}

                                            {/* Void */}
                                            {can.delete && !isDeleted && (
                                                <button
                                                    onClick={() =>
                                                        handleVoid(sale)
                                                    }
                                                    className="rounded-md p-1.5 text-gray-400
                                                               hover:bg-red-50 hover:text-red-500"
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
                                                    className="rounded-md p-1.5 text-gray-400
                                                               hover:bg-green-50 hover:text-green-600"
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

            {/* ── Modals ── */}

            {codSale && (
                <CollectCodPaymentModal
                    sale={{
                        id: codSale.id,
                        reference_no: codSale.reference_no,
                        grand_total: Number(codSale.grand_total),
                        paid_amount: Number(codSale.paid_amount),
                        due_amount: Number(codSale.due_amount),
                        customer: codSale.customer
                            ? { name: codSale.customer.name }
                            : null,
                    }}
                    paymentMethods={paymentMethods}
                    onClose={() => setCodSale(null)}
                />
            )}

            {courierSale && (
                <CourierModal
                    sale={courierSale}
                    onClose={() => setCourierSale(null)}
                />
            )}

            {paymentHistorySale && (
                <PaymentHistoryModal
                    sale={{
                        id: paymentHistorySale.id,
                        reference_no: paymentHistorySale.reference_no,
                        grand_total: Number(paymentHistorySale.grand_total),
                        paid_amount: Number(paymentHistorySale.paid_amount),
                        due_amount: Number(paymentHistorySale.due_amount),
                        payment_status: paymentHistorySale.payment_status,
                        customer: paymentHistorySale.customer
                            ? { name: paymentHistorySale.customer.name }
                            : null,
                        sale_payments: paymentHistorySale.sale_payments ?? [],
                    }}
                    paymentMethods={paymentMethods}
                    canAddPayment={can.create}
                    onClose={() => setPaymentHistorySale(null)}
                />
            )}

            {showBulkModal && (
                <BulkStatusModal
                    selectedIds={selectedIds}
                    onClose={() => setShowBulkModal(false)}
                    onSuccess={() => setSelectedIds([])}
                />
            )}
        </>
    );
}
