import type {
    ProductAssignmentFormData,
    ProductOption,
} from "@/types/partner.d";
import { router } from "@inertiajs/react";
import { DateInput } from "@mantine/dates";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    partnerId: number;
    products: ProductOption[];
    onClose: () => void;
}

const defaultForm = (): ProductAssignmentFormData => ({
    assignable_id: "",
    effective_from: "",
    effective_to: "",
    cost_return_enabled: true,
    profit_share_percent: "",
});

export default function CreateProductAssignmentModal({
    partnerId,
    products,
    onClose,
}: Props) {
    const [form, setForm] = useState<ProductAssignmentFormData>(defaultForm());
    const [processing, setProcessing] = useState(false);

    const handleSubmit = () => {
        if (!form.assignable_id) {
            toast.error("Please select a product.");
            return;
        }
        if (!form.effective_from) {
            toast.error("Effective from date is required.");
            return;
        }
        if (!form.profit_share_percent) {
            toast.error("Profit share percent is required.");
            return;
        }

        setProcessing(true);

        router.post(
            route("backend.partners.product-assignments.store", {
                partner: partnerId,
            }),
            {
                assignable_id: form.assignable_id,
                effective_from: form.effective_from,
                effective_to: form.effective_to || null,
                cost_return_enabled: form.cost_return_enabled,
                profit_share_percent: form.profit_share_percent,
            },
            {
                onSuccess: () => {
                    toast.success(
                        "Product assignment created. Awaiting approval.",
                    );
                    onClose();
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(first ?? "Failed to create assignment.");
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-gray-800">
                        Add Product Assignment
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-5 py-4">
                    {/* Product */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Product <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.assignable_id}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    assignable_id: e.target.value,
                                })
                            }
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">— Select product —</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Effective From */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Effective From{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <DateInput
                            placeholder="Select date"
                            value={
                                form.effective_from
                                    ? new Date(form.effective_from)
                                    : null
                            }
                            onChange={(date: Date | string | null) => {
                                const parsedDate =
                                    date instanceof Date
                                        ? date
                                        : date
                                          ? new Date(date)
                                          : null;

                                setForm({
                                    ...form,
                                    effective_from: parsedDate
                                        ? parsedDate.toISOString().slice(0, 10)
                                        : "",
                                });
                            }}
                            className="w-full text-sm"
                        />
                    </div>

                    {/* Effective To */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Effective To{" "}
                            <span className="text-xs text-gray-400">
                                (leave blank = ongoing)
                            </span>
                        </label>
                        <DateInput
                            placeholder="Select date (optional)"
                            value={
                                form.effective_to
                                    ? new Date(form.effective_to)
                                    : null
                            }
                            onChange={(date: Date | string | null) => {
                                const parsedDate =
                                    date instanceof Date
                                        ? date
                                        : date
                                          ? new Date(date)
                                          : null;

                                setForm({
                                    ...form,
                                    effective_to: parsedDate
                                        ? parsedDate.toISOString().slice(0, 10)
                                        : "",
                                });
                            }}
                            className="w-full text-sm"
                            minDate={
                                form.effective_from
                                    ? new Date(form.effective_from)
                                    : undefined
                            }
                        />
                    </div>

                    {/* Profit Share Percent */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Profit Share %{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.0001"
                            value={form.profit_share_percent}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    profit_share_percent: e.target.value,
                                })
                            }
                            placeholder="e.g. 65.00"
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                            Partner's share of product profit per sale.
                        </p>
                    </div>

                    {/* Cost Return Enabled */}
                    <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                        <input
                            type="checkbox"
                            id="cost_return_enabled"
                            checked={form.cost_return_enabled}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    cost_return_enabled: e.target.checked,
                                })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                        />
                        <div>
                            <label
                                htmlFor="cost_return_enabled"
                                className="text-sm font-medium text-gray-700"
                            >
                                Cost Return Enabled
                            </label>
                            <p className="text-xs text-gray-400">
                                Partner receives product cost price back per
                                sale.
                            </p>
                        </div>
                    </div>

                    {/* Info box */}
                    <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                        This assignment will be{" "}
                        <strong>pending approval</strong> until an admin
                        approves it. It will not affect profit calculations
                        until approved.
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
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing ? "Creating..." : "Create Assignment"}
                    </button>
                </div>
            </div>
        </div>
    );
}
