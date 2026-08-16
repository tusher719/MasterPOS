import { router } from "@inertiajs/react";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ORDER_STATUS_OPTIONS, type OrderStatus } from "../Index";

interface Props {
    sale: {
        id: number;
        reference_no: string;
        order_status: OrderStatus;
    };
    onClose: () => void;
}

export default function UpdateOrderStatusModal({ sale, onClose }: Props) {
    const [status, setStatus] = useState<OrderStatus>(sale.order_status);
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<{
        order_status?: string;
        note?: string;
    }>({});

    const selectedOption = ORDER_STATUS_OPTIONS.find((o) => o.value === status);
    const hasChanged = status !== sale.order_status;

    const handleSubmit = () => {
        setErrors({});

        if (!hasChanged) {
            setErrors({ order_status: "Please select a different status." });
            return;
        }
        if (note.trim().length < 3) {
            setErrors({ note: "Reason must be at least 3 characters." });
            return;
        }

        setSubmitting(true);

        router.post(
            route("backend.pos.sales.update-order-status", sale.id),
            { order_status: status, note: note.trim() },
            {
                onSuccess: () => {
                    toast.success("Order status updated successfully.");
                    onClose();
                },
                onError: (errs) => {
                    setErrors(errs as typeof errors);
                    toast.error("Failed to update status.");
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Update Order Status
                        </h2>
                        <p className="text-xs text-gray-500">
                            {sale.reference_no}
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
                <div className="space-y-4 px-5 py-4">
                    {/* Status selector */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            New Status <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {ORDER_STATUS_OPTIONS.map((opt) => {
                                const isCurrent =
                                    opt.value === sale.order_status;
                                const isSelected = opt.value === status;

                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setStatus(opt.value)}
                                        disabled={isCurrent}
                                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5
                                            text-sm font-medium transition-all
                                            ${
                                                isCurrent
                                                    ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                                                    : isSelected
                                                      ? `${opt.classes} border-current ring-1 ring-inset ring-current`
                                                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        <span>{opt.label}</span>
                                        {isCurrent && (
                                            <span className="ml-1 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-500">
                                                current
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.order_status && (
                            <p className="mt-1.5 text-xs text-red-500">
                                {errors.order_status}
                            </p>
                        )}
                    </div>

                    {/* Warning for terminal statuses */}
                    {(status === "cancelled" || status === "returned") && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                            <AlertTriangle
                                size={15}
                                className="mt-0.5 shrink-0"
                            />
                            <span>
                                {status === "cancelled"
                                    ? "Cancelling this order will not automatically reverse stock. Use the void action for full reversal."
                                    : "Marking as returned will not automatically reverse stock. Handle stock adjustment separately."}
                            </span>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Reason / Note{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            placeholder="Enter reason for this status change..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                                       focus:border-indigo-500 focus:outline-none focus:ring-1
                                       focus:ring-indigo-500"
                        />
                        {errors.note && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.note}
                            </p>
                        )}
                    </div>

                    {/* Preview */}
                    {hasChanged && selectedOption && (
                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                            Status will change to{" "}
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${selectedOption.classes}`}
                            >
                                {selectedOption.label}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm
                                   text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !hasChanged}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold
                                   text-white hover:bg-indigo-700 disabled:cursor-not-allowed
                                   disabled:opacity-50"
                    >
                        {submitting ? "Updating..." : "Update Status"}
                    </button>
                </div>
            </div>
        </div>
    );
}
