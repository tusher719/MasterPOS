// resources/js/Pages/Backend/CapitalLedger/_components/WithdrawalModal.tsx

import { router } from "@inertiajs/react";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    investmentId: number;
    investorName: string;
    currentBalance: number;
    availableToWithdraw: number; // ← নতুন prop
    onClose: () => void;
}

const fmt = (val: number) =>
    "৳ " + val.toLocaleString("en-BD", { minimumFractionDigits: 2 });

export default function WithdrawalModal({
    investmentId,
    investorName,
    currentBalance,
    availableToWithdraw,
    onClose,
}: Props) {
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [processing, setProcessing] = useState(false);

    const numAmount = Number(amount);
    const exceedsBalance = numAmount > currentBalance;
    const exceedsUnlocked = numAmount > availableToWithdraw;
    const hasError = exceedsBalance || exceedsUnlocked;
    const fullyLocked = availableToWithdraw <= 0;

    const handleSubmit = () => {
        if (!amount || numAmount <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }
        if (exceedsBalance) {
            toast.error("Withdrawal amount exceeds current capital balance.");
            return;
        }
        if (exceedsUnlocked) {
            toast.error(
                `You can currently withdraw up to ${fmt(availableToWithdraw)} — the rest is still locked.`,
            );
            return;
        }

        setProcessing(true);
        router.post(
            route("backend.capital-ledger.store"),
            {
                investment_id: investmentId,
                transaction_type: "withdrawal",
                amount,
                note,
            },
            {
                onSuccess: () => {
                    toast.success(
                        "Withdrawal request submitted. Awaiting approval.",
                    );
                    onClose();
                },
                onError: (errors) => {
                    toast.error(
                        (Object.values(errors)[0] as string) ||
                            "Failed to submit withdrawal request.",
                    );
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Withdrawal Request
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {investorName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    {/* Balance hints */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                            <p className="text-xs text-gray-500 mb-0.5">
                                Current Balance
                            </p>
                            <p className="text-sm font-semibold text-gray-800">
                                {fmt(currentBalance)}
                            </p>
                        </div>
                        <div
                            className={`rounded-lg border px-4 py-3 ${
                                fullyLocked
                                    ? "bg-red-50 border-red-200"
                                    : "bg-green-50 border-green-200"
                            }`}
                        >
                            <p className="text-xs text-gray-500 mb-0.5">
                                Available to Withdraw
                            </p>
                            <p
                                className={`text-sm font-semibold ${
                                    fullyLocked
                                        ? "text-red-600"
                                        : "text-green-700"
                                }`}
                            >
                                {fmt(availableToWithdraw)}
                            </p>
                        </div>
                    </div>

                    {/* Fully locked warning */}
                    {fullyLocked && (
                        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">
                                Principal is fully locked. No withdrawal is
                                possible until business sales recover more of
                                the invested capital.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Withdrawal Amount{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            disabled={fullyLocked}
                            className={`w-full rounded-md text-sm focus:ring-indigo-500 ${
                                hasError
                                    ? "border-red-300 focus:border-red-500"
                                    : "border-gray-300 focus:border-indigo-500"
                            } disabled:bg-gray-50 disabled:text-gray-400`}
                        />
                        {exceedsUnlocked && !exceedsBalance && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                <AlertTriangle className="h-3 w-3" />
                                Exceeds unlocked amount of{" "}
                                {fmt(availableToWithdraw)}
                            </p>
                        )}
                        {exceedsBalance && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                <AlertTriangle className="h-3 w-3" />
                                Exceeds available balance of{" "}
                                {fmt(currentBalance)}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Note{" "}
                            <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            placeholder="Reason for withdrawal..."
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                        ⚠ This request will be reviewed by an admin before the
                        balance is deducted.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={processing || hasError || fullyLocked}
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-60"
                    >
                        {processing ? "Submitting..." : "Submit Request"}
                    </button>
                </div>
            </div>
        </div>
    );
}
