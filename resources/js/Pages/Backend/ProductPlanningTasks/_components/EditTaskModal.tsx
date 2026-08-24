import { AppDateInput } from "@/Components/DatePicker";
import type {
    ProductOption,
    ProductPlanningTask,
    TaskItemFormData,
} from "@/types/product-planning-task";
import { TASK_ITEM_STATUS_OPTIONS } from "@/types/product-planning-task-colors";
import { router } from "@inertiajs/react";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
    task: ProductPlanningTask;
    products: ProductOption[];
    staffOptions: { id: number; name: string }[];
    onClose: () => void;
}

export default function EditTaskModal({
    task,
    products,
    staffOptions,
    onClose,
}: Props) {
    const [title, setTitle] = useState("");
    const [note, setNote] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [assignedTo, setAssignedTo] = useState<number | "">("");
    const [items, setItems] = useState<TaskItemFormData[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // ─── Populate form from task prop ─────────────────────────────────────────

    useEffect(() => {
        setTitle(task.title);
        setNote(task.note ?? "");
        // Slice to [0,10] — date fields may carry full ISO timestamp (Rule 6)
        setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
        setAssignedTo(task.assigned_to ?? "");
        setItems(
            task.items.map((item) => ({
                id: item.id,
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                unit_cost: item.unit_cost ?? "",
                note: item.note ?? "",
                status: item.status,
            })),
        );
    }, [task]);

    // ─── Item helpers ─────────────────────────────────────────────────────────

    function addItem() {
        setItems((prev) => [
            ...prev,
            {
                product_id: "",
                variant_id: null,
                quantity: "1",
                unit_cost: "",
                note: "",
                status: "pending",
            },
        ]);
    }

    function removeItem(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    function updateItem(
        index: number,
        field: keyof TaskItemFormData,
        value: unknown,
    ) {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;
                const updated = { ...item, [field]: value };
                // Reset variant when product changes
                if (field === "product_id") {
                    updated.variant_id = null;
                    const product = products.find(
                        (p) => p.id === Number(value),
                    );
                    if (product) updated.unit_cost = product.cost_price;
                }
                // Auto-fill unit_cost from variant override
                if (field === "variant_id" && value) {
                    const product = products.find(
                        (p) => p.id === Number(item.product_id),
                    );
                    const variant = product?.active_variants.find(
                        (v) => v.id === Number(value),
                    );
                    if (variant?.cost_price_override) {
                        updated.unit_cost = variant.cost_price_override;
                    }
                }
                return updated;
            }),
        );
    }

    // ─── Totals ───────────────────────────────────────────────────────────────

    function itemSubtotal(item: TaskItemFormData): number {
        const qty = Number(item.quantity) || 0;
        const cost = Number(item.unit_cost) || 0;
        return qty * cost;
    }

    const grandTotal = items.reduce((sum, item) => sum + itemSubtotal(item), 0);

    // ─── Submit ───────────────────────────────────────────────────────────────

    function handleSubmit() {
        if (!title.trim()) {
            toast.error("Task title is required.");
            return;
        }
        if (items.length === 0) {
            toast.error("At least one product item is required.");
            return;
        }
        for (const item of items) {
            if (!item.product_id) {
                toast.error("Please select a product for each item.");
                return;
            }
        }

        setSubmitting(true);
        router.put(
            route("backend.product-planning-tasks.update", task.id),
            {
                title,
                note,
                due_date: dueDate,
                assigned_to: assignedTo,
                items: items.map((item) => ({
                    id: item.id ?? undefined,
                    product_id: Number(item.product_id),
                    variant_id: item.variant_id
                        ? Number(item.variant_id)
                        : null,
                    quantity: item.quantity,
                    unit_cost: item.unit_cost !== "" ? item.unit_cost : null,
                    note: item.note,
                    status: item.status,
                })),
            },
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

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Edit Planning Task
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-400">
                            #{task.id} — {task.title}
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
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Note
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Due date + Assigned to */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                Due Date
                            </label>
                            <AppDateInput
                                value={dueDate}
                                onChange={setDueDate}
                                clearable
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                Assign To
                            </label>
                            <select
                                value={assignedTo}
                                onChange={(e) =>
                                    setAssignedTo(
                                        e.target.value
                                            ? Number(e.target.value)
                                            : "",
                                    )
                                }
                                className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Unassigned</option>
                                {staffOptions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-700">
                                Product Items{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <button
                                onClick={addItem}
                                className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                            >
                                <Plus size={13} />
                                Add Item
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-md border border-gray-200">
                            <table className="min-w-full text-xs">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                                            Product
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                                            Variant
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500 w-20">
                                            Qty
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500 w-24">
                                            Unit Cost
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500 w-24">
                                            Subtotal
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500 w-20">
                                            Status
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                                            Note
                                        </th>
                                        <th className="px-3 py-2 w-8" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((item, index) => {
                                        const selectedProduct = products.find(
                                            (p) =>
                                                p.id ===
                                                Number(item.product_id),
                                        );
                                        const subtotal = itemSubtotal(item);

                                        return (
                                            <tr key={index}>
                                                {/* Product */}
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={item.product_id}
                                                        onChange={(e) =>
                                                            updateItem(
                                                                index,
                                                                "product_id",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded border-gray-300 text-xs focus:border-indigo-500 focus:ring-indigo-500"
                                                    >
                                                        <option value="">
                                                            Select product
                                                        </option>
                                                        {products.map((p) => (
                                                            <option
                                                                key={p.id}
                                                                value={p.id}
                                                            >
                                                                {p.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Variant */}
                                                <td className="px-3 py-2">
                                                    {selectedProduct?.has_variants ? (
                                                        <select
                                                            value={
                                                                item.variant_id ??
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    "variant_id",
                                                                    e.target
                                                                        .value
                                                                        ? Number(
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                          )
                                                                        : null,
                                                                )
                                                            }
                                                            className="w-full rounded border-gray-300 text-xs focus:border-indigo-500 focus:ring-indigo-500"
                                                        >
                                                            <option value="">
                                                                Any variant
                                                            </option>
                                                            {selectedProduct.active_variants.map(
                                                                (v) => (
                                                                    <option
                                                                        key={
                                                                            v.id
                                                                        }
                                                                        value={
                                                                            v.id
                                                                        }
                                                                    >
                                                                        {Object.values(
                                                                            v.attributes,
                                                                        ).join(
                                                                            " / ",
                                                                        )}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    ) : (
                                                        <span className="text-gray-300">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Quantity */}
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateItem(
                                                                index,
                                                                "quantity",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded border-gray-300 text-xs focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                </td>

                                                {/* Unit cost */}
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_cost}
                                                        onChange={(e) =>
                                                            updateItem(
                                                                index,
                                                                "unit_cost",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        className="w-full rounded border-gray-300 text-xs focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                </td>

                                                {/* Subtotal */}
                                                <td className="px-3 py-2 font-medium text-gray-700">
                                                    {subtotal > 0
                                                        ? `৳${subtotal.toFixed(2)}`
                                                        : "—"}
                                                </td>

                                                {/* Item status */}
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={item.status}
                                                        onChange={(e) =>
                                                            updateItem(
                                                                index,
                                                                "status",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded border-gray-300 text-xs focus:border-indigo-500 focus:ring-indigo-500"
                                                    >
                                                        {TASK_ITEM_STATUS_OPTIONS.map(
                                                            (opt) => (
                                                                <option
                                                                    key={
                                                                        opt.value
                                                                    }
                                                                    value={
                                                                        opt.value
                                                                    }
                                                                >
                                                                    {opt.label}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </td>

                                                {/* Note */}
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={item.note}
                                                        onChange={(e) =>
                                                            updateItem(
                                                                index,
                                                                "note",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Optional…"
                                                        className="w-full rounded border-gray-300 text-xs focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                </td>

                                                {/* Remove */}
                                                <td className="px-3 py-2">
                                                    {items.length > 1 && (
                                                        <button
                                                            onClick={() =>
                                                                removeItem(
                                                                    index,
                                                                )
                                                            }
                                                            className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-400"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Grand total */}
                        {grandTotal > 0 && (
                            <div className="mt-2 flex justify-end">
                                <span className="text-xs font-medium text-gray-500">
                                    Grand Total:{" "}
                                    <span className="text-base font-bold text-gray-800">
                                        ৳{grandTotal.toFixed(2)}
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {submitting ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
