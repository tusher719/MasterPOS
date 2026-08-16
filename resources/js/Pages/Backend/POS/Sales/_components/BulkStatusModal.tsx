// resources/js/Pages/Backend/POS/Sales/_components/BulkStatusModal.tsx

import { router } from "@inertiajs/react";
import { CheckCircle, Truck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    selectedIds: number[];
    onClose: () => void;
    onSuccess: () => void;
}

type BulkStatus = "confirmed" | "out_for_delivery";

const STATUS_OPTIONS: {
    value: BulkStatus;
    label: string;
    description: string;
    icon: React.ReactNode;
    classes: string;
    selectedClasses: string;
}[] = [
    {
        value: "confirmed",
        label: "Confirmed",
        description: "Order has been reviewed and confirmed.",
        icon: <CheckCircle size={18} />,
        classes: "border-blue-200 text-blue-700",
        selectedClasses:
            "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500",
    },
    {
        value: "out_for_delivery",
        label: "Out for Delivery",
        description: "Order is dispatched and on the way.",
        icon: <Truck size={18} />,
        classes: "border-indigo-200 text-indigo-700",
        selectedClasses:
            "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500",
    },
];

export default function BulkStatusModal({
    selectedIds,
    onClose,
    onSuccess,
}: Props) {
    const [status, setStatus] = useState<BulkStatus | "">("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!status) {
            toast.error("Please select a status to apply.");
            return;
        }

        setSubmitting(true);

        router.post(
            route("backend.pos.sales.bulk-status-update"),
            { ids: selectedIds, status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    const label =
                        STATUS_OPTIONS.find((o) => o.value === status)?.label ??
                        status;
                    toast.success(
                        `${selectedIds.length} sale(s) marked as ${label}.`,
                    );
                    onSuccess();
                    onClose();
                },
                onError: (errs) => {
                    const first = Object.values(errs)[0];
                    toast.error(first ?? "Bulk update failed.");
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Bulk Status Update
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            {selectedIds.length} sale
                            {selectedIds.length > 1 ? "s" : ""} selected
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
                <div className="px-5 py-4">
                    <p className="mb-3 text-xs text-gray-500">
                        Select the new order status to apply to all selected
                        sales. Individual actions (cancel, return, deliver) must
                        be done per sale.
                    </p>

                    <div className="space-y-2">
                        {STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setStatus(opt.value)}
                                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3
                                            text-left transition-all
                                            ${status === opt.value ? opt.selectedClasses : "border-gray-200 hover:bg-gray-50"}`}
                            >
                                <span
                                    className={
                                        status === opt.value
                                            ? ""
                                            : "text-gray-400"
                                    }
                                >
                                    {opt.icon}
                                </span>
                                <div>
                                    <p className="text-sm font-medium">
                                        {opt.label}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {opt.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm
                                   text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !status}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold
                                   text-white hover:bg-indigo-700 disabled:opacity-50
                                   disabled:cursor-not-allowed"
                    >
                        {submitting ? "Updating..." : "Apply to Selected"}
                    </button>
                </div>
            </div>
        </div>
    );
}
