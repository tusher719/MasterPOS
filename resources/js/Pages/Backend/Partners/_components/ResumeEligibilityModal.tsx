import type {
    Partner,
    PartnerEligibility,
    ResumeEligibilityFormData,
} from "@/types/partner.d";
import { router } from "@inertiajs/react";
import { Info, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    partner: Partner;
    eligibility: PartnerEligibility;
    onClose: () => void;
}

const defaultForm = (): ResumeEligibilityFormData => ({
    resume_date: new Date().toISOString().slice(0, 10),
    profit_end_date: "",
});

export default function ResumeEligibilityModal({
    partner,
    eligibility,
    onClose,
}: Props) {
    const [form, setForm] = useState<ResumeEligibilityFormData>(defaultForm());
    const [processing, setProcessing] = useState(false);

    const handleSubmit = () => {
        if (!form.resume_date) {
            toast.error("Resume date is required.");
            return;
        }

        setProcessing(true);

        router.post(
            route("partners.eligibilities.resume", {
                partner: partner.id,
                eligibility: eligibility.id,
            }),
            {
                resume_date: form.resume_date,
                profit_end_date: form.profit_end_date || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        "Profit eligibility resumed. A new active record has been created.",
                    );
                    onClose();
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(first ?? "Failed to resume eligibility.");
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
                            Resume Profit Eligibility
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
                    {/* Info box */}
                    <div className="flex gap-3 rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
                        <Info
                            size={16}
                            className="mt-0.5 shrink-0 text-blue-600"
                        />
                        <div className="text-xs text-blue-700">
                            <p className="font-medium">
                                A new eligibility record will be created
                            </p>
                            <p className="mt-1">
                                Resuming does not modify the paused record. A
                                brand new active eligibility record will be
                                created starting from the resume date. The
                                previous paused record is kept for audit
                                history.
                            </p>
                        </div>
                    </div>

                    {/* Paused record info */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                        <p className="font-medium text-gray-700">
                            Paused Record
                        </p>
                        <div className="mt-1.5 space-y-1">
                            <div className="flex gap-6">
                                <div>
                                    <span className="text-gray-500">
                                        Start:{" "}
                                    </span>
                                    <span className="font-medium">
                                        {eligibility.profit_start_date}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">End: </span>
                                    <span className="font-medium">
                                        {eligibility.profit_end_date ??
                                            "Ongoing"}
                                    </span>
                                </div>
                            </div>
                            {eligibility.pause_reason && (
                                <div>
                                    <span className="text-gray-500">
                                        Pause reason:{" "}
                                    </span>
                                    <span className="font-medium">
                                        {eligibility.pause_reason}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resume date */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Resume Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={form.resume_date}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    resume_date: e.target.value,
                                    // Reset end date if it's before new resume date
                                    profit_end_date:
                                        f.profit_end_date &&
                                        f.profit_end_date <= e.target.value
                                            ? ""
                                            : f.profit_end_date,
                                }))
                            }
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            The new eligibility record will start from this
                            date.
                        </p>
                    </div>

                    {/* New end date (optional) */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            New End Date{" "}
                            <span className="text-gray-400 text-xs font-normal">
                                (optional)
                            </span>
                        </label>
                        <input
                            type="date"
                            value={form.profit_end_date}
                            min={form.resume_date || undefined}
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
                        disabled={processing || !form.resume_date}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing ? "Resuming..." : "Resume Eligibility"}
                    </button>
                </div>
            </div>
        </div>
    );
}
