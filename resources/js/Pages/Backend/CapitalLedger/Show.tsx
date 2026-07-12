// resources/js/Pages/Backend/CapitalLedger/Show.tsx

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Building2,
    Clock,
    MinusCircle,
    PlusCircle,
    SlidersHorizontal,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AdjustmentModal from "./_components/AdjustmentModal";
import DepositModal from "./_components/DepositModal";
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
}

interface PendingWithdrawal {
    id: number;
    amount: string;
    note: string | null;
    created_at: string;
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
    can: {
        deposit: boolean;
        adjust: boolean;
        request_withdrawal: boolean;
        approve_withdrawal: boolean;
    };
}

const fmt = (val: string | number) =>
    "৳ " + Number(val).toLocaleString("en-BD", { minimumFractionDigits: 2 });

export default function CapitalLedgerShow({
    investment,
    balance,
    entries,
    pendingWithdrawals,
    can,
}: Props) {
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdrawal, setShowWithdrawal] = useState(false);
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [approvalEntry, setApprovalEntry] =
        useState<PendingWithdrawal | null>(null);

    return (
        <AuthenticatedLayout>
            <Head title={`Capital Ledger — ${investment.investor_name}`} />

            <div className="space-y-6">
                {/* Header */}
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
                                {investment.investment_date}
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

                {/* Pending Withdrawals Alert */}
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
                                                            { entry: w.id },
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

                {/* Balance Summary Cards */}
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

                {/* Ledger Table */}
                <LedgerTable entries={entries} />
            </div>

            {/* Modals */}
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
