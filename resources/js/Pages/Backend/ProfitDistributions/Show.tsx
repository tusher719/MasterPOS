import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { toast } from "sonner";
import {
    ArrowLeft,
    Edit2,
    Trash2,
    CheckCircle,
    Send,
    Lock,
    CreditCard,
    XCircle,
    User,
    Calendar,
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart2,
} from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { confirmAction } from "@/lib/confirm";
import useFlashToast from "@/hooks/useFlashToast";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DistributionItem {
    id: number;
    investment_id: number;
    investor_name: string;
    investment_title: string;
    investment_type: string;
    invested_amount: string;
    share_percent: string;
    share_amount: string;
    payment_status: "pending" | "paid" | "cancelled";
    payment_method: string | null;
    transaction_reference: string | null;
    paid_at: string | null;
    note: string | null;
    paid_by_user: { id: number; name: string } | null;
}

interface AuditUser {
    id: number;
    name: string;
}

interface Distribution {
    id: number;
    distribution_no: string;
    title: string;
    distribution_date: string;
    period_start: string;
    period_end: string;
    total_revenue: string;
    total_cogs: string;
    total_expenses: string;
    total_investment: string;
    gross_profit: string;
    net_profit: string;
    distribution_percent: string;
    distributable_amount: string;
    status: "draft" | "approved" | "distributed";
    is_locked: boolean;
    note: string | null;
    approved_at: string | null;
    distributed_at: string | null;
    paid_items_count: number;
    pending_items_count: number;
    total_paid_amount: string;
    items: DistributionItem[];
    creator: AuditUser | null;
    updater: AuditUser | null;
    approver: AuditUser | null;
    distributor: AuditUser | null;
    created_at: string;
    updated_at: string;
}

interface Can {
    edit: boolean;
    delete: boolean;
    approve: boolean;
    distribute: boolean;
    update_payment: boolean;
}

interface Props {
    distribution: Distribution;
    can: Can;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(value: number | string): string {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function fmtDate(value: string | null): string {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function StatusBadge({ status }: { status: Distribution["status"] }) {
    const map = {
        draft: "bg-gray-100 text-gray-600",
        approved: "bg-amber-100 text-amber-700",
        distributed: "bg-green-100 text-green-700",
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[status]}`}
        >
            {status}
        </span>
    );
}

function PaymentBadge({
    status,
}: {
    status: DistributionItem["payment_status"];
}) {
    const map = {
        pending: "bg-amber-100 text-amber-700",
        paid: "bg-green-100 text-green-700",
        cancelled: "bg-red-100 text-red-700",
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}
        >
            {status}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Modal
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentModalProps {
    item: DistributionItem;
    distributionId: number;
    onClose: () => void;
}

function PaymentModal({ item, distributionId, onClose }: PaymentModalProps) {
    const [paymentStatus, setPaymentStatus] = useState<"paid" | "cancelled">(
        "paid",
    );
    const [paymentMethod, setPaymentMethod] = useState("");
    const [transactionReference, setTransactionRef] = useState("");
    const [submitting, setSubmitting] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        router.patch(
            route("backend.profit-distributions.items.payment", {
                profit_distribution: distributionId,
                item: item.id,
            }),
            {
                payment_status: paymentStatus,
                payment_method: paymentMethod || null,
                transaction_reference: transactionReference || null,
            },
            {
                onSuccess: () => {
                    toast.success("Payment status updated.");
                    onClose();
                },
                onError: () => toast.error("Failed to update payment status."),
                onFinish: () => setSubmitting(false),
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="border-b border-gray-100 px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-800">
                        Update Payment Status
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500">
                        {item.investor_name}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 px-5 py-4">
                        {/* Share amount info */}
                        <div className="rounded-md bg-indigo-50 px-4 py-3">
                            <p className="text-xs text-indigo-600">
                                Share Amount
                            </p>
                            <p className="mt-0.5 text-lg font-bold text-indigo-700">
                                ৳ {fmt(item.share_amount)}
                            </p>
                        </div>

                        {/* Payment status */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Payment Status{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-3">
                                {(["paid", "cancelled"] as const).map((s) => (
                                    <label
                                        key={s}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <input
                                            type="radio"
                                            name="payment_status"
                                            value={s}
                                            checked={paymentStatus === s}
                                            onChange={() => setPaymentStatus(s)}
                                            className="accent-indigo-600"
                                        />
                                        <span className="text-sm capitalize text-gray-700">
                                            {s}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Payment method — only for paid */}
                        {paymentStatus === "paid" && (
                            <>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Payment Method
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentMethod}
                                        onChange={(e) =>
                                            setPaymentMethod(e.target.value)
                                        }
                                        placeholder="e.g. Bank Transfer, Cash, bKash…"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Transaction Reference
                                    </label>
                                    <input
                                        type="text"
                                        value={transactionReference}
                                        onChange={(e) =>
                                            setTransactionRef(e.target.value)
                                        }
                                        placeholder="e.g. TXN-20260707-001"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {submitting ? "Saving…" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function Show({ distribution, can }: Props) {
    useFlashToast();

    const [processing, setProcessing] = useState(false);
    const [paymentItem, setPaymentItem] = useState<DistributionItem | null>(
        null,
    );

    // -----------------------------------------------------------------------
    // Approve
    // -----------------------------------------------------------------------

    async function handleApprove() {
        const ok = await confirmAction({
            title: "Approve Distribution?",
            text: `"${distribution.distribution_no}" will be locked and can no longer be edited.`,
            confirmButtonText: "Yes, approve",
        });
        if (!ok) return;

        setProcessing(true);
        router.post(
            route("backend.profit-distributions.approve", distribution.id),
            {},
            {
                onSuccess: () => toast.success("Distribution approved."),
                onError: () => toast.error("Failed to approve distribution."),
                onFinish: () => setProcessing(false),
            },
        );
    }

    // -----------------------------------------------------------------------
    // Distribute
    // -----------------------------------------------------------------------

    async function handleDistribute() {
        const ok = await confirmAction({
            title: "Mark as Distributed?",
            text: "This will mark the distribution as fully distributed to investors.",
            confirmButtonText: "Yes, distribute",
        });
        if (!ok) return;

        setProcessing(true);
        router.post(
            route("backend.profit-distributions.distribute", distribution.id),
            {},
            {
                onSuccess: () =>
                    toast.success("Distribution marked as distributed."),
                onError: () => toast.error("Failed to update status."),
                onFinish: () => setProcessing(false),
            },
        );
    }

    // -----------------------------------------------------------------------
    // Delete
    // -----------------------------------------------------------------------

    async function handleDelete() {
        const ok = await confirmAction({
            title: "Delete Distribution?",
            text: `"${distribution.distribution_no}" will be moved to trash.`,
            confirmButtonText: "Yes, delete",
        });
        if (!ok) return;

        setProcessing(true);
        router.delete(
            route("backend.profit-distributions.destroy", distribution.id),
            {
                onSuccess: () => toast.success("Distribution deleted."),
                onError: () => toast.error("Failed to delete."),
                onFinish: () => setProcessing(false),
            },
        );
    }

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <AuthenticatedLayout>
            <Head title={distribution.distribution_no} />

            {/* Payment modal */}
            {paymentItem && (
                <PaymentModal
                    item={paymentItem}
                    distributionId={distribution.id}
                    onClose={() => setPaymentItem(null)}
                />
            )}

            <div className="space-y-6">
                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <a
                            href={route("backend.profit-distributions.index")}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            <ArrowLeft size={14} />
                            Back
                        </a>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {distribution.distribution_no}
                                </h1>
                                <StatusBadge status={distribution.status} />
                                {distribution.is_locked && (
                                    <Lock
                                        size={14}
                                        className="text-gray-400"
                                        aria-label="Locked"
                                    />
                                )}
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {distribution.title}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        {can.edit && (
                            <a
                                href={route(
                                    "backend.profit-distributions.edit",
                                    distribution.id,
                                )}
                                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Edit2 size={14} />
                                Edit
                            </a>
                        )}
                        {can.approve && (
                            <button
                                onClick={handleApprove}
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                            >
                                <CheckCircle size={14} />
                                Approve
                            </button>
                        )}
                        {can.distribute && (
                            <button
                                onClick={handleDistribute}
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                <Send size={14} />
                                Mark Distributed
                            </button>
                        )}
                        {can.delete && (
                            <button
                                onClick={handleDelete}
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Main grid ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* ── Left: Financial summary + Items ── */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Financial summary cards */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {[
                                {
                                    label: "Total Revenue",
                                    value: distribution.total_revenue,
                                    icon: TrendingUp,
                                    color: "text-green-600",
                                },
                                {
                                    label: "Total Expenses",
                                    value: distribution.total_expenses,
                                    icon: TrendingDown,
                                    color: "text-red-500",
                                },
                                {
                                    label: "Net Profit",
                                    value: distribution.net_profit,
                                    icon: BarChart2,
                                    color:
                                        Number(distribution.net_profit) >= 0
                                            ? "text-indigo-600"
                                            : "text-red-600",
                                },
                                {
                                    label: "Distributable",
                                    value: distribution.distributable_amount,
                                    icon: DollarSign,
                                    color: "text-indigo-600",
                                },
                            ].map((card) => (
                                <div
                                    key={card.label}
                                    className="rounded-lg border border-gray-200 bg-white p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500">
                                            {card.label}
                                        </p>
                                        <card.icon
                                            size={16}
                                            className={card.color}
                                        />
                                    </div>
                                    <p
                                        className={`mt-1 text-lg font-bold ${card.color}`}
                                    >
                                        ৳ {fmt(card.value)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Additional financials */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">
                                Full Financial Breakdown
                            </h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
                                {[
                                    {
                                        label: "Total Revenue",
                                        value: distribution.total_revenue,
                                    },
                                    {
                                        label: "Total COGS",
                                        value: distribution.total_cogs,
                                    },
                                    {
                                        label: "Gross Profit",
                                        value: distribution.gross_profit,
                                    },
                                    {
                                        label: "Total Expenses",
                                        value: distribution.total_expenses,
                                    },
                                    {
                                        label: "Net Profit",
                                        value: distribution.net_profit,
                                    },
                                    {
                                        label: "Total Investment",
                                        value: distribution.total_investment,
                                    },
                                    {
                                        label: "Dist. %",
                                        value: null,
                                        raw: `${Number(distribution.distribution_percent).toFixed(2)}%`,
                                    },
                                    {
                                        label: "Distributable",
                                        value: distribution.distributable_amount,
                                    },
                                ].map((row) => (
                                    <div
                                        key={row.label}
                                        className="flex justify-between border-b border-gray-50 py-1.5"
                                    >
                                        <span className="text-gray-500">
                                            {row.label}
                                        </span>
                                        <span className="font-medium text-gray-800">
                                            {row.raw ?? `৳ ${fmt(row.value!)}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment progress */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    Payment Progress
                                </h3>
                                <span className="text-xs text-gray-500">
                                    {distribution.paid_items_count} /{" "}
                                    {distribution.items.length} paid
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-green-500 transition-all"
                                    style={{
                                        width:
                                            distribution.items.length > 0
                                                ? `${(distribution.paid_items_count / distribution.items.length) * 100}%`
                                                : "0%",
                                    }}
                                />
                            </div>
                            <div className="mt-2 flex gap-4 text-xs text-gray-500">
                                <span className="text-green-600">
                                    Paid: ৳{" "}
                                    {fmt(distribution.total_paid_amount)}
                                </span>
                                <span className="text-amber-600">
                                    Pending: {distribution.pending_items_count}{" "}
                                    item(s)
                                </span>
                            </div>
                        </div>

                        {/* Investor items table */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    Investor Distribution Items
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                #
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Investor
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Investment
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Invested
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Share %
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Share Amount
                                            </th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-500">
                                                Payment
                                            </th>
                                            {can.update_payment && (
                                                <th className="px-4 py-3 text-center font-medium text-gray-500">
                                                    Action
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {distribution.items.map((item, i) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-3 text-gray-500">
                                                    {i + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-800">
                                                        {item.investor_name}
                                                    </p>
                                                    {item.note && (
                                                        <p className="text-xs text-gray-400">
                                                            {item.note}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-gray-700">
                                                        {item.investment_title}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {item.investment_type}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-700">
                                                    ৳{" "}
                                                    {fmt(item.invested_amount)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-700">
                                                    {Number(
                                                        item.share_percent,
                                                    ).toFixed(4)}
                                                    %
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-indigo-700">
                                                    ৳ {fmt(item.share_amount)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <PaymentBadge
                                                            status={
                                                                item.payment_status
                                                            }
                                                        />
                                                        {item.payment_status ===
                                                            "paid" &&
                                                            item.paid_at && (
                                                                <span className="text-xs text-gray-400">
                                                                    {fmtDate(
                                                                        item.paid_at,
                                                                    )}
                                                                </span>
                                                            )}
                                                        {item.payment_status ===
                                                            "paid" &&
                                                            item.payment_method && (
                                                                <span className="text-xs text-gray-400">
                                                                    {
                                                                        item.payment_method
                                                                    }
                                                                </span>
                                                            )}
                                                        {item.payment_status ===
                                                            "paid" &&
                                                            item.transaction_reference && (
                                                                <span className="text-xs text-indigo-500">
                                                                    {
                                                                        item.transaction_reference
                                                                    }
                                                                </span>
                                                            )}
                                                    </div>
                                                </td>
                                                {can.update_payment && (
                                                    <td className="px-4 py-3 text-center">
                                                        {item.payment_status ===
                                                        "pending" ? (
                                                            <button
                                                                onClick={() =>
                                                                    setPaymentItem(
                                                                        item,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                                                            >
                                                                <CreditCard
                                                                    size={12}
                                                                />
                                                                Update
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t border-gray-200 bg-gray-50">
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-4 py-3 text-sm font-semibold text-gray-700"
                                            >
                                                Total
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                ৳{" "}
                                                {fmt(
                                                    distribution.items.reduce(
                                                        (s, i) =>
                                                            s +
                                                            Number(
                                                                i.invested_amount,
                                                            ),
                                                        0,
                                                    ),
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                {distribution.items
                                                    .reduce(
                                                        (s, i) =>
                                                            s +
                                                            Number(
                                                                i.share_percent,
                                                            ),
                                                        0,
                                                    )
                                                    .toFixed(4)}
                                                %
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-700">
                                                ৳{" "}
                                                {fmt(
                                                    distribution.items.reduce(
                                                        (s, i) =>
                                                            s +
                                                            Number(
                                                                i.share_amount,
                                                            ),
                                                        0,
                                                    ),
                                                )}
                                            </td>
                                            <td
                                                colSpan={
                                                    can.update_payment ? 2 : 1
                                                }
                                            />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                    {/* end left col */}

                    {/* ── Right: Record Info sidebar ── */}
                    <div className="space-y-4">
                        {/* Period & dates */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">
                                Period
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Distribution Date
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {fmtDate(
                                            distribution.distribution_date,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Period Start
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {fmtDate(distribution.period_start)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Period End
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {fmtDate(distribution.period_end)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Record info */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">
                                Record Info
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Created By
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {distribution.creator?.name ?? "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Created At
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {fmtDate(distribution.created_at)}
                                    </span>
                                </div>
                                {distribution.updater && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">
                                            Updated By
                                        </span>
                                        <span className="font-medium text-gray-800">
                                            {distribution.updater.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audit trail */}
                        {(distribution.approver ||
                            distribution.distributor) && (
                            <div className="rounded-lg border border-gray-200 bg-white p-4">
                                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                                    Audit Trail
                                </h3>
                                <div className="space-y-3 text-sm">
                                    {distribution.approver && (
                                        <div>
                                            <div className="flex items-center gap-1.5 text-amber-600">
                                                <CheckCircle size={13} />
                                                <span className="font-medium">
                                                    Approved
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-gray-600">
                                                {distribution.approver.name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {fmtDate(
                                                    distribution.approved_at,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {distribution.distributor && (
                                        <div>
                                            <div className="flex items-center gap-1.5 text-green-600">
                                                <Send size={13} />
                                                <span className="font-medium">
                                                    Distributed
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-gray-600">
                                                {distribution.distributor.name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {fmtDate(
                                                    distribution.distributed_at,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Note */}
                        {distribution.note && (
                            <div className="rounded-lg border border-gray-200 bg-white p-4">
                                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                                    Note
                                </h3>
                                <p className="text-sm text-gray-600 whitespace-pre-line">
                                    {distribution.note}
                                </p>
                            </div>
                        )}
                    </div>
                    {/* end right col */}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
