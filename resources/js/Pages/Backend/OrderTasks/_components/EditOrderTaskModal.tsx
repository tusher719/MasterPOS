import { AppDateInput } from "@/Components/DatePicker";
import type {
    OrderTask,
    OrderTaskPriority,
    OrderTaskSource,
} from "@/types/order-task.d";
import { router } from "@inertiajs/react";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    task: OrderTask;
    onClose: () => void;
}

export default function EditOrderTaskModal({ task, onClose }: Props) {
    const [form, setForm] = useState({
        title: task.title,
        customer_name_snapshot: task.customer_name_snapshot,
        customer_phone_snapshot: task.customer_phone_snapshot ?? "",
        source: task.source,
        priority: task.priority,
        due_date: task.due_date ?? "",
        note: task.note ?? "",
    });
    const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
    const [submitting, setSub] = useState(false);

    const set = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = () => {
        setSub(true);
        setErrors({});

        router.put(
            route("backend.order-tasks.update", { orderTask: task.id }),
            form as unknown as Record<string, string>,
            {
                onSuccess: () => {
                    toast.success("Task updated.");
                    onClose();
                },
                onError: (errs) => {
                    setErrors(errs);
                    toast.error("Please fix the errors below.");
                },
                onFinish: () => setSub(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-sm font-semibold text-gray-800">
                        Edit Task
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4 px-5 py-4 max-h-[70vh] overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.title && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    {/* Customer */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                Customer Name{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.customer_name_snapshot}
                                onChange={(e) =>
                                    set(
                                        "customer_name_snapshot",
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                Phone
                            </label>
                            <input
                                type="text"
                                value={form.customer_phone_snapshot}
                                onChange={(e) =>
                                    set(
                                        "customer_phone_snapshot",
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Source + Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                Source <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.source}
                                onChange={(e) =>
                                    set(
                                        "source",
                                        e.target.value as OrderTaskSource,
                                    )
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="facebook">Facebook</option>
                                <option value="instagram">Instagram</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="phone">Phone</option>
                                <option value="website">Website</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                Priority
                            </label>
                            <div className="flex gap-1">
                                {(
                                    [
                                        "urgent",
                                        "normal",
                                        "flexible",
                                    ] as OrderTaskPriority[]
                                ).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => set("priority", p)}
                                        className={`flex-1 rounded-md py-2 text-xs font-medium capitalize transition-colors ${
                                            form.priority === p
                                                ? p === "urgent"
                                                    ? "bg-red-100 text-red-700 ring-1 ring-red-400"
                                                    : p === "normal"
                                                      ? "bg-blue-100 text-blue-700 ring-1 ring-blue-400"
                                                      : "bg-gray-100 text-gray-600 ring-1 ring-gray-400"
                                                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Due date */}
                    <AppDateInput
                        label="Due Date"
                        value={form.due_date}
                        onChange={(val) => set("due_date", val)}
                        clearable
                    />

                    {/* Note */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Note
                        </label>
                        <textarea
                            value={form.note}
                            onChange={(e) => set("note", e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
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
                        {submitting ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
