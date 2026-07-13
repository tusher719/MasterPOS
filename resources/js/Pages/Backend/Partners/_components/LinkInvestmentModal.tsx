import { InvestmentOption, Partner } from "@/types/partner";
import { router } from "@inertiajs/react";
import { X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface LinkInvestmentModalProps {
    partner: Partner;
    investmentOptions: InvestmentOption[];
    onClose: () => void;
}

interface LinkInvestmentFormData {
    investment_id: string;
    is_primary: boolean;
    note: string;
    [key: string]: string | boolean;
}

const defaultForm: LinkInvestmentFormData = {
    investment_id: "",
    is_primary: false,
    note: "",
};

export default function LinkInvestmentModal({
    partner,
    investmentOptions,
    onClose,
}: LinkInvestmentModalProps) {
    const [form, setForm] = useState<LinkInvestmentFormData>(defaultForm);
    const [errors, setErrors] = useState<
        Partial<Record<keyof LinkInvestmentFormData, string>>
    >({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const target = e.target as HTMLInputElement;
        const value =
            target.type === "checkbox" ? target.checked : target.value;
        setForm((prev) => ({ ...prev, [target.name]: value }));
        setErrors((prev) => ({ ...prev, [target.name]: undefined }));
    };

    const handleSubmit = () => {
        if (!form.investment_id) {
            setErrors({ investment_id: "Please select an investment." });
            return;
        }

        setProcessing(true);
        setErrors({});

        router.post(
            route("backend.partners.link-investment", { partner: partner.id }),
            form,
            {
                onSuccess: () => {
                    toast.success("Investment linked successfully.");
                    onClose();
                },
                onError: (errs) => {
                    setErrors(
                        errs as Partial<
                            Record<keyof LinkInvestmentFormData, string>
                        >,
                    );
                    toast.error("Failed to link investment.");
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    // Selected investment preview
    const selectedInvestment = investmentOptions.find(
        (inv) => String(inv.id) === form.investment_id,
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Link Investment
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-400">
                            Linking to:{" "}
                            <span className="font-medium text-gray-600">
                                {partner.name}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-5 py-4">
                    {/* No options available */}
                    {investmentOptions.length === 0 ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            No available investments to link. All active
                            investments are already linked to this partner, or
                            no active investments exist.
                        </div>
                    ) : (
                        <>
                            {/* Investment select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Select Investment{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="investment_id"
                                    value={form.investment_id}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">
                                        — Select an investment —
                                    </option>
                                    {investmentOptions.map((inv) => (
                                        <option
                                            key={inv.id}
                                            value={String(inv.id)}
                                        >
                                            {inv.title} — {inv.investor_name} (৳
                                            {Number(inv.amount).toLocaleString(
                                                "en-BD",
                                            )}
                                            )
                                        </option>
                                    ))}
                                </select>
                                {errors.investment_id && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.investment_id}
                                    </p>
                                )}
                            </div>

                            {/* Selected investment preview */}
                            {selectedInvestment && (
                                <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm">
                                    <p className="font-medium text-indigo-800">
                                        {selectedInvestment.title}
                                    </p>
                                    <p className="text-indigo-600">
                                        Investor:{" "}
                                        {selectedInvestment.investor_name}
                                    </p>
                                    <p className="text-indigo-600">
                                        Amount: ৳
                                        {Number(
                                            selectedInvestment.amount,
                                        ).toLocaleString("en-BD", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                            )}

                            {/* Is Primary */}
                            <div className="flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3">
                                <input
                                    type="checkbox"
                                    name="is_primary"
                                    id="link_is_primary"
                                    checked={form.is_primary}
                                    onChange={handleChange}
                                    className="mt-0.5 rounded border-gray-300 text-indigo-600"
                                />
                                <div>
                                    <label
                                        htmlFor="link_is_primary"
                                        className="text-sm font-medium text-gray-700 cursor-pointer"
                                    >
                                        Set as Primary Investment
                                    </label>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Marking as primary will unset any
                                        existing primary investment for this
                                        partner.
                                    </p>
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Note{" "}
                                    <span className="text-xs text-gray-400">
                                        (optional)
                                    </span>
                                </label>
                                <textarea
                                    name="note"
                                    value={form.note}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Any notes about this link..."
                                    className="mt-1 w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    {investmentOptions.length > 0 && (
                        <button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {processing ? "Linking..." : "Link Investment"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
