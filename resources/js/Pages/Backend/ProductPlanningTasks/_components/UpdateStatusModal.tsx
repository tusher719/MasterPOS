import type {
    ProductPlanningTask,
    TaskStatus,
} from "@/types/product-planning-task";
import {
    TASK_STATUS_COLORS,
    TASK_STATUS_LABELS,
    getNextTaskStatuses,
} from "@/types/product-planning-task-colors";
import { router } from "@inertiajs/react";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    task: ProductPlanningTask;
    onClose: () => void;
}

export default function UpdateStatusModal({ task, onClose }: Props) {
    const nextStatuses = getNextTaskStatuses(task.status as TaskStatus);
    const [selected, setSelected] = useState<TaskStatus | null>(null);
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const isCancelling = selected === "cancelled";

    function handleSubmit() {
        if (!selected) {
            toast.error("Please select a new status.");
            return;
        }

        setSubmitting(true);
        router.post(
            route("backend.product-planning-tasks.update-status", task.id),
            { status: selected, note },
            {
                preserveScroll: true,
                onSuccess: () => onClose(),
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    if (first) toast.error(first);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Update Task Status
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">
                            {task.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    {/* Current status */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Current status:</span>
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                TASK_STATUS_COLORS[task.status as TaskStatus]
                            }`}
                        >
                            {TASK_STATUS_LABELS[task.status as TaskStatus]}
                        </span>
                    </div>

                    {/* Terminal notice */}
                    {nextStatuses.length === 0 ? (
                        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
                            This task is in a terminal status and cannot be
                            updated further.
                        </div>
                    ) : (
                        <>
                            {/* Next status cards */}
                            <div>
                                <p className="mb-2 text-xs font-medium text-gray-700">
                                    Select new status
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {nextStatuses.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setSelected(s)}
                                            className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition ${
                                                selected === s
                                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {TASK_STATUS_LABELS[s]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cancellation warning */}
                            {isCancelling && (
                                <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-3 text-xs text-amber-700">
                                    <AlertTriangle
                                        size={14}
                                        className="mt-0.5 shrink-0"
                                    />
                                    <span>
                                        Cancelling this task is irreversible.
                                        The task will be marked as cancelled and
                                        no further status changes will be
                                        allowed.
                                    </span>
                                </div>
                            )}

                            {/* Optional note */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">
                                    Note{" "}
                                    <span className="text-gray-400">
                                        (optional)
                                    </span>
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={2}
                                    placeholder="Add a note about this status change…"
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Preview */}
                            {selected && (
                                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                    <span>New status:</span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                            TASK_STATUS_COLORS[selected]
                                        }`}
                                    >
                                        {TASK_STATUS_LABELS[selected]}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    {nextStatuses.length > 0 && (
                        <button
                            onClick={handleSubmit}
                            disabled={!selected || submitting}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {submitting ? "Updating…" : "Update Status"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
