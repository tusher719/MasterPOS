// resources/js/Pages/Backend/CapitalLedger/_components/WithdrawalApprovalModal.tsx

import { router } from "@inertiajs/react";
import { CheckCircle, X, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PendingWithdrawal {
    id: number;
    amount: string;
    note: string | null;
    created_at: string;
}

interface Props {
    entry: PendingWithdrawal;
    onClose: () => void;
}

const fmt = (val: string | number) =>
    "৳ " + Number(val).toLocaleString("en-BD", { minimumFractionDigits: 2 });

export default function WithdrawalApprovalModal({ entry, onClose }: Props) {
    const [rejectReason, setRejectReason] = useState("");
    const [mode, setMode] = useState<"review" | "reject">("review");
    const [processing, setProcessing] = useState(false);

    const handleApprove = () => {
        setProcessing(true);
        router.post(
            route("backend.capital-withdrawals.approve", { entry: entry.id }),
            {},
            {
                onSuccess: () => {
                    toast.success("Withdrawal approved and balance updated.");
                    onClose();
                },
                onError: (errors) => {
                    toast.error(
                        (Object.values(errors)[0] as string) ||
                            "Failed to approve withdrawal.",
                    );
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const handleReject = () => {
        if (!rejectReason.trim()) {
            toast.error("Please provide a reason for rejection.");
            return;
        }
        setProcessing(true);
        router.post(
            route("backend.capital-withdrawals.reject", { entry: entry.id }),
            { reason: rejectReason },
            {
                onSuccess: () => {
                    toast.success("Withdrawal request rejected.");
                    onClose();
                },
                onError: (errors) => {
                    toast.error(
                        (Object.values(errors)[0] as string) ||
                            "Failed to reject withdrawal.",
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
                    <h2 className="text-base font-semibold text-gray-800">
                        Review Withdrawal Request
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    {/* Amount */}
                    <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">
                            Requested Amount
                        </p>
                        <p className="text-2xl font-bold text-gray-800">
                            {fmt(entry.amount)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Requested on{" "}
                            {new Date(entry.created_at).toLocaleDateString(
                                "en-BD",
                            )}
                        </p>
                    </div>

                    {entry.note && (
                        <div className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3">
                            <p className="text-xs text-blue-600 font-medium mb-1">
                                Note from requester
                            </p>
                            <p className="text-sm text-blue-800">
                                {entry.note}
                            </p>
                        </div>
                    )}

                    {mode === "reject" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rejection Reason{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) =>
                                    setRejectReason(e.target.value)
                                }
                                rows={3}
                                placeholder="Explain why this withdrawal is being rejected..."
                                className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    {mode === "review" ? (
                        <>
                            <button
                                onClick={onClose}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => setMode("reject")}
                                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                            >
                                <XCircle className="h-4 w-4" />
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={processing}
                                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-60"
                            >
                                <CheckCircle className="h-4 w-4" />
                                {processing ? "Approving..." : "Approve"}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setMode("review")}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-60"
                            >
                                <XCircle className="h-4 w-4" />
                                {processing
                                    ? "Rejecting..."
                                    : "Confirm Rejection"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
