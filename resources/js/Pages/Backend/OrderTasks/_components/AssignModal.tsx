import { useState } from "react";
import { router } from "@inertiajs/react";
import { X, User } from "lucide-react";
import { toast } from "sonner";
import type {
    OrderTask,
    StaffOption,
    OrderTaskAssignmentType,
} from "@/types/order-task.d";

interface Props {
    task: OrderTask;
    staffList: StaffOption[];
    onClose: () => void;
}

export default function AssignModal({ task, staffList, onClose }: Props) {
    const [assignmentType, setAssignmentType] =
        useState<OrderTaskAssignmentType>(task.assignment_type);
    const [assignedTo, setAssignedTo] = useState<number | "">(
        task.assigned_to ?? "",
    );
    const [submitting, setSub] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = () => {
        if (assignmentType === "assigned" && !assignedTo) {
            setError("Please select a staff member.");
            return;
        }
        setSub(true);
        setError("");

        router.post(
            route("backend.order-tasks.assign", { orderTask: task.id }),
            { assignment_type: assignmentType, assigned_to: assignedTo },
            {
                onSuccess: () => {
                    toast.success("Task assigned.");
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
                        <User className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-sm font-semibold text-gray-800">
                            Assign Task
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
                        Task:{" "}
                        <span className="font-medium text-gray-700">
                            {task.title}
                        </span>
                    </p>

                    {/* Assignment type */}
                    <div className="flex gap-2">
                        {(
                            ["open", "assigned"] as OrderTaskAssignmentType[]
                        ).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => {
                                    setAssignmentType(t);
                                    if (t === "open") setAssignedTo("");
                                }}
                                className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                                    assignmentType === t
                                        ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-400"
                                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                }`}
                            >
                                {t === "open"
                                    ? "Open to all"
                                    : "Assign to staff"}
                            </button>
                        ))}
                    </div>

                    {/* Staff select */}
                    {assignmentType === "assigned" && (
                        <select
                            value={assignedTo}
                            onChange={(e) =>
                                setAssignedTo(Number(e.target.value))
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Select staff member</option>
                            {staffList.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    )}

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
                        disabled={submitting}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {submitting ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
