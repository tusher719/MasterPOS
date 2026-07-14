import type { EligibilityFormData, Partner } from "@/types/partner.d";
import { router } from "@inertiajs/react";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    partner: Partner;
    onClose: () => void;
}

const defaultForm = (): EligibilityFormData => ({
    profit_start_date: "",
    profit_end_date: "",
});

export default function CreateEligibilityModal({ partner, onClose }: Props) {
    const [form, setForm] = useState<EligibilityFormData>(defaultForm());
    const [processing, setProcessing] = useState(false);

    const handleSubmit = () => {
        if (!form.profit_start_date) {
            toast.error("Profit start date is required.");
            return;
        }

        setProcessing(true);

        router.post(
            route("backend.partners.eligibilities.store", {
                partner: partner.id,
            }),
            {
                profit_start_date: form.profit_start_date,
                profit_end_date: form.profit_end_date || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Profit eligibility created successfully.");
                    onClose();
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(first ?? "Failed to create eligibility.");
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
                    <div>
                        <h3 className="text-base font-semibold text-gray-800">
                            Create Profit Eligibility
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-500">
                            {partner.name} · {partner.code}
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
                    {/* Profit Start Date */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Profit Start Date{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={form.profit_start_date}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    profit_start_date: e.target.value,
                                }))
                            }
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            From when this partner starts earning profit.
                        </p>
                    </div>

                    {/* Profit End Date */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Profit End Date{" "}
                            <span className="text-gray-400 text-xs font-normal">
                                (optional)
                            </span>
                        </label>
                        <input
                            type="date"
                            value={form.profit_end_date}
                            min={form.profit_start_date || undefined}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    profit_end_date: e.target.value,
                                }))
                            }
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Leave empty for an ongoing eligibility with no end
                            date.
                        </p>
                    </div>

                    {/* Info box */}
                    <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                        <p className="font-medium">Important</p>
                        <p className="mt-1">
                            This partner can only receive profit for
                            distribution periods that fall entirely within these
                            dates. Only one active eligibility record is allowed
                            at a time.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={processing || !form.profit_start_date}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing ? "Creating..." : "Create Eligibility"}
                    </button>
                </div>
            </div>
        </div>
    );
}
