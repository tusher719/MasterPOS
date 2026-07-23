import type {
    Partner,
    PartnerEligibility,
    PauseEligibilityFormData,
} from "@/types/partner.d";
import { router } from "@inertiajs/react";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    partner: Partner;
    eligibility: PartnerEligibility;
    onClose: () => void;
}

const defaultForm = (): PauseEligibilityFormData => ({
    pause_reason: "",
});

export default function PauseEligibilityModal({
    partner,
    eligibility,
    onClose,
}: Props) {
    const [form, setForm] = useState<PauseEligibilityFormData>(defaultForm());
    const [processing, setProcessing] = useState(false);

    const handleSubmit = () => {
        if (!form.pause_reason.trim() || form.pause_reason.trim().length < 5) {
            toast.error("Pause reason must be at least 5 characters.");
            return;
        }

        setProcessing(true);

        router.post(
            route("backend.partners.eligibilities.pause", {
                partner: partner.id,
                eligibility: eligibility.id,
            }),
            { pause_reason: form.pause_reason.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Profit eligibility paused.");
                    onClose();
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(first ?? "Failed to pause eligibility.");
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
                            Pause Profit Eligibility
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
                    {/* Warning box */}
                    <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                        <AlertTriangle
                            size={16}
                            className="mt-0.5 shrink-0 text-amber-600"
                        />
                        <div className="text-xs text-amber-700">
                            <p className="font-medium">
                                Pausing will stop profit generation
                            </p>
                            <p className="mt-1">
                                This partner will not be eligible for any profit
                                distributions that start after the pause.
                                Existing distributions are not affected. You can
                                resume eligibility at any time.
                            </p>
                        </div>
                    </div>

                    {/* Current eligibility info */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                        <p className="font-medium text-gray-700">
                            Current Eligibility Record
                        </p>
                        <div className="mt-1.5 flex gap-6">
                            <div>
                                <span className="text-gray-500">Start: </span>
                                <span className="font-medium">
                                    {eligibility.profit_start_date}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">End: </span>
                                <span className="font-medium">
                                    {eligibility.profit_end_date ?? "Ongoing"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Pause reason */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Pause Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={form.pause_reason}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    pause_reason: e.target.value,
                                }))
                            }
                            placeholder="Explain why profit eligibility is being paused..."
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Minimum 5 characters. This reason is stored
                            permanently in the eligibility record.
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
                        disabled={
                            processing || form.pause_reason.trim().length < 5
                        }
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                        {processing ? "Pausing..." : "Pause Eligibility"}
                    </button>
                </div>
            </div>
        </div>
    );
}
