import { useState } from "react";
import { router } from "@inertiajs/react";
import { X, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import type { OrderTask } from "@/types/order-task.d";

interface Props {
    task: OrderTask;
    onClose: () => void;
}

export default function ConvertToSaleModal({ task, onClose }: Props) {
    const [saleRef, setSaleRef] = useState("");
    const [saleId, setSaleId] = useState<number | "">("");
    const [submitting, setSub] = useState(false);
    const [error, setError] = useState("");

    // Admin manually types the sale reference number and we resolve the ID
    // Full sale search can be added in Sprint 5 — for now a plain ID input works
    const handleSubmit = () => {
        if (!saleId) {
            setError("Please enter a valid Sale ID.");
            return;
        }
        setSub(true);
        setError("");

        router.post(
            route("backend.order-tasks.convert-to-sale", {
                orderTask: task.id,
            }),
            { linked_sale_id: saleId },
            {
                onSuccess: () => {
                    toast.success("Task marked as converted to sale.");
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
                        <ArrowRightLeft className="h-4 w-4 text-green-600" />
                        <h3 className="text-sm font-semibold text-gray-800">
                            Convert to Sale
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

                    <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-xs text-green-700">
                        Enter the Sale ID after creating the sale in POS. This
                        links the task to the completed sale.
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Sale ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={saleId}
                            onChange={(e) =>
                                setSaleId(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : "",
                                )
                            }
                            placeholder="Enter sale ID (numeric)"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                            Find the sale ID from Sales History page.
                        </p>
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
                        disabled={submitting || !saleId}
                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {submitting ? "Converting…" : "Mark as Converted"}
                    </button>
                </div>
            </div>
        </div>
    );
}
