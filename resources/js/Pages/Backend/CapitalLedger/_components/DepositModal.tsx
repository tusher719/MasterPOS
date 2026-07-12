// resources/js/Pages/Backend/CapitalLedger/_components/DepositModal.tsx

import { router } from "@inertiajs/react";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    investmentId: number;
    investorName: string;
    onClose: () => void;
}

export default function DepositModal({
    investmentId,
    investorName,
    onClose,
}: Props) {
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [processing, setProcessing] = useState(false);

    const handleSubmit = () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }

        setProcessing(true);
        router.post(
            route("backend.capital-ledger.store"),
            {
                investment_id: investmentId,
                transaction_type: "deposit",
                amount,
                note,
            },
            {
                onSuccess: () => {
                    toast.success("Capital deposit recorded successfully.");
                    onClose();
                },
                onError: (errors) => {
                    toast.error(
                        (Object.values(errors)[0] as string) ||
                            "Failed to record deposit.",
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
                            Capital Deposit
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
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
                            placeholder="e.g. Additional capital injection Q3 2026"
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
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
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {processing ? "Recording..." : "Record Deposit"}
                    </button>
                </div>
            </div>
        </div>
    );
}
