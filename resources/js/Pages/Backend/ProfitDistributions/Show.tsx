// resources/js/Pages/Backend/ProfitDistributions/Show.tsx

import useFlashToast from "@/hooks/useFlashToast";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { confirmAction } from "@/lib/confirm";
import type {
    DistributionEligibility,
    DistributionItem,
} from "@/types/profit-distribution";
import { Head, router } from "@inertiajs/react";
import {
    ArrowLeft,
    BarChart2,
    CheckCircle,
    DollarSign,
    Edit2,
    Lock,
    RotateCcw,
    Send,
    Trash2,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import EligibilityPanel from "./_components/EligibilityPanel";
import ExtendedPaymentModal from "./_components/ExtendedPaymentModal";
import PaymentHistoryModal from "./_components/PaymentHistoryModal";
import ReverseDistributionModal from "./_components/ReverseDistributionModal";

// ─── Types ────────────────────────────────────────────────────────────────────

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
    source_type: "investment_based" | "partner_based";
    status: "draft" | "approved" | "distributed";
    is_locked: boolean;
    note: string | null;
    approved_at: string | null;
    distributed_at: string | null;
    paid_items_count: number;
    pending_items_count: number;
    total_paid_amount: string;
    items: DistributionItem[];
    eligibilities: DistributionEligibility[];
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
    override_eligibility: boolean;
    reverse: boolean;
}

interface Props {
    distribution: Distribution;
    can: Can;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function PaymentBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700",
        partial: "bg-blue-100 text-blue-700",
        paid: "bg-green-100 text-green-700",
        deferred: "bg-purple-100 text-purple-700",
        reinvested: "bg-indigo-100 text-indigo-700",
        cancelled: "bg-red-100 text-red-700",
        reopened: "bg-yellow-100 text-yellow-700",
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] ?? "bg-gray-100 text-gray-500"}`}
        >
            {status}
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Show({ distribution, can }: Props) {
    useFlashToast();

    const [processing, setProcessing] = useState(false);
    const [paymentItem, setPaymentItem] = useState<DistributionItem | null>(
        null,
    );
    const [historyItem, setHistoryItem] = useState<DistributionItem | null>(
        null,
    );
    const [showReverse, setShowReverse] = useState(false);

    // Reload page after payment change
    function handlePaymentChanged() {
        router.reload({ only: ["distribution"] });
    }

    // ── Approve ──────────────────────────────────────────────────────────────

    function handleApprove() {
        confirmAction({
            title: "Approve Distribution?",
            text: `"${distribution.distribution_no}" will be locked and can no longer be edited.`,
            confirmButtonText: "Yes, approve",
        }).then((ok) => {
            if (!ok) return;
            setProcessing(true);
            router.post(
                route("backend.profit-distributions.approve", distribution.id),
                {},
                {
                    onSuccess: () => toast.success("Distribution approved."),
                    onError: () =>
                        toast.error("Failed to approve distribution."),
                    onFinish: () => setProcessing(false),
                },
            );
        });
    }

    // ── Distribute ───────────────────────────────────────────────────────────

    function handleDistribute() {
        confirmAction({
            title: "Mark as Distributed?",
            text: "This will mark the distribution as fully distributed to investors.",
            confirmButtonText: "Yes, distribute",
        }).then((ok) => {
            if (!ok) return;
            setProcessing(true);
            router.post(
                route(
                    "backend.profit-distributions.distribute",
                    distribution.id,
                ),
                {},
                {
                    onSuccess: () =>
                        toast.success("Distribution marked as distributed."),
                    onError: () => toast.error("Failed to update status."),
                    onFinish: () => setProcessing(false),
                },
            );
        });
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    function handleDelete() {
        confirmAction({
            title: "Delete Distribution?",
            text: `"${distribution.distribution_no}" will be moved to trash.`,
            confirmButtonText: "Yes, delete",
        }).then((ok) => {
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
        });
    }

    const isSettleable =
        distribution.status === "approved" ||
        distribution.status === "distributed";

    return (
        <AuthenticatedLayout>
            <Head title={distribution.distribution_no} />

            {/* Payment action modal */}
            {paymentItem && (
                <ExtendedPaymentModal
                    item={paymentItem}
                    distributionId={distribution.id}
                    onClose={() => setPaymentItem(null)}
                    onSuccess={handlePaymentChanged}
                />
            )}

            {/* Payment history modal */}
            {historyItem && (
                <PaymentHistoryModal
                    distributionId={distribution.id}
                    itemId={historyItem.id}
                    onClose={() => setHistoryItem(null)}
                    onPaymentChanged={handlePaymentChanged}
                />
            )}

            {/* Reverse modal */}
            {showReverse && (
                <ReverseDistributionModal
                    distributionId={distribution.id}
                    distributionNo={distribution.distribution_no}
                    onClose={() => setShowReverse(false)}
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
                                    <Lock size={14} className="text-gray-400" />
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
                        {can.reverse && distribution.is_locked && (
                            <button
                                onClick={() => setShowReverse(true)}
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                            >
                                <RotateCcw size={14} />
                                Reverse
                            </button>
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

                {/* Main grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left: Financial summary + Items + Eligibility */}
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

                        {/* Full financial breakdown */}
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
                                            {distribution.source_type ===
                                                "investment_based" && (
                                                <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                    Invested
                                                </th>
                                            )}
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Share %
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Share Amount
                                            </th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-500">
                                                Payment
                                            </th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-500">
                                                Action
                                            </th>
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
                                                {distribution.source_type ===
                                                    "investment_based" && (
                                                    <td className="px-4 py-3 text-right text-gray-700">
                                                        ৳{" "}
                                                        {fmt(
                                                            item.invested_amount ??
                                                                0,
                                                        )}
                                                    </td>
                                                )}
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
                                                    <PaymentBadge
                                                        status={
                                                            item.payment_status
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {isSettleable &&
                                                    item.payment_status !==
                                                        "paid" ? (
                                                        <button
                                                            onClick={() =>
                                                                setPaymentItem(
                                                                    item,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                                                        >
                                                            Update
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                setHistoryItem(
                                                                    item,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                                                        >
                                                            History
                                                        </button>
                                                    )}
                                                </td>
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
                                            <td colSpan={2} />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Eligibility Panel */}
                        {distribution.source_type === "investment_based" &&
                            distribution.eligibilities &&
                            distribution.eligibilities.length > 0 && (
                                <EligibilityPanel
                                    distributionId={distribution.id}
                                    eligibilities={distribution.eligibilities}
                                    isLocked={distribution.is_locked}
                                    canOverride={can.override_eligibility}
                                />
                            )}
                    </div>

                    {/* Right: Sidebar */}
                    <div className="space-y-4">
                        {/* Period */}
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

                        {/* Record Info */}
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

                        {/* Audit Trail */}
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
