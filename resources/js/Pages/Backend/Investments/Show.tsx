import { AppDateInput } from "@/Components/DatePicker";
import useFlashToast from "@/hooks/useFlashToast";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { confirmAction } from "@/lib/confirm";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Clock,
    DollarSign,
    Download,
    FileText,
    Hash,
    Lock,
    Pencil,
    RotateCcw,
    StickyNote,
    Tag,
    Trash2,
    TrendingUp,
    Unlock,
    User,
    Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";
import InvestmentModal from "./_components/InvestmentModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvestmentType {
    id: number;
    name: string;
}

interface Partner {
    id: number;
    name: string;
    code: string | null;
}

interface Investment {
    id: number;
    title: string;
    investor_name: string;
    amount: string;
    investment_date: string;
    reference: string | null;
    attachment: string | null;
    attachment_url: string | null;
    is_attachment_image: boolean;
    attachment_extension: string | null;
    note: string | null;
    status: "active" | "withdrawn";
    investment_type_id: number;
    investment_type: InvestmentType;
    partner_id: number | null;
    partner: Partner | null;
    creator: { id: number; name: string } | null;
    updater: { id: number; name: string } | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

interface CapitalBalance {
    total_deposited: string;
    total_withdrawn: string;
    total_reinvested: string;
    total_adjusted: string;
    current_balance: string;
    unlocked_amount: string;
    locked_amount: string;
}

interface ProfitBalance {
    total_earned: string;
    total_paid: string;
    total_deferred: string;
    total_reinvested: string;
    pending_balance: string;
}

interface PartnerProfitBalance {
    total_cost_returned: string;
    total_cost_paid: string;
    pending_cost_balance: string;
    total_profit_earned: string;
    total_profit_paid: string;
    pending_profit_balance: string;
}

interface CapitalEntry {
    id: number;
    transaction_type: string;
    direction: "credit" | "debit";
    amount: string;
    running_balance: string;
    reference_no: string | null;
    status: string;
    created_at: string;
}

interface ProfitItem {
    id: number;
    profit_distribution_id: number;
    share_percent: string;
    share_amount: string;
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

interface Props {
    investment: Investment;
    investmentTypes: InvestmentType[];
    capitalBalance: CapitalBalance | null;
    profitBalance: ProfitBalance | null;
    recentCapitalEntries: CapitalEntry[];
    recentProfitItems: ProfitItem[];
    partnerProfitBalance: PartnerProfitBalance | null;
    can: {
        edit: boolean;
        delete: boolean;
        restore: boolean;
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "—";
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function fmtDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function fmtDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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

const TX_TYPE_LABELS: Record<string, string> = {
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    reinvestment: "Reinvestment",
    adjustment: "Adjustment",
};

const TX_TYPE_COLORS: Record<string, string> = {
    deposit: "text-green-700",
    withdrawal: "text-red-600",
    reinvestment: "text-indigo-700",
    adjustment: "text-amber-700",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({
    label,
    value,
    color = "text-gray-800",
    prefix = "৳ ",
}: {
    label: string;
    value: string | number | null;
    color?: string;
    prefix?: string;
}) {
    return (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`mt-1 text-sm font-semibold ${color}`}>
                {prefix}
                {fmt(value)}
            </p>
        </div>
    );
}

function SectionCard({
    title,
    icon,
    children,
    action,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="text-sm font-semibold text-gray-700">
                        {title}
                    </h2>
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Show({
    investment,
    investmentTypes,
    capitalBalance,
    profitBalance,
    recentCapitalEntries,
    recentProfitItems,
    partnerProfitBalance,
    can,
}: Props) {
    useFlashToast();

    const [showEditModal, setShowEditModal] = useState(false);
    const [investmentDate, setInvestmentDate] = useState<string>(
        investment.investment_date
            ? investment.investment_date.slice(0, 10)
            : "",
    );

    function handleDateChange(val: string) {
        if (!val) return;
        setInvestmentDate(val);
        router.put(
            route("backend.investments.update", investment.id),
            { investment_date: val },
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Investment date updated."),
                onError: () => toast.error("Could not update investment date."),
            },
        );
    }

    async function handleDelete() {
        const ok = await confirmAction({
            title: "Delete Investment",
            text: `Are you sure you want to delete "${investment.title}"? This action can be undone.`,
            confirmButtonText: "Yes, Delete",
        });
        if (!ok) return;
        router.delete(route("backend.investments.destroy", investment.id), {
            onSuccess: () => router.visit(route("backend.investments.index")),
        });
    }

    async function handleRestore() {
        const ok = await confirmAction({
            title: "Restore Investment",
            text: `Restore "${investment.title}"?`,
            confirmButtonText: "Yes, Restore",
        });
        if (!ok) return;
        router.post(
            route("backend.investments.restore", investment.id),
            {},
            {
                onSuccess: () =>
                    toast.success("Investment restored successfully."),
            },
        );
    }

    const isActive = investment.status === "active";
    const isTrashed = !!investment.deleted_at;
    const fileName = investment.attachment
        ? investment.attachment.split("/").pop()
        : null;

    // Capital lock calculations
    const totalDeposited = Number(capitalBalance?.total_deposited ?? 0);
    const unlockedAmount = Number(capitalBalance?.unlocked_amount ?? 0);
    const lockedAmount = Number(capitalBalance?.locked_amount ?? 0);
    const currentBalance = Number(capitalBalance?.current_balance ?? 0);
    const totalWithdrawn = Number(capitalBalance?.total_withdrawn ?? 0);
    const availableToWithdraw = Math.max(0, unlockedAmount - totalWithdrawn);
    const unlockedPercent =
        totalDeposited > 0
            ? Math.min(100, Math.round((unlockedAmount / totalDeposited) * 100))
            : 0;

    return (
        <AuthenticatedLayout>
            <Head title={`Investment — ${investment.title}`} />

            <div className="space-y-5">
                {/* ── Page Header ── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("backend.investments.index")}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {investment.title}
                            </h1>
                            <p className="mt-0.5 text-sm text-gray-500">
                                Investment Details
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isTrashed ? (
                            can.restore && (
                                <button
                                    onClick={handleRestore}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Restore
                                </button>
                            )
                        ) : (
                            <>
                                {can.edit && (
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Edit
                                    </button>
                                )}
                                {can.delete && (
                                    <button
                                        onClick={handleDelete}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Trashed banner */}
                {isTrashed && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        This investment has been deleted. Restore it to make it
                        active again.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* ── Main Column ── */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Investment Information */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    Investment Information
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <Tag className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Title
                                        </p>
                                        <p className="mt-0.5 text-sm font-medium text-gray-800">
                                            {investment.title}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <User className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Investor Name
                                        </p>
                                        <p className="mt-0.5 text-sm font-medium text-gray-800">
                                            {investment.investor_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <Tag className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Investment Type
                                        </p>
                                        <p className="mt-0.5 text-sm font-medium text-gray-800">
                                            {investment.investment_type?.name ??
                                                "—"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-green-50 p-1.5">
                                        <DollarSign className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Amount
                                        </p>
                                        <p className="mt-0.5 text-lg font-bold text-green-700">
                                            ৳ {fmt(investment.amount)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <Calendar className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Investment Date
                                        </p>
                                        {can.edit && !isTrashed ? (
                                            <div className="mt-1 max-w-[220px]">
                                                <AppDateInput
                                                    value={investmentDate}
                                                    onChange={handleDateChange}
                                                    clearable={false}
                                                />
                                            </div>
                                        ) : (
                                            <p className="mt-0.5 text-sm font-medium text-gray-800">
                                                {fmtDate(
                                                    investment.investment_date,
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <Hash className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Status
                                        </p>
                                        <span
                                            className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                                        >
                                            {isActive ? "Active" : "Withdrawn"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <Hash className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Transaction Reference
                                        </p>
                                        <p className="mt-0.5 text-sm font-medium text-gray-800 font-mono">
                                            {investment.reference ?? (
                                                <span className="text-gray-400 font-sans">
                                                    —
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {investment.note && (
                                    <div className="flex items-start gap-3 px-5 py-4">
                                        <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                            <StickyNote className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                                Note
                                            </p>
                                            <p className="mt-0.5 text-sm text-gray-700 whitespace-pre-wrap">
                                                {investment.note}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Linked Partner */}
                                {investment.partner && (
                                    <div className="flex items-start gap-3 px-5 py-4">
                                        <div className="mt-0.5 rounded-md bg-purple-50 p-1.5">
                                            <User className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                                Linked Partner
                                            </p>
                                            <Link
                                                href={route(
                                                    "backend.partners.show",
                                                    investment.partner.id,
                                                )}
                                                className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
                                            >
                                                {investment.partner.name}
                                                {investment.partner.code && (
                                                    <span className="text-xs text-gray-400">
                                                        (
                                                        {
                                                            investment.partner
                                                                .code
                                                        }
                                                        )
                                                    </span>
                                                )}
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Capital Summary ── */}
                        {capitalBalance ? (
                            <SectionCard
                                title="Capital Summary"
                                icon={
                                    <Wallet className="h-4 w-4 text-indigo-600" />
                                }
                                action={
                                    <Link
                                        href={route(
                                            "backend.capital-ledger.show",
                                            investment.id,
                                        )}
                                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                                    >
                                        View Ledger{" "}
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                }
                            >
                                {/* Balance stat boxes */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
                                    <StatBox
                                        label="Total Deposited"
                                        value={capitalBalance.total_deposited}
                                        color="text-green-700"
                                    />
                                    <StatBox
                                        label="Total Withdrawn"
                                        value={capitalBalance.total_withdrawn}
                                        color="text-red-600"
                                    />
                                    <StatBox
                                        label="Reinvested"
                                        value={capitalBalance.total_reinvested}
                                        color="text-indigo-700"
                                    />
                                    <StatBox
                                        label="Current Balance"
                                        value={capitalBalance.current_balance}
                                        color="text-gray-800"
                                    />
                                </div>

                                {/* Principal Lock Status */}
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-xs font-semibold text-gray-600">
                                            Principal Lock Status
                                        </p>
                                        <span className="text-xs text-gray-500">
                                            {unlockedPercent}% recovered through
                                            sales
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden mb-3">
                                        <div
                                            className="h-2 rounded-full bg-green-500 transition-all"
                                            style={{
                                                width: `${unlockedPercent}%`,
                                            }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="rounded-md border border-green-100 bg-green-50 p-2.5 text-center">
                                            <Unlock className="h-3.5 w-3.5 text-green-600 mx-auto mb-1" />
                                            <p className="text-xs text-green-600">
                                                Unlocked
                                            </p>
                                            <p className="text-sm font-bold text-green-700">
                                                ৳{" "}
                                                {fmt(
                                                    capitalBalance.unlocked_amount,
                                                )}
                                            </p>
                                        </div>
                                        <div className="rounded-md border border-amber-100 bg-amber-50 p-2.5 text-center">
                                            <Lock className="h-3.5 w-3.5 text-amber-600 mx-auto mb-1" />
                                            <p className="text-xs text-amber-600">
                                                Locked
                                            </p>
                                            <p className="text-sm font-bold text-amber-700">
                                                ৳{" "}
                                                {fmt(
                                                    capitalBalance.locked_amount,
                                                )}
                                            </p>
                                        </div>
                                        <div className="rounded-md border border-indigo-100 bg-indigo-50 p-2.5 text-center">
                                            <Wallet className="h-3.5 w-3.5 text-indigo-600 mx-auto mb-1" />
                                            <p className="text-xs text-indigo-600">
                                                Available
                                            </p>
                                            <p className="text-sm font-bold text-indigo-700">
                                                ৳ {fmt(availableToWithdraw)}
                                            </p>
                                        </div>
                                    </div>

                                    {availableToWithdraw <= 0 &&
                                        totalDeposited > 0 && (
                                            <p className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                                                Principal is fully locked — no
                                                withdrawal available until more
                                                sales are recorded.
                                            </p>
                                        )}
                                </div>
                            </SectionCard>
                        ) : (
                            <div className="rounded-lg border border-gray-200 bg-white p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Wallet className="h-4 w-4 text-gray-400" />
                                    <h2 className="text-sm font-semibold text-gray-700">
                                        Capital Summary
                                    </h2>
                                </div>
                                <p className="text-sm text-gray-400">
                                    No capital ledger record found. A deposit
                                    entry will create this automatically.
                                </p>
                            </div>
                        )}

                        {/* ── Profit Summary (investment-based) ── */}
                        {profitBalance ? (
                            <SectionCard
                                title="Profit Summary"
                                icon={
                                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                                }
                                action={
                                    <Link
                                        href={route(
                                            "backend.investor-statements.show",
                                            investment.id,
                                        )}
                                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                                    >
                                        Full Statement{" "}
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                }
                            >
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    <StatBox
                                        label="Total Earned"
                                        value={profitBalance.total_earned}
                                        color="text-green-700"
                                    />
                                    <StatBox
                                        label="Total Paid"
                                        value={profitBalance.total_paid}
                                        color="text-indigo-700"
                                    />
                                    <StatBox
                                        label="Pending Balance"
                                        value={profitBalance.pending_balance}
                                        color="text-amber-700"
                                    />
                                    <StatBox
                                        label="Deferred"
                                        value={profitBalance.total_deferred}
                                        color="text-purple-700"
                                    />
                                    <StatBox
                                        label="Reinvested"
                                        value={profitBalance.total_reinvested}
                                        color="text-blue-700"
                                    />
                                </div>
                            </SectionCard>
                        ) : (
                            <div className="rounded-lg border border-gray-200 bg-white p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-gray-400" />
                                    <h2 className="text-sm font-semibold text-gray-700">
                                        Profit Summary
                                    </h2>
                                </div>
                                <p className="text-sm text-gray-400">
                                    No profit distributions recorded for this
                                    investment yet.
                                </p>
                            </div>
                        )}

                        {/* ── Partner Profit Balance (if linked partner exists) ── */}
                        {partnerProfitBalance && investment.partner && (
                            <SectionCard
                                title={`Partner Profit Balance — ${investment.partner.name}`}
                                icon={
                                    <TrendingUp className="h-4 w-4 text-purple-600" />
                                }
                                action={
                                    <Link
                                        href={route(
                                            "backend.partners.show",
                                            investment.partner.id,
                                        )}
                                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                                    >
                                        View Partner{" "}
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                }
                            >
                                {/* Cost Return row */}
                                <div className="mb-4">
                                    <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Cost Return
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <StatBox
                                            label="Total Accrued"
                                            value={
                                                partnerProfitBalance.total_cost_returned
                                            }
                                            color="text-green-700"
                                        />
                                        <StatBox
                                            label="Total Paid"
                                            value={
                                                partnerProfitBalance.total_cost_paid
                                            }
                                            color="text-indigo-700"
                                        />
                                        <StatBox
                                            label="Pending"
                                            value={
                                                partnerProfitBalance.pending_cost_balance
                                            }
                                            color="text-amber-700"
                                        />
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-100 my-3" />

                                {/* Profit Share row */}
                                <div>
                                    <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Profit Share
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <StatBox
                                            label="Total Earned"
                                            value={
                                                partnerProfitBalance.total_profit_earned
                                            }
                                            color="text-green-700"
                                        />
                                        <StatBox
                                            label="Total Paid"
                                            value={
                                                partnerProfitBalance.total_profit_paid
                                            }
                                            color="text-indigo-700"
                                        />
                                        <StatBox
                                            label="Pending"
                                            value={
                                                partnerProfitBalance.pending_profit_balance
                                            }
                                            color="text-amber-700"
                                        />
                                    </div>
                                </div>
                            </SectionCard>
                        )}

                        {/* ── Recent Capital Transactions ── */}
                        <SectionCard
                            title="Recent Capital Transactions"
                            icon={
                                <Wallet className="h-4 w-4 text-indigo-600" />
                            }
                            action={
                                <Link
                                    href={route(
                                        "backend.capital-ledger.show",
                                        investment.id,
                                    )}
                                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                                >
                                    View All <ArrowRight className="h-3 w-3" />
                                </Link>
                            }
                        >
                            {recentCapitalEntries.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b border-gray-100 bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                                    Type
                                                </th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                                    Amount
                                                </th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                                    Balance After
                                                </th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                                    Ref
                                                </th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {recentCapitalEntries.map(
                                                (entry) => (
                                                    <tr
                                                        key={entry.id}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="px-3 py-2">
                                                            <span
                                                                className={`text-xs font-medium ${TX_TYPE_COLORS[entry.transaction_type] ?? "text-gray-700"}`}
                                                            >
                                                                {TX_TYPE_LABELS[
                                                                    entry
                                                                        .transaction_type
                                                                ] ??
                                                                    entry.transaction_type}
                                                            </span>
                                                        </td>
                                                        <td
                                                            className={`px-3 py-2 text-right text-xs font-semibold ${entry.direction === "credit" ? "text-green-700" : "text-red-600"}`}
                                                        >
                                                            {entry.direction ===
                                                            "credit"
                                                                ? "+"
                                                                : "−"}
                                                            ৳{" "}
                                                            {fmt(entry.amount)}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-xs text-gray-600">
                                                            ৳{" "}
                                                            {fmt(
                                                                entry.running_balance,
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-xs text-gray-500 font-mono">
                                                            {entry.reference_no ??
                                                                "—"}
                                                        </td>
                                                        <td className="px-3 py-2 text-xs text-gray-500">
                                                            {fmtShortDate(
                                                                entry.created_at,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">
                                    No capital transactions recorded yet.
                                </p>
                            )}
                        </SectionCard>

                        {/* ── Recent Profit Payments ── */}
                        <SectionCard
                            title="Recent Profit Payments"
                            icon={
                                <TrendingUp className="h-4 w-4 text-indigo-600" />
                            }
                            action={
                                <Link
                                    href={route(
                                        "backend.investor-statements.show",
                                        investment.id,
                                    )}
                                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                                >
                                    Full Statement{" "}
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                            }
                        >
                            {recentProfitItems.length > 0 ? (
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
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                                    Share %
                                                </th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                                    Amount
                                                </th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {recentProfitItems.map((item) => (
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
                                                                className="text-xs font-medium text-indigo-600 hover:underline font-mono"
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
                                                    <td className="px-3 py-2 text-right text-xs text-gray-600">
                                                        {Number(
                                                            item.share_percent,
                                                        ).toFixed(2)}
                                                        %
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-xs font-semibold text-indigo-700">
                                                        ৳{" "}
                                                        {fmt(item.share_amount)}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[item.payment_status] ?? "bg-gray-100 text-gray-600"}`}
                                                        >
                                                            {
                                                                item.payment_status
                                                            }
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">
                                    No profit payments recorded for this
                                    investment yet.
                                </p>
                            )}
                        </SectionCard>

                        {/* Attachment */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    Attachment
                                </h2>
                            </div>
                            <div className="px-5 py-4">
                                {investment.attachment_url ? (
                                    <div className="space-y-3">
                                        {investment.is_attachment_image && (
                                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                                <img
                                                    src={
                                                        investment.attachment_url
                                                    }
                                                    alt="Investment attachment"
                                                    className="max-h-64 w-full object-contain bg-gray-50"
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-md bg-white border border-gray-200 p-2">
                                                    <FileText className="h-5 w-5 text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 break-all">
                                                        {fileName}
                                                    </p>
                                                    <p className="text-xs text-gray-400 uppercase">
                                                        {
                                                            investment.attachment_extension
                                                        }{" "}
                                                        file
                                                    </p>
                                                </div>
                                            </div>
                                            <a
                                                href={investment.attachment_url}
                                                download
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                Download
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">
                                        No attachment uploaded.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="space-y-5">
                        {/* Record Info */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    Record Info
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                <div className="px-5 py-4">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        Created By
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-800">
                                        {investment.creator?.name ?? "—"}
                                    </p>
                                </div>
                                <div className="px-5 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Created At
                                        </p>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-700">
                                        {fmtDateTime(investment.created_at)}
                                    </p>
                                </div>
                                <div className="px-5 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Last Updated
                                        </p>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-700">
                                        {fmtDateTime(investment.updated_at)}
                                    </p>
                                    {investment.updater && (
                                        <p className="mt-0.5 text-xs text-gray-400">
                                            by {investment.updater.name}
                                        </p>
                                    )}
                                </div>
                                {isTrashed && (
                                    <div className="px-5 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                            <p className="text-xs font-medium text-red-400 uppercase tracking-wide">
                                                Deleted At
                                            </p>
                                        </div>
                                        <p className="mt-1 text-sm text-red-600">
                                            {fmtDateTime(
                                                investment.deleted_at!,
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        {!isTrashed && (
                            <div className="rounded-lg border border-gray-200 bg-white">
                                <div className="border-b border-gray-100 px-5 py-4">
                                    <h2 className="text-sm font-semibold text-gray-700">
                                        Actions
                                    </h2>
                                </div>
                                <div className="px-5 py-4 space-y-2">
                                    {can.edit && (
                                        <button
                                            onClick={() =>
                                                setShowEditModal(true)
                                            }
                                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit Investment
                                        </button>
                                    )}
                                    <Link
                                        href={route(
                                            "backend.capital-ledger.show",
                                            investment.id,
                                        )}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                                    >
                                        <Wallet className="h-4 w-4" />
                                        Capital Ledger
                                    </Link>
                                    <Link
                                        href={route(
                                            "backend.investor-statements.show",
                                            investment.id,
                                        )}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Full Statement
                                    </Link>
                                    {can.delete && (
                                        <button
                                            onClick={handleDelete}
                                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete Investment
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showEditModal && (
                <InvestmentModal
                    investment={investment}
                    investmentTypes={investmentTypes}
                    onClose={() => setShowEditModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}
