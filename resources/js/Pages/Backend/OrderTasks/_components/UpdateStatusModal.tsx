import { useState } from "react";
import { router } from "@inertiajs/react";
import { X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { OrderTask } from "@/types/order-task.d";

interface Props {
    task: OrderTask;
    onClose: () => void;
}

type AllowedStatus = "in_progress" | "ready" | "cancelled";

const STATUS_OPTIONS: {
    value: AllowedStatus;
    label: string;
    color: string;
    warn?: boolean;
}[] = [
    {
        value: "in_progress",
        label: "In Progress",
        color: "bg-amber-50 border-amber-300 text-amber-700",
    },
    {
        value: "ready",
        label: "Ready",
        color: "bg-green-50 border-green-300 text-green-700",
    },
    {
        value: "cancelled",
        label: "Cancelled",
        color: "bg-red-50 border-red-300 text-red-600",
        warn: true,
    },
];

export default function UpdateStatusModal({ task, onClose }: Props) {
    const [selected, setSelected] = useState<AllowedStatus | "">("");
    const [note, setNote] = useState("");
    const [submitting, setSub] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = () => {
        if (!selected) {
            setError("Please select a status.");
            return;
        }
        setSub(true);
        setError("");

        router.post(
            route("backend.order-tasks.update-status", { orderTask: task.id }),
            { status: selected, note },
            {
                onSuccess: () => {
                    toast.success("Status updated.");
                    onClose();
                },
                onError: (errs) => setError(Object.values(errs)[0] as string),
                onFinish: () => setSub(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-sm font-semibold text-gray-800">
                            Update Status
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4 px-5 py-4">
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2">
                        Current:{" "}
                        <span className="font-medium text-gray-700 capitalize">
                            {task.status.replace("_", " ")}
                        </span>
                    </p>

                    {/* Status cards */}
                    <div className="space-y-2">
                        {STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setSelected(opt.value)}
                                className={`w-full rounded-md border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                                    selected === opt.value
                                        ? opt.color
                                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                {opt.label}
                                {opt.warn && (
                                    <span className="ml-2 text-xs font-normal opacity-70">
                                        (stock not auto-reversed)
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Note */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Note (optional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            placeholder="Reason or details…"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !selected}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {submitting ? "Updating…" : "Update Status"}
                    </button>
                </div>
            </div>
        </div>
    );
}
