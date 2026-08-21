import { AppDateInput } from "@/Components/DatePicker";
import type {
    CreateOrderTaskFormData,
    OrderTaskAssignmentType,
    OrderTaskPriority,
    OrderTaskSource,
    StaffOption,
} from "@/types/order-task.d";
import { router } from "@inertiajs/react";
import { ClipboardList, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    staffList: StaffOption[];
    canAssign: boolean;
    onClose: () => void;
}

const EMPTY_FORM: CreateOrderTaskFormData = {
    title: "",
    customer_name_snapshot: "",
    customer_phone_snapshot: "",
    source: "",
    priority: "normal",
    due_date: "",
    note: "",
    assignment_type: "open",
    assigned_to: "",
};

export default function CreateOrderTaskModal({
    staffList,
    canAssign,
    onClose,
}: Props) {
    const [form, setForm] = useState<CreateOrderTaskFormData>(EMPTY_FORM);
    const [errors, setErrors] = useState<
        Partial<Record<keyof CreateOrderTaskFormData, string>>
    >({});
    const [submitting, setSub] = useState(false);

    const set = (
        field: keyof CreateOrderTaskFormData,
        value: string | number,
    ) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = () => {
        setSub(true);
        setErrors({});

        router.post(
            route("backend.order-tasks.store"),
            form as unknown as Record<string, string>,
            {
                onSuccess: () => {
                    toast.success("Task created successfully.");
                    onClose();
                },
                onError: (errs) => {
                    setErrors(
                        errs as Partial<
                            Record<keyof CreateOrderTaskFormData, string>
                        >,
                    );
                    toast.error("Please fix the errors below.");
                },
                onFinish: () => setSub(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-sm font-semibold text-gray-800">
                            New Order Task
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-5 py-4 max-h-[70vh] overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Task Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            placeholder="e.g. Confirm order for Rahim"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.title && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    {/* Customer name + phone */}
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
                                placeholder="Customer name"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.customer_name_snapshot && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.customer_name_snapshot}
                                </p>
                            )}
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
                                placeholder="01XXXXXXXXX"
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
                                <option value="">Select source</option>
                                <option value="facebook">Facebook</option>
                                <option value="instagram">Instagram</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="phone">Phone</option>
                                <option value="website">Website</option>
                                <option value="other">Other</option>
                            </select>
                            {errors.source && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.source}
                                </p>
                            )}
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
                    <div>
                        <AppDateInput
                            label="Due Date"
                            value={form.due_date}
                            onChange={(val) => set("due_date", val)}
                            clearable
                        />
                    </div>

                    {/* Assignment type — only shown to users with assign permission */}
                    {canAssign && (
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                Assignment
                            </label>
                            <div className="flex gap-2">
                                {(
                                    [
                                        "open",
                                        "assigned",
                                    ] as OrderTaskAssignmentType[]
                                ).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => {
                                            set("assignment_type", t);
                                            if (t === "open")
                                                set("assigned_to", "");
                                        }}
                                        className={`flex-1 rounded-md py-2 text-xs font-medium capitalize transition-colors ${
                                            form.assignment_type === t
                                                ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-400"
                                                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                        }`}
                                    >
                                        {t === "open"
                                            ? "Open (anyone can claim)"
                                            : "Assign to staff"}
                                    </button>
                                ))}
                            </div>

                            {/* Staff select — only when assigned */}
                            {form.assignment_type === "assigned" && (
                                <select
                                    value={form.assigned_to}
                                    onChange={(e) =>
                                        set(
                                            "assigned_to",
                                            Number(e.target.value),
                                        )
                                    }
                                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">
                                        Select staff member
                                    </option>
                                    {staffList.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.assigned_to && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.assigned_to}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Note */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Note
                        </label>
                        <textarea
                            value={form.note}
                            onChange={(e) => set("note", e.target.value)}
                            rows={3}
                            placeholder="Any extra details…"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Footer */}
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
                        {submitting ? "Creating…" : "Create Task"}
                    </button>
                </div>
            </div>
        </div>
    );
}
