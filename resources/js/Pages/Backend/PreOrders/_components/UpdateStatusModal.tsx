// resources/js/Pages/Backend/PreOrders/_components/UpdateStatusModal.tsx

import { PreOrder, PreOrderStatus } from "@/types/pre-order";
import {
    PRE_ORDER_STATUS_COLORS,
    PRE_ORDER_STATUS_LABELS,
    getNextStatuses,
} from "@/types/pre-order-colors";
import { router } from "@inertiajs/react";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    preOrder: PreOrder;
    onClose: () => void;
}

export default function UpdateStatusModal({ preOrder, onClose }: Props) {
    const [selectedStatus, setSelectedStatus] = useState<PreOrderStatus | "">(
        "",
    );
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // ── Valid next statuses based on current ──────────────────────────────────
    const nextStatuses = getNextStatuses(preOrder.status);

    function handleSubmit() {
        if (!selectedStatus) {
            toast.error("Please select a status.");
            return;
        }

        setSubmitting(true);

        // .then() pattern — NOT async/await (Rule 5)
        router.post(
            route("backend.pre-orders.update-status", preOrder.id),
            { status: selectedStatus, note },
            {
                onSuccess: () => {
                    toast.success("Status updated successfully.");
                    onClose();
                },
                onError: (errs) => {
                    const first = Object.values(errs)[0];
                    toast.error(
                        typeof first === "string"
                            ? first
                            : "Failed to update status.",
                    );
                },
                onFinish: () => setSubmitting(false),
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Update Status
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-400">
                            {preOrder.customer_name_snapshot}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    {/* Current status */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Current:</span>
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRE_ORDER_STATUS_COLORS[preOrder.status]}`}
                        >
                            {PRE_ORDER_STATUS_LABELS[preOrder.status]}
                        </span>
                    </div>

                    {/* Next status cards */}
                    {nextStatuses.length === 0 ? (
                        <div className="rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-500">
                            This pre-order is in a terminal status and cannot be
                            changed.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {nextStatuses.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedStatus(s)}
                                    className={`rounded-lg border-2 px-4 py-3 text-left transition ${
                                        selectedStatus === s
                                            ? "border-indigo-500 bg-indigo-50"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRE_ORDER_STATUS_COLORS[s]}`}
                                    >
                                        {PRE_ORDER_STATUS_LABELS[s]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Cancellation warning */}
                    {selectedStatus === "cancelled" && (
                        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
                            <AlertTriangle
                                size={15}
                                className="mt-0.5 shrink-0 text-amber-600"
                            />
                            <p className="text-xs text-amber-700">
                                Cancelling this pre-order will not automatically
                                reverse any advance payment. Handle refunds
                                separately if needed.
                            </p>
                        </div>
                    )}

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Note{" "}
                            <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            placeholder="Add a note about this status change..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={
                            submitting ||
                            !selectedStatus ||
                            nextStatuses.length === 0
                        }
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {submitting ? "Updating..." : "Update Status"}
                    </button>
                </div>
            </div>
        </div>
    );
}
