// resources/js/Pages/Backend/CapitalLedger/Show.tsx

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import type {
    ExpenseOption,
    FundUsage,
    PurchaseOption,
} from "@/types/fund-usage";
import { Head, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Building2,
    Clock,
    Lock,
    MinusCircle,
    PlusCircle,
    SlidersHorizontal,
    TrendingDown,
    TrendingUp,
    Unlock,
    Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AdjustmentModal from "./_components/AdjustmentModal";
import DepositModal from "./_components/DepositModal";
import FundUsagePanel from "./_components/FundUsagePanel";
import LedgerTable from "./_components/LedgerTable";
import WithdrawalApprovalModal from "./_components/WithdrawalApprovalModal";
import WithdrawalModal from "./_components/WithdrawalModal";

interface Investment {
    id: number;
    investor_name: string;
    investment_date: string;
    status: string;
    amount: string;
}

interface Balance {
    total_deposited: string;
    total_withdrawn: string;
    total_reinvested: string;
    total_adjusted: string;
    current_balance: string;
    unlocked_amount: string;
    locked_amount: string;
    available_to_withdraw: string;
}

interface PendingWithdrawal {
    id: number;
    amount: string;
    note: string | null;
    created_at: string;
}

interface FundUsageEntry {
    entry_id: number;
    reference_no: string | null;
    amount: string;
    linked_amount: number;
    remaining_amount: number;
    usages: FundUsage[];
}

interface Props {
    investment: Investment;
    balance: Balance;
    entries: {
        data: any[];
        meta: any;
        links: any[];
    };
    pendingWithdrawals: PendingWithdrawal[];
    fundUsageData: FundUsageEntry[];
    availablePurchases: PurchaseOption[];
    availableExpenses: ExpenseOption[];
    can: {
        deposit: boolean;
        adjust: boolean;
        request_withdrawal: boolean;
        approve_withdrawal: boolean;
        fund_usage_create: boolean;
        fund_usage_delete: boolean;
    };
}

const fmt = (val: string | number) =>
    "৳ " + Number(val).toLocaleString("en-BD", { minimumFractionDigits: 2 });

export default function CapitalLedgerShow({
    investment,
    balance,
    entries,
    pendingWithdrawals,
    fundUsageData,
    availablePurchases,
    availableExpenses,
    can,
}: Props) {
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdrawal, setShowWithdrawal] = useState(false);
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [approvalEntry, setApprovalEntry] =
        useState<PendingWithdrawal | null>(null);

    // Computed values for lock progress bar
    const deposited = Number(balance.total_deposited);
    const unlocked = Number(balance.unlocked_amount);
    const locked = Number(balance.locked_amount);
    const availableToWith = Number(balance.available_to_withdraw);
    const unlockedPercent =
        deposited > 0 ? Math.min(100, (unlocked / deposited) * 100) : 0;

    return (
        <AuthenticatedLayout>
            <Head title={`Capital Ledger — ${investment.investor_name}`} />

            <div className="space-y-6">
                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() =>
                                router.visit(
                                    route("backend.capital-ledger.index"),
                                )
                            }
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {investment.investor_name}
                            </h1>
                            <p className="mt-0.5 text-sm text-gray-500">
                                Capital Ledger · Since{" "}
                                {String(investment.investment_date).slice(
                                    0,
                                    10,
                                )}
                                <span
                                    className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                        investment.status === "active"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {investment.status}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {can.deposit && (
                            <button
                                onClick={() => setShowDeposit(true)}
                                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
                            >
                                <PlusCircle className="h-4 w-4" />
                                Deposit
                            </button>
                        )}
                        {can.request_withdrawal && (
                            <button
                                onClick={() => setShowWithdrawal(true)}
                                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100"
                            >
                                <MinusCircle className="h-4 w-4" />
                                Withdraw
                            </button>
                        )}
                        {can.adjust && (
                            <button
                                onClick={() => setShowAdjustment(true)}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                Adjust
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Pending Withdrawals Alert ─────────────────────────────── */}
                {pendingWithdrawals.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-700">
                                {pendingWithdrawals.length} Pending Withdrawal
                                {pendingWithdrawals.length > 1 ? "s" : ""}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {pendingWithdrawals.map((w) => (
                                <div
                                    key={w.id}
                                    className="flex items-center justify-between rounded-md bg-white border border-amber-100 px-3 py-2"
                                >
                                    <div>
                                        <span className="text-sm font-medium text-gray-800">
                                            {fmt(w.amount)}
                                        </span>
                                        {w.note && (
                                            <span className="ml-2 text-xs text-gray-400">
                                                {w.note}
                                            </span>
                                        )}
                                        <span className="ml-2 text-xs text-gray-400">
                                            ·{" "}
                                            {new Date(
                                                w.created_at,
                                            ).toLocaleDateString("en-BD")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {can.approve_withdrawal && (
                                            <button
                                                onClick={() =>
                                                    setApprovalEntry(w)
                                                }
                                                className="rounded-md bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                                            >
                                                Review
                                            </button>
                                        )}
                                        {can.request_withdrawal && (
                                            <button
                                                onClick={() => {
                                                    if (
                                                        !confirm(
                                                            "Cancel this withdrawal request?",
                                                        )
                                                    )
                                                        return;
                                                    router.post(
                                                        route(
                                                            "backend.capital-withdrawals.cancel",
                                                            {
                                                                entry: w.id,
                                                            },
                                                        ),
                                                        {},
                                                        {
                                                            onSuccess: () =>
                                                                toast.success(
                                                                    "Withdrawal request cancelled.",
                                                                ),
                                                            onError: () =>
                                                                toast.error(
                                                                    "Failed to cancel withdrawal.",
                                                                ),
                                                        },
                                                    );
                                                }}
                                                className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Principal Lock Status Card ────────────────────────────── */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-3 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                            Principal Lock Status
                        </span>
                        <span className="ml-auto text-xs text-gray-400">
                            Based on total sales since{" "}
                            {String(investment.investment_date).slice(0, 10)}
                        </span>
                    </div>
                    <div className="p-5 space-y-4">
                        {/* Progress Bar */}
                        <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                <span>
                                    Unlocked:{" "}
                                    <span className="font-medium text-green-700">
                                        {fmt(balance.unlocked_amount)}
                                    </span>
                                </span>
                                <span className="font-medium text-indigo-600">
                                    {unlockedPercent.toFixed(1)}% of principal
                                    recovered
                                </span>
                                <span>
                                    Locked:{" "}
                                    <span className="font-medium text-amber-700">
                                        {fmt(balance.locked_amount)}
                                    </span>
                                </span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                                    style={{ width: `${unlockedPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* 3 stat boxes */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Unlock className="h-3.5 w-3.5 text-green-600" />
                                    <p className="text-xs text-green-700 font-medium">
                                        Unlocked
                                    </p>
                                </div>
                                <p className="text-base font-bold text-green-700">
                                    {fmt(balance.unlocked_amount)}
                                </p>
                                <p className="text-xs text-green-600 mt-0.5">
                                    Can be requested
                                </p>
                            </div>

                            <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Lock className="h-3.5 w-3.5 text-amber-600" />
                                    <p className="text-xs text-amber-700 font-medium">
                                        Locked
                                    </p>
                                </div>
                                <p className="text-base font-bold text-amber-700">
                                    {fmt(balance.locked_amount)}
                                </p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                    Awaiting sales recovery
                                </p>
                            </div>

                            <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Wallet className="h-3.5 w-3.5 text-indigo-600" />
                                    <p className="text-xs text-indigo-700 font-medium">
                                        Available to Withdraw
                                    </p>
                                </div>
                                <p className="text-base font-bold text-indigo-700">
                                    {fmt(balance.available_to_withdraw)}
                                </p>
                                <p className="text-xs text-indigo-600 mt-0.5">
                                    Unlocked − already withdrawn
                                </p>
                            </div>
                        </div>

                        {/* Fully locked notice */}
                        {availableToWith <= 0 && deposited > 0 && (
                            <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-700">
                                Principal is fully locked — no withdrawal
                                available until business sales recover more of
                                the invested capital.
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Balance Summary Cards ─────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Wallet className="h-4 w-4 text-indigo-600" />
                            <p className="text-xs text-indigo-600 font-medium">
                                Current Balance
                            </p>
                        </div>
                        <p className="text-xl font-bold text-indigo-700">
                            {fmt(balance.current_balance)}
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <p className="text-xs text-gray-500">
                                Total Deposited
                            </p>
                        </div>
                        <p className="text-lg font-semibold text-green-700">
                            {fmt(balance.total_deposited)}
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <p className="text-xs text-gray-500">
                                Total Withdrawn
                            </p>
                        </div>
                        <p className="text-lg font-semibold text-red-500">
                            {fmt(balance.total_withdrawn)}
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <p className="text-xs text-gray-500">Reinvested</p>
                        </div>
                        <p className="text-lg font-semibold text-blue-600">
                            {fmt(balance.total_reinvested)}
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                            <p className="text-xs text-gray-500">
                                Net Adjusted
                            </p>
                        </div>
                        <p
                            className={`text-lg font-semibold ${
                                Number(balance.total_adjusted) >= 0
                                    ? "text-gray-700"
                                    : "text-red-500"
                            }`}
                        >
                            {fmt(balance.total_adjusted)}
                        </p>
                    </div>
                </div>

                {/* ── Ledger Table ──────────────────────────────────────────── */}
                <LedgerTable entries={entries} />

                {/* ── Fund Usage Panels ─────────────────────────────────────── */}
                {fundUsageData.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700">
                            Withdrawal Fund Usages
                        </h2>
                        {fundUsageData.map((entry) => (
                            <div key={entry.entry_id}>
                                <p className="mb-2 text-xs text-gray-500">
                                    Withdrawal{" "}
                                    <span className="font-medium text-gray-700">
                                        {entry.reference_no ??
                                            `#${entry.entry_id}`}
                                    </span>{" "}
                                    ·{" "}
                                    {Number(entry.amount).toLocaleString(
                                        "en-US",
                                        {
                                            minimumFractionDigits: 2,
                                        },
                                    )}{" "}
                                    BDT
                                </p>
                                <FundUsagePanel
                                    entryId={entry.entry_id}
                                    entryAmount={Number(entry.amount)}
                                    linkedAmount={entry.linked_amount}
                                    remainingAmount={entry.remaining_amount}
                                    usages={entry.usages}
                                    purchases={availablePurchases}
                                    expenses={availableExpenses}
                                    can={{
                                        create: can.fund_usage_create,
                                        delete: can.fund_usage_delete,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modals ───────────────────────────────────────────────────── */}
            {showDeposit && (
                <DepositModal
                    investmentId={investment.id}
                    investorName={investment.investor_name}
                    onClose={() => setShowDeposit(false)}
                />
            )}
            {showWithdrawal && (
                <WithdrawalModal
                    investmentId={investment.id}
                    investorName={investment.investor_name}
                    currentBalance={Number(balance.current_balance)}
                    availableToWithdraw={availableToWith}
                    onClose={() => setShowWithdrawal(false)}
                />
            )}
            {showAdjustment && (
                <AdjustmentModal
                    investmentId={investment.id}
                    investorName={investment.investor_name}
                    onClose={() => setShowAdjustment(false)}
                />
            )}
            {approvalEntry && (
                <WithdrawalApprovalModal
                    entry={approvalEntry}
                    onClose={() => setApprovalEntry(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
