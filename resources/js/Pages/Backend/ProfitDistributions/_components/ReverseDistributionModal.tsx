import { router } from "@inertiajs/react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    distributionId: number;
    distributionNo: string;
    onClose: () => void;
}

export default function ReverseDistributionModal({
    distributionId,
    distributionNo,
    onClose,
}: Props) {
    const [reason, setReason] = useState("");
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");

    function handleReverse() {
        if (!reason.trim()) {
            setError(
                "Please provide a reason for reversing this distribution.",
            );
            return;
        }

        if (reason.trim().length < 10) {
            setError("Reason must be at least 10 characters.");
            return;
        }

        setError("");
        setProcessing(true);

        router.post(
            route("backend.profit-distributions.reverse", distributionId),
            { reason },
            {
                onSuccess: () => {
                    toast.success(
                        `Distribution ${distributionNo} reversed to draft.`,
                    );
                    onClose();
                },
                onError: (errors) => {
                    const msg =
                        errors.reverse ??
                        (Object.values(errors)[0] as string) ??
                        "Failed to reverse distribution.";
                    setError(msg);
                    toast.error(msg);
                },
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <RotateCcw size={18} className="text-amber-500" />
                        <h3 className="text-base font-semibold text-gray-800">
                            Reverse Distribution
                        </h3>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                        {distributionNo}
                    </p>
                </div>

                {/* Body */}
                <div className="space-y-4 px-5 py-4">
                    {/* Warning */}
                    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <AlertTriangle
                            size={16}
                            className="mt-0.5 shrink-0 text-amber-500"
                        />
                        <div className="text-sm text-amber-700">
                            <p className="font-medium">This action will:</p>
                            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
                                <li>
                                    Revert this distribution back to{" "}
                                    <strong>Draft</strong>
                                </li>
                                <li>
                                    Cancel all recorded payment transactions
                                </li>
                                <li>
                                    Reverse all investor profit balance credits
                                </li>
                                <li>Unlock the distribution for editing</li>
                            </ul>
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Reason for Reversal{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={4}
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (error) setError("");
                            }}
                            placeholder="Explain why this distribution is being reversed (min. 10 characters)..."
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {error && (
                            <p className="mt-1 text-xs text-red-500">{error}</p>
                        )}
                        <p className="mt-1 text-right text-xs text-gray-400">
                            {reason.length} / 1000
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReverse}
                        disabled={processing || reason.trim().length < 10}
                        className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60"
                    >
                        <RotateCcw size={14} />
                        {processing ? "Reversing..." : "Confirm Reverse"}
                    </button>
                </div>
            </div>
        </div>
    );
}
