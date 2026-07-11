import type { DistributionEligibility } from "@/types/profit-distribution";
import { router } from "@inertiajs/react";
import { AlertTriangle, CheckCircle, UserCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    distributionId: number;
    eligibilities: DistributionEligibility[];
    isLocked: boolean;
    canOverride: boolean;
}

interface OverrideModalState {
    open: boolean;
    eligibility: DistributionEligibility | null;
}

export default function EligibilityPanel({
    distributionId,
    eligibilities,
    isLocked,
    canOverride,
}: Props) {
    const [overrideModal, setOverrideModal] = useState<OverrideModalState>({
        open: false,
        eligibility: null,
    });
    const [form, setForm] = useState({
        is_eligible: true,
        eligibility_reason: "",
    });
    const [processing, setProcessing] = useState(false);

    const eligible = eligibilities.filter((e) => e.is_eligible);
    const ineligible = eligibilities.filter((e) => !e.is_eligible);

    function openOverride(eligibility: DistributionEligibility) {
        setForm({
            is_eligible: eligibility.is_eligible,
            eligibility_reason: eligibility.eligibility_reason ?? "",
        });
        setOverrideModal({ open: true, eligibility });
    }

    function closeOverride() {
        setOverrideModal({ open: false, eligibility: null });
        setForm({ is_eligible: true, eligibility_reason: "" });
    }

    function handleOverride() {
        if (!overrideModal.eligibility) return;

        if (!form.eligibility_reason.trim()) {
            toast.error("Please provide a reason for the override.");
            return;
        }

        setProcessing(true);

        router.post(
            route("backend.profit-distributions.eligibilities.override", {
                pd: distributionId,
                eligibility: overrideModal.eligibility.id,
            }),
            {
                is_eligible: form.is_eligible,
                eligibility_reason: form.eligibility_reason,
            },
            {
                onSuccess: () => {
                    toast.success("Eligibility updated successfully.");
                    closeOverride();
                },
                onError: (errors) => {
                    toast.error(
                        (Object.values(errors)[0] as string) ??
                            "Failed to update eligibility.",
                    );
                },
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <h3 className="text-sm font-medium text-gray-700">
                    Investor Eligibility
                </h3>
                <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={13} />
                        {eligible.length} Eligible
                    </span>
                    <span className="flex items-center gap-1 text-red-500">
                        <XCircle size={13} />
                        {ineligible.length} Ineligible
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="divide-y divide-gray-50">
                {eligibilities.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                        <AlertTriangle size={28} />
                        <p className="text-sm">No eligibility records found.</p>
                    </div>
                )}

                {eligibilities.map((e) => (
                    <div
                        key={e.id}
                        className="flex items-center justify-between px-5 py-3"
                    >
                        <div className="flex items-center gap-3">
                            {e.is_eligible ? (
                                <CheckCircle
                                    size={16}
                                    className="text-green-500 shrink-0"
                                />
                            ) : (
                                <XCircle
                                    size={16}
                                    className="text-red-400 shrink-0"
                                />
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-800">
                                    {e.investor_name}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {e.eligibility_reason ?? "—"}
                                    {e.is_manual_override && (
                                        <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                            <UserCheck size={10} />
                                            Manual Override
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {canOverride && !isLocked && (
                            <button
                                onClick={() => openOverride(e)}
                                className="rounded-md px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                            >
                                Override
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Override Modal */}
            {overrideModal.open && overrideModal.eligibility && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                        {/* Modal Header */}
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h3 className="text-base font-semibold text-gray-800">
                                Override Eligibility
                            </h3>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {overrideModal.eligibility.investor_name}
                            </p>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-4 px-5 py-4">
                            {/* Eligible Toggle */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Eligibility Status
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                is_eligible: true,
                                            }))
                                        }
                                        className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition ${
                                            form.is_eligible
                                                ? "border-green-500 bg-green-50 text-green-700"
                                                : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        <CheckCircle size={14} />
                                        Eligible
                                    </button>
                                    <button
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                is_eligible: false,
                                            }))
                                        }
                                        className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition ${
                                            !form.is_eligible
                                                ? "border-red-400 bg-red-50 text-red-600"
                                                : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        <XCircle size={14} />
                                        Ineligible
                                    </button>
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Reason{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.eligibility_reason}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            eligibility_reason: e.target.value,
                                        }))
                                    }
                                    placeholder="Provide a reason for this override..."
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                            <button
                                onClick={closeOverride}
                                disabled={processing}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleOverride}
                                disabled={processing}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {processing ? "Saving..." : "Save Override"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
