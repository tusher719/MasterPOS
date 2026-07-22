// resources/js/Pages/Backend/Partners/Show.tsx
// Full file replace

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    PartnerCapitalSummary,
    PartnerProfitBalance,
    PartnerShowProps,
} from "@/types/partner";
import {
    PARTNER_STATUS_COLORS,
    PARTNER_TYPE_COLORS,
    PARTNER_TYPE_LABELS,
    getPartnerTypes,
} from "@/types/partner-colors";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    FileText,
    Lock,
    Mail,
    MapPin,
    Pencil,
    Phone,
    RotateCcw,
    ShieldAlert,
    Trash2,
    TrendingUp,
    Unlock,
    User,
    Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import EditPartnerModal from "./_components/EditPartnerModal";
import EligibilityPanel from "./_components/EligibilityPanel";
import LinkedInvestmentsCard from "./_components/LinkedInvestmentsCard";
import LinkInvestmentModal from "./_components/LinkInvestmentModal";
import ProductAssignmentsPanel from "./_components/ProductAssignmentsPanel";
import ProfitRulesPanel from "./_components/ProfitRulesPanel";
import SettlementConfigPanel from "./_components/SettlementConfigPanel";

// ─── Extra types for Gap 1.5 ──────────────────────────────────────────────────

interface RecentProfitItem {
    id: number;
    profit_distribution_id: number;
    share_percent: string;
    share_amount: string;
    cost_return_amount: string | null;
    payment_status: string;
    updated_at: string;
    profit_distribution: {
        id: number;
        distribution_no: string;
        period_start: string;
        period_end: string;
        status: string;
    } | null;
}

// ─── Extended Props ───────────────────────────────────────────────────────────

interface ExtendedShowProps extends PartnerShowProps {
    recentProfitItems: RecentProfitItem[];
    capitalSummaries: PartnerCapitalSummary[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "—";
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function fmtShortDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    partial: "bg-blue-100 text-blue-700",
    deferred: "bg-purple-100 text-purple-700",
    reinvested: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-red-100 text-red-700",
    reopened: "bg-yellow-100 text-yellow-700",
    pending: "bg-amber-100 text-amber-700",
};

// ─── Shared StatBox ───────────────────────────────────────────────────────────

function StatBox({
    label,
    value,
    color = "text-gray-800",
}: {
    label: string;
    value: string | number | null;
    color?: string;
}) {
    return (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`mt-1 text-sm font-semibold ${color}`}>
                ৳ {fmt(value)}
            </p>
        </div>
    );
}

// ─── Capital Overview Section (Gap 1.4) ───────────────────────────────────────

function CapitalOverviewSection({
    summaries,
}: {
    summaries: PartnerCapitalSummary[];
}) {
    if (summaries.length === 0) return null;

    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-sm font-semibold text-gray-700">
                        Capital Overview
                    </h2>
                </div>
                <Link
                    href={route("backend.capital-ledger.index")}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                >
                    Capital Ledger <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="divide-y divide-gray-100">
                {summaries.map((s) => (
                    <div key={s.investment_id} className="p-5 space-y-4">
                        {/* Investment header row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={route(
                                        "backend.capital-ledger.show",
                                        s.investment_id,
                                    )}
                                    className="text-sm font-semibold text-indigo-700 hover:underline"
                                >
                                    {s.investment_title}
                                </Link>
                                {s.is_primary && (
                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                        Primary
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-gray-400">
                                Since {fmtShortDate(s.investment_date)}
                            </span>
                        </div>

                        {/* Balance stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <StatBox
                                label="Total Deposited"
                                value={s.total_deposited}
                                color="text-green-700"
                            />
                            <StatBox
                                label="Total Withdrawn"
                                value={s.total_withdrawn}
                                color="text-red-600"
                            />
                            <StatBox
                                label="Current Balance"
                                value={s.current_balance}
                                color="text-gray-800"
                            />
                        </div>

                        {/* Principal lock progress bar (Gap 4.1) */}
                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                    <Unlock className="h-3 w-3 text-green-600" />
                                    Principal Lock Status
                                </span>
                                <span className="text-xs text-gray-500">
                                    {s.unlock_percent}% unlocked
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="h-2 rounded-full bg-green-500 transition-all"
                                    style={{
                                        width: `${s.unlock_percent}%`,
                                    }}
                                />
                            </div>

                            {/* Lock stat boxes */}
                            <div className="mt-3 grid grid-cols-3 gap-3">
                                <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Unlock className="h-3 w-3 text-green-600" />
                                        <p className="text-xs text-green-700">
                                            Unlocked
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-green-700">
                                        ৳ {fmt(s.unlocked_amount)}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Lock className="h-3 w-3 text-amber-600" />
                                        <p className="text-xs text-amber-700">
                                            Locked
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-amber-700">
                                        ৳ {fmt(s.locked_amount)}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                                    <p className="text-xs text-indigo-700 mb-1">
                                        Available
                                    </p>
                                    <p className="text-sm font-semibold text-indigo-700">
                                        ৳ {fmt(s.available_to_withdraw)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Profit Balance Card ──────────────────────────────────────────────────────

function ProfitBalanceCard({ balance }: { balance: PartnerProfitBalance }) {
    const totalPending =
        Number(balance.pending_cost_balance) +
        Number(balance.pending_profit_balance);

    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-sm font-semibold text-gray-700">
                        Profit Balance
                    </h2>
                </div>
                {totalPending > 0 && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        ৳ {fmt(totalPending)} pending
                    </span>
                )}
            </div>
            <div className="p-5 space-y-4">
                {/* Cost Return */}
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Cost Return
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <StatBox
                            label="Total Accrued"
                            value={balance.total_cost_returned}
                            color="text-green-700"
                        />
                        <StatBox
                            label="Total Paid"
                            value={balance.total_cost_paid}
                            color="text-indigo-700"
                        />
                        <StatBox
                            label="Pending"
                            value={balance.pending_cost_balance}
                            color="text-amber-700"
                        />
                    </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Profit Share */}
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Profit Share
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <StatBox
                            label="Total Earned"
                            value={balance.total_profit_earned}
                            color="text-green-700"
                        />
                        <StatBox
                            label="Total Paid"
                            value={balance.total_profit_paid}
                            color="text-indigo-700"
                        />
                        <StatBox
                            label="Pending"
                            value={balance.pending_profit_balance}
                            color="text-amber-700"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Recent Profit Payments Card ──────────────────────────────────────────────

function RecentProfitPaymentsCard({ items }: { items: RecentProfitItem[] }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-sm font-semibold text-gray-700">
                        Recent Profit Payments
                    </h2>
                </div>
                <Link
                    href={route("backend.profit-distributions.index")}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                >
                    View All <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            <div className="p-5">
                {items.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-100 bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                        Distribution
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                        Period
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-indigo-600">
                                        Profit Share
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-green-600">
                                        Cost Return
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {items.map((item) => {
                                    const costReturn = Number(
                                        item.cost_return_amount ?? 0,
                                    );
                                    const profitShare =
                                        Number(item.share_amount) - costReturn;
                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-3 py-2">
                                                {item.profit_distribution ? (
                                                    <Link
                                                        href={route(
                                                            "backend.profit-distributions.show",
                                                            item
                                                                .profit_distribution
                                                                .id,
                                                        )}
                                                        className="font-mono text-xs font-medium text-indigo-600 hover:underline"
                                                    >
                                                        {
                                                            item
                                                                .profit_distribution
                                                                .distribution_no
                                                        }
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-500">
                                                {item.profit_distribution ? (
                                                    <>
                                                        {fmtShortDate(
                                                            item
                                                                .profit_distribution
                                                                .period_start,
                                                        )}
                                                        {" → "}
                                                        {fmtShortDate(
                                                            item
                                                                .profit_distribution
                                                                .period_end,
                                                        )}
                                                    </>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right text-xs font-semibold text-indigo-700">
                                                ৳ {fmt(profitShare)}
                                            </td>
                                            <td className="px-3 py-2 text-right text-xs text-green-700">
                                                {costReturn > 0 ? (
                                                    `৳ ${fmt(costReturn)}`
                                                ) : (
                                                    <span className="text-gray-300">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[item.payment_status] ?? "bg-gray-100 text-gray-600"}`}
                                                >
                                                    {item.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">
                        No profit payments recorded for this partner yet.
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Show({
    partner,
    investmentOptions,
    profitRules,
    eligibilities,
    settlementConfigs,
    productAssignments,
    products,
    profitBalance,
    capitalSummaries,
    recentProfitItems,
    can,
    profitRuleCan,
    eligibilityCan,
    settlementConfigCan,
    assignmentCan,
}: ExtendedShowProps) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);

    const activeTypes = getPartnerTypes(partner);

    // -------------------------------------------------------------------------
    // Actions
    // -------------------------------------------------------------------------

    const handleDelete = () => {
        Swal.fire({
            title: "Delete Partner?",
            text: `"${partner.name}" will be soft-deleted and can be restored later.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("backend.partners.destroy", { partner: partner.id }),
                    {
                        onSuccess: () => {
                            toast.success("Partner deleted.");
                            router.visit(route("backend.partners.index"));
                        },
                        onError: () => toast.error("Failed to delete partner."),
                    },
                );
            }
        });
    };

    const handleRestore = () => {
        Swal.fire({
            title: "Restore Partner?",
            text: `"${partner.name}" will be restored.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#4f46e5",
            confirmButtonText: "Yes, restore it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route("backend.partners.restore", { id: partner.id }),
                    {},
                    {
                        onSuccess: () => toast.success("Partner restored."),
                        onError: () =>
                            toast.error("Failed to restore partner."),
                    },
                );
            }
        });
    };

    const handleForceDelete = () => {
        Swal.fire({
            title: "Permanently Delete?",
            text: `"${partner.name}" and all its linked data will be permanently removed. This cannot be undone.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, permanently delete!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("backend.partners.force-delete", { id: partner.id }),
                    {
                        onSuccess: () => {
                            toast.success("Partner permanently deleted.");
                            router.visit(route("backend.partners.index"));
                        },
                        onError: () =>
                            toast.error(
                                "Failed to permanently delete partner.",
                            ),
                    },
                );
            }
        });
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <AuthenticatedLayout>
            <Head title={`Partner — ${partner.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <a
                            href={route("backend.partners.index")}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                            title="Back to Partners"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {partner.name}
                                </h1>
                                {partner.code && (
                                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 font-mono text-xs font-medium text-indigo-700">
                                        {partner.code}
                                    </span>
                                )}
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                                {activeTypes.map((type) => (
                                    <span
                                        key={type}
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PARTNER_TYPE_COLORS[type]}`}
                                    >
                                        {PARTNER_TYPE_LABELS[type]}
                                    </span>
                                ))}
                                {activeTypes.length === 0 && (
                                    <span className="text-xs text-gray-400">
                                        No type assigned
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!partner.deleted_at && can.edit && (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit
                            </button>
                        )}
                        {!partner.deleted_at && can.delete && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        )}
                        {partner.deleted_at && can.restore && (
                            <button
                                onClick={handleRestore}
                                className="flex items-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Restore
                            </button>
                        )}
                        {partner.deleted_at && can.forceDelete && (
                            <button
                                onClick={handleForceDelete}
                                className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                            >
                                <ShieldAlert className="h-4 w-4" />
                                Permanently Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Deleted banner */}
                {partner.deleted_at && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        This partner has been deleted. Restore it to make it
                        active again.
                    </div>
                )}

                {/* Main content — 3 column layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left — main content (2 cols) */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Partner Info Card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-700">
                                Partner Information
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="flex items-start gap-3">
                                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Phone
                                            </p>
                                            <p className="text-sm text-gray-800">
                                                {partner.phone ?? (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Email
                                            </p>
                                            <p className="text-sm text-gray-800">
                                                {partner.email ? (
                                                    <a
                                                        href={`mailto:${partner.email}`}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        {partner.email}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 sm:col-span-2">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Address
                                            </p>
                                            <p className="whitespace-pre-line text-sm text-gray-800">
                                                {partner.address ?? (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {partner.user && (
                                        <div className="flex items-start gap-3 sm:col-span-2">
                                            <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-400">
                                                    Linked System User
                                                </p>
                                                <p className="text-sm text-gray-800">
                                                    {partner.user.name}
                                                    {partner.user.email && (
                                                        <span className="ml-1 text-gray-400">
                                                            (
                                                            {partner.user.email}
                                                            )
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {partner.note && (
                                    <div className="flex items-start gap-3 border-t border-gray-100 pt-4">
                                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Note
                                            </p>
                                            <p className="whitespace-pre-line text-sm text-gray-700">
                                                {partner.note}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gap 1.4 — Capital Overview (shown only when linked investments exist) */}
                        <CapitalOverviewSection summaries={capitalSummaries} />

                        {/* Gap 1.5 / 4.2 — Profit Balance */}
                        {profitBalance ? (
                            <ProfitBalanceCard balance={profitBalance} />
                        ) : (
                            <div className="rounded-lg border border-gray-200 bg-white p-5">
                                <div className="mb-2 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-gray-400" />
                                    <h2 className="text-sm font-semibold text-gray-700">
                                        Profit Balance
                                    </h2>
                                </div>
                                <p className="text-sm text-gray-400">
                                    No profit distributions approved for this
                                    partner yet.
                                </p>
                            </div>
                        )}

                        {/* Gap 1.5 — Recent Profit Payments */}
                        <RecentProfitPaymentsCard items={recentProfitItems} />

                        {/* Linked Investments */}
                        <LinkedInvestmentsCard
                            partner={partner}
                            canEdit={can.edit && !partner.deleted_at}
                            onLinkClick={() => setShowLinkModal(true)}
                        />

                        {/* Profit Rules Panel */}
                        <ProfitRulesPanel
                            partner={partner}
                            profitRules={profitRules}
                            can={profitRuleCan}
                        />

                        {/* Eligibility Panel */}
                        <EligibilityPanel
                            partner={partner}
                            eligibilities={eligibilities}
                            can={eligibilityCan}
                        />

                        {/* Settlement Config Panel */}
                        <SettlementConfigPanel
                            partner={partner}
                            settlementConfigs={settlementConfigs}
                            can={settlementConfigCan}
                        />

                        {/* Product Assignments Panel */}
                        <ProductAssignmentsPanel
                            partnerId={partner.id}
                            assignments={productAssignments}
                            products={products}
                            can={assignmentCan}
                        />
                    </div>

                    {/* Right — sidebar (1 col) */}
                    <div className="space-y-4">
                        {/* Status Card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-700">
                                Status
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        Account Status
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PARTNER_STATUS_COLORS[partner.is_active ? "active" : "inactive"]}`}
                                    >
                                        {partner.is_active
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        Record
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${partner.deleted_at ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
                                    >
                                        {partner.deleted_at
                                            ? "Deleted"
                                            : "Active"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Partner Types Card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-700">
                                Partner Types
                            </div>
                            <div className="p-5 space-y-2">
                                {[
                                    {
                                        key: "capital",
                                        flag: partner.partner_type_capital,
                                    },
                                    {
                                        key: "working",
                                        flag: partner.partner_type_working,
                                    },
                                    {
                                        key: "product",
                                        flag: partner.partner_type_product,
                                    },
                                ].map(({ key, flag }) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-sm capitalize text-gray-500">
                                            {PARTNER_TYPE_LABELS[key]}
                                        </span>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${flag ? PARTNER_TYPE_COLORS[key] : "bg-gray-100 text-gray-400"}`}
                                        >
                                            {flag ? "Yes" : "No"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions Card */}
                        {capitalSummaries.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white">
                                <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-700">
                                    Quick Actions
                                </div>
                                <div className="p-4 space-y-2">
                                    <Link
                                        href={route(
                                            "backend.capital-ledger.index",
                                        )}
                                        className="flex w-full items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <Wallet className="h-4 w-4 text-indigo-500" />
                                        Capital Ledger
                                    </Link>
                                    <Link
                                        href={route(
                                            "backend.investor-statements.index",
                                        )}
                                        className="flex w-full items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <FileText className="h-4 w-4 text-indigo-500" />
                                        Full Statement
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Audit Card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-700">
                                Audit
                            </div>
                            <div className="p-5 space-y-3 text-sm">
                                <div className="flex items-start gap-2">
                                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Created
                                        </p>
                                        <p className="text-gray-700">
                                            {new Date(
                                                partner.created_at,
                                            ).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </p>
                                        {partner.created_by_user && (
                                            <p className="text-xs text-gray-400">
                                                by{" "}
                                                {partner.created_by_user.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {partner.updated_by_user && (
                                    <div className="flex items-start gap-2">
                                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Last Updated
                                            </p>
                                            <p className="text-gray-700">
                                                {new Date(
                                                    partner.updated_at,
                                                ).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                by{" "}
                                                {partner.updated_by_user.name}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showEditModal && (
                <EditPartnerModal
                    partner={partner}
                    onClose={() => setShowEditModal(false)}
                />
            )}
            {showLinkModal && (
                <LinkInvestmentModal
                    partner={partner}
                    investmentOptions={investmentOptions}
                    onClose={() => setShowLinkModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}
