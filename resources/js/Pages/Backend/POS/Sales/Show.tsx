import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import useFlashToast from "@/hooks/useFlashToast";
import { confirmAction } from "@/lib/confirm";
import { Head, Link, router } from "@inertiajs/react";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Clock,
    FileText,
    Printer,
    RotateCcw,
    Trash2,
    RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
    ORDER_STATUS_OPTIONS,
    PAYMENT_TYPE_OPTIONS,
    DELIVERY_TYPE_OPTIONS,
    DELIVERY_STATUS_OPTIONS,
    type OrderStatus,
    type PaymentType,
    type DeliveryType,
    type DeliveryStatus,
} from "./Index";
import StatusHistoryTimeline, {
    type StatusHistoryEntry,
} from "./_components/StatusHistoryTimeline";
import UpdateOrderStatusModal from "./_components/UpdateOrderStatusModal";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface SaleItem {
    id: number;
    product: { id: number; name: string; sku: string | null } | null;
    variant: { id: number; attributes: Record<string, string> } | null;
    quantity: number;
    unit_price: number;
    discount: number;
    subtotal: number;
}

interface SalePaymentEntry {
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
        address: string | null;
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
    order_status: OrderStatus;
    payment_type: PaymentType | null;
    delivery_type: DeliveryType | null;
    delivery_charge: number | null;
    delivery_charge_free: boolean;
    delivery_address: string | null;
    delivery_contact_phone: string | null;
    delivery_status: DeliveryStatus | null;
    courier_provider: string | null;
    courier_tracking_id: string | null;
    courier_status: string | null;
    courier_note: string | null;
    note: string | null;
    sale_payments: SalePaymentEntry[];
    status_histories: StatusHistoryEntry[];
    deleted_at: string | null;
    created_at: string;
}

interface Props {
    sale: Sale;
    can: {
        delete: boolean;
        restore: boolean;
        updateStatus: boolean;
    };
}

// ── Small helpers ─────────────────────────────────────────────────────────────

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

const paymentManualStatusConfig = {
    verified: { label: "Verified", classes: "bg-green-100 text-green-700" },
    pending_verification: {
        label: "Pending",
        classes: "bg-amber-100 text-amber-700",
    },
    rejected: { label: "Rejected", classes: "bg-red-100 text-red-600" },
};

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-1.5">
            <span className="shrink-0 text-sm text-gray-500">{label}</span>
            <span className="text-right text-sm font-medium text-gray-800">
                {value}
            </span>
        </div>
    );
}

function SectionCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3">
                <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
            </div>
            <div className="px-5 py-4">{children}</div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SaleShow({ sale, can }: Props) {
    useFlashToast();

    const [showStatusModal, setShowStatusModal] = useState(false);

    const isDeleted = !!sale.deleted_at;

    const statusConfig = paymentStatusConfig[sale.payment_status];
    const StatusIcon = statusConfig.icon;

    const orderStatusOption = ORDER_STATUS_OPTIONS.find(
        (o) => o.value === sale.order_status,
    );

    const paymentTypeOption = sale.payment_type
        ? PAYMENT_TYPE_OPTIONS.find((o) => o.value === sale.payment_type)
        : null;

    const deliveryTypeOption = sale.delivery_type
        ? DELIVERY_TYPE_OPTIONS.find((o) => o.value === sale.delivery_type)
        : null;

    const deliveryStatusOption = sale.delivery_status
        ? DELIVERY_STATUS_OPTIONS.find((o) => o.value === sale.delivery_status)
        : null;

    const totalPaid = sale.sale_payments
        .filter((p) => p.payment_status_manual === "verified")
        .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalCharge = sale.sale_payments
        .filter((p) => p.payment_status_manual === "verified")
        .reduce((sum, p) => sum + Number(p.payment_charge), 0);

    // ── Void / Restore ────────────────────────────────────────────────────────

    const handleVoid = () => {
        confirmAction({
            title: "Void Sale?",
            text: `Sale ${sale.reference_no} will be voided and stock will be restored.`,
            confirmButtonText: "Yes, Void",
        }).then((ok) => {
            if (!ok) return;
            router.delete(route("backend.pos.sales.destroy", sale.id), {
                onSuccess: () => toast.success("Sale voided successfully."),
                onError: () => toast.error("Failed to void sale."),
            });
        });
    };

    const handleRestore = () => {
        confirmAction({
            title: "Restore Sale?",
            text: `Sale ${sale.reference_no} will be restored and stock will be re-applied.`,
            confirmButtonText: "Yes, Restore",
        }).then((ok) => {
            if (!ok) return;
            router.post(
                route("backend.pos.sales.restore", sale.id),
                {},
                {
                    onSuccess: () =>
                        toast.success("Sale restored successfully."),
                    onError: () => toast.error("Failed to restore sale."),
                },
            );
        });
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AuthenticatedLayout>
            <Head title={`Sale — ${sale.reference_no}`} />

            <div className="mx-auto max-w-5xl space-y-6 p-6">
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
                            <p className="mt-0.5 text-sm text-gray-500">
                                {sale.sale_date}
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
                        {/* Delivery Slip */}
                        {sale.delivery_type &&
                            sale.delivery_type !== "store_pickup" &&
                            !isDeleted && (
<a
                                    href={route(
                                        "backend.pos.sales.delivery-slip",
                                        sale.id,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 rounded-lg border border-gray-300
                                               px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    <FileText size={15} />
                                    Delivery Slip
                                </a>
                            )}

                        {/* Update Status */}
                        {can.updateStatus && !isDeleted && (
                            <button
                                onClick={() => setShowStatusModal(true)}
                                className="flex items-center gap-2 rounded-lg border border-indigo-200
                                           bg-indigo-50 px-3 py-2 text-sm text-indigo-700
                                           hover:bg-indigo-100"
                            >
                                <RefreshCw size={15} />
                                Update Status
                            </button>
                        )}

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
                                           bg-green-50 px-3 py-2 text-sm text-green-600
                                           hover:bg-green-100"
                            >
                                <RotateCcw size={15} />
                                Restore
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Main Grid: 2-col lg ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* ── Left / Main Column ── */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Sale Items */}
                        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                            <div className="border-b border-gray-100 px-5 py-3">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    Items ({sale.items.length})
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-gray-100 bg-gray-50">
                                        <tr>
                                            <th className="px-5 py-3 text-left font-medium text-gray-500">
                                                #
                                            </th>
                                            <th className="px-5 py-3 text-left font-medium text-gray-500">
                                                Product
                                            </th>
                                            <th className="px-5 py-3 text-right font-medium text-gray-500">
                                                Price
                                            </th>
                                            <th className="px-5 py-3 text-right font-medium text-gray-500">
                                                Qty
                                            </th>
                                            <th className="px-5 py-3 text-right font-medium text-gray-500">
                                                Disc
                                            </th>
                                            <th className="px-5 py-3 text-right font-medium text-gray-500">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sale.items.map((item, idx) => {
                                            const attrs = item.variant
                                                ?.attributes
                                                ? Object.entries(
                                                      item.variant.attributes,
                                                  )
                                                      .map(
                                                          ([k, v]) => `${k}: ${v}`,
                                                      )
                                                      .join(", ")
                                                : null;

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-5 py-3 text-gray-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <p className="font-medium text-gray-800">
                                                            {item.product
                                                                ?.name ??
                                                                "Deleted Product"}
                                                        </p>
                                                        {item.product?.sku && (
                                                            <p className="text-xs text-gray-400">
                                                                {
                                                                    item.product
                                                                        .sku
                                                                }
                                                            </p>
                                                        )}
                                                        {attrs && (
                                                            <p className="text-xs text-indigo-500">
                                                                {attrs}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-right text-gray-700">
                                                        ৳
                                                        {Number(
                                                            item.unit_price,
                                                        ).toFixed(2)}
                                                    </td>
                                                    <td className="px-5 py-3 text-right text-gray-700">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-5 py-3 text-right text-green-600">
                                                        {Number(item.discount) >
                                                        0
                                                            ? `৳${Number(item.discount).toFixed(2)}`
                                                            : "—"}
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-medium text-gray-800">
                                                        ৳
                                                        {Number(
                                                            item.subtotal,
                                                        ).toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payment History */}
                        {sale.sale_payments.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                                <div className="border-b border-gray-100 px-5 py-3">
                                    <h2 className="text-sm font-semibold text-gray-700">
                                        Payment History
                                    </h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {sale.sale_payments.map((p) => {
                                        const msc =
                                            paymentManualStatusConfig[
                                                p.payment_status_manual
                                            ];
                                        return (
                                            <div
                                                key={p.id}
                                                className="px-5 py-3 text-sm"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-800">
                                                            ৳
                                                            {Number(
                                                                p.amount,
                                                            ).toFixed(2)}
                                                        </span>
                                                        {Number(
                                                            p.payment_charge,
                                                        ) > 0 && (
                                                            <span className="text-xs text-amber-600">
                                                                +৳
                                                                {Number(
                                                                    p.payment_charge,
                                                                ).toFixed(2)}{" "}
                                                                charge
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${msc.classes}`}
                                                        >
                                                            {msc.label}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                        {p.payment_date}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                                                    {p.payment_method && (
                                                        <span>
                                                            {
                                                                p.payment_method
                                                                    .name
                                                            }
                                                        </span>
                                                    )}
                                                    {p.payment_method_bank && (
                                                        <span>
                                                            {
                                                                p
                                                                    .payment_method_bank
                                                                    .bank_name
                                                            }
                                                        </span>
                                                    )}
                                                    {p.transaction_id && (
                                                        <span>
                                                            TxID:{" "}
                                                            {p.transaction_id}
                                                        </span>
                                                    )}
                                                    {p.reference && (
                                                        <span>
                                                            Ref: {p.reference}
                                                        </span>
                                                    )}
                                                    {p.verified_by && (
                                                        <span>
                                                            Verified by:{" "}
                                                            {p.verified_by.name}
                                                        </span>
                                                    )}
                                                </div>
                                                {p.note && (
                                                    <p className="mt-1 text-xs text-gray-400">
                                                        {p.note}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Payment totals footer */}
                                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Total Collected</span>
                                        <span className="font-medium text-green-700">
                                            ৳{totalPaid.toFixed(2)}
                                        </span>
                                    </div>
                                    {totalCharge > 0 && (
                                        <div className="flex justify-between text-gray-500">
                                            <span>Total Charges</span>
                                            <span className="text-amber-600">
                                                ৳{totalCharge.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status History Timeline */}
                        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                            <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    Status History
                                </h2>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                    {sale.status_histories.length} entries
                                </span>
                            </div>
                            <StatusHistoryTimeline
                                history={sale.status_histories}
                            />
                        </div>
                    </div>

                    {/* ── Right Sidebar ── */}
                    <div className="space-y-6">
                        {/* Order Status */}
                        <SectionCard title="Order Status">
                            <div className="space-y-3">
                                {orderStatusOption && (
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${orderStatusOption.classes}`}
                                    >
                                        {orderStatusOption.label}
                                    </span>
                                )}
                                {paymentTypeOption && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">
                                            Payment Type
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${paymentTypeOption.classes}`}
                                        >
                                            {paymentTypeOption.label}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        {/* Payment Summary */}
                        <SectionCard title="Payment Summary">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>
                                        ৳{Number(sale.subtotal).toFixed(2)}
                                    </span>
                                </div>
                                {Number(sale.discount) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>
                                            −৳
                                            {Number(sale.discount).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {Number(sale.tax) > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Tax</span>
                                        <span>
                                            +৳{Number(sale.tax).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {Number(sale.delivery_charge) > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Delivery</span>
                                        <span>
                                            +৳
                                            {Number(
                                                sale.delivery_charge,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-800">
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
                                        <span className="text-gray-600">
                                            Due
                                        </span>
                                        <span className="font-medium text-red-600">
                                            ৳
                                            {Number(sale.due_amount).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-gray-500 text-xs">
                                        Status
                                    </span>
                                    <span
                                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.classes}`}
                                    >
                                        <StatusIcon size={11} />
                                        {statusConfig.label}
                                    </span>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Customer */}
                        <SectionCard title="Customer">
                            {sale.customer ? (
                                <div className="space-y-1">
                                    <InfoRow
                                        label="Name"
                                        value={sale.customer.name}
                                    />
                                    {sale.customer.phone && (
                                        <InfoRow
                                            label="Phone"
                                            value={sale.customer.phone}
                                        />
                                    )}
                                    {sale.customer.email && (
                                        <InfoRow
                                            label="Email"
                                            value={sale.customer.email}
                                        />
                                    )}
                                    {sale.customer.address && (
                                        <InfoRow
                                            label="Address"
                                            value={sale.customer.address}
                                        />
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm italic text-gray-400">
                                    Walk-in Customer
                                </p>
                            )}
                        </SectionCard>

                        {/* Delivery Info */}
                        {sale.delivery_type && (
                            <SectionCard title="Delivery">
                                <div className="space-y-1">
                                    {deliveryTypeOption && (
                                        <InfoRow
                                            label="Type"
                                            value={
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${deliveryTypeOption.classes}`}
                                                >
                                                    {deliveryTypeOption.label}
                                                </span>
                                            }
                                        />
                                    )}
                                    {deliveryStatusOption && (
                                        <InfoRow
                                            label="Status"
                                            value={
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${deliveryStatusOption.classes}`}
                                                >
                                                    {deliveryStatusOption.label}
                                                </span>
                                            }
                                        />
                                    )}
                                    {sale.delivery_address && (
                                        <InfoRow
                                            label="Address"
                                            value={sale.delivery_address}
                                        />
                                    )}
                                    {sale.delivery_contact_phone && (
                                        <InfoRow
                                            label="Contact"
                                            value={sale.delivery_contact_phone}
                                        />
                                    )}
                                    {Number(sale.delivery_charge) > 0 && (
                                        <InfoRow
                                            label="Charge"
                                            value={`৳${Number(sale.delivery_charge).toFixed(2)}`}
                                        />
                                    )}
                                    {sale.delivery_charge_free && (
                                        <InfoRow
                                            label="Free Delivery"
                                            value={
                                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                                    Yes
                                                </span>
                                            }
                                        />
                                    )}
                                </div>
                            </SectionCard>
                        )}

                        {/* Courier Info */}
                        {sale.courier_provider && (
                            <SectionCard title="Courier">
                                <div className="space-y-1">
                                    <InfoRow
                                        label="Provider"
                                        value={sale.courier_provider}
                                    />
                                    {sale.courier_tracking_id && (
                                        <InfoRow
                                            label="Tracking ID"
                                            value={sale.courier_tracking_id}
                                        />
                                    )}
                                    {sale.courier_status && (
                                        <InfoRow
                                            label="Status"
                                            value={sale.courier_status}
                                        />
                                    )}
                                    {sale.courier_note && (
                                        <InfoRow
                                            label="Note"
                                            value={sale.courier_note}
                                        />
                                    )}
                                </div>
                            </SectionCard>
                        )}

                        {/* Sale Meta */}
                        <SectionCard title="Sale Info">
                            <div className="space-y-1">
                                <InfoRow
                                    label="Reference"
                                    value={sale.reference_no}
                                />
                                <InfoRow
                                    label="Sale Date"
                                    value={sale.sale_date}
                                />
                                <InfoRow
                                    label="Created By"
                                    value={sale.creator?.name ?? "—"}
                                />
                                {sale.payment_method && (
                                    <InfoRow
                                        label="Method"
                                        value={sale.payment_method.name}
                                    />
                                )}
                                {sale.note && (
                                    <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                                        {sale.note}
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>
                </div>
            </div>

            {/* ── Update Status Modal ── */}
            {showStatusModal && (
                <UpdateOrderStatusModal
                    sale={{
                        id: sale.id,
                        reference_no: sale.reference_no,
                        order_status: sale.order_status,
                    }}
                    onClose={() => setShowStatusModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}
