import {
    AppliesToType,
    Partner,
    PartnerSettlementConfig,
    SettlementConfigFormData,
} from "@/types/partner";
import { router } from "@inertiajs/react";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
    partner: Partner;
    config: PartnerSettlementConfig;
    onClose: () => void;
}

const SETTLEMENT_TYPE_OPTIONS = [
    {
        value: "profit_only",
        label: "Profit Only",
        description: "Partner receives profit share only",
    },
    {
        value: "cost_plus_profit",
        label: "Cost + Profit",
        description:
            "Partner receives cost return plus profit share (product partners)",
    },
    {
        value: "custom",
        label: "Custom",
        description: "Custom settlement arrangement",
    },
] as const;

const PAYMENT_PREFERENCE_OPTIONS = [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "adjustment", label: "Adjustment" },
    { value: "reinvestment", label: "Reinvestment" },
] as const;

const APPLIES_TO_OPTIONS: {
    value: AppliesToType;
    label: string;
    description: string;
    requiresType: keyof Partner | null;
}[] = [
    {
        value: "all",
        label: "All Streams",
        description: "Applies to all income streams of this partner",
        requiresType: null,
    },
    {
        value: "capital",
        label: "Capital Stream",
        description: "Applies to capital investment profit only",
        requiresType: "partner_type_capital",
    },
    {
        value: "working",
        label: "Working Stream",
        description: "Applies to working/labour profit only",
        requiresType: "partner_type_working",
    },
    {
        value: "product",
        label: "Product Stream",
        description: "Applies to product sales profit only",
        requiresType: "partner_type_product",
    },
];

export default function EditSettlementConfigModal({
    partner,
    config,
    onClose,
}: Props) {
    const [form, setForm] = useState<SettlementConfigFormData>({
        settlement_type: "",
        payment_preference: "",
        auto_cost_return: false,
        notes: "",
        applies_to: "all",
    });
    const [processing, setProcessing] = useState(false);

    // Populate form from existing config
    useEffect(() => {
        setForm({
            settlement_type: config.settlement_type,
            payment_preference: config.payment_preference,
            auto_cost_return: config.auto_cost_return,
            notes: config.notes ?? "",
            applies_to: config.applies_to,
        });
    }, [config]);

    // Only show applies_to options that match partner's active type flags
    const availableAppliesToOptions = useMemo(() => {
        return APPLIES_TO_OPTIONS.filter((opt) => {
            if (opt.requiresType === null) return true;
            return partner[opt.requiresType] === true;
        });
    }, [partner]);

    const handleSubmit = () => {
        if (!form.settlement_type) {
            toast.error("Please select a settlement type.");
            return;
        }
        if (!form.payment_preference) {
            toast.error("Please select a payment preference.");
            return;
        }

        setProcessing(true);

        router.put(
            route("backend.partners.settlement-configs.update", {
                partner: partner.id,
                config: config.id,
            }),
            {
                settlement_type: form.settlement_type,
                payment_preference: form.payment_preference,
                auto_cost_return: form.auto_cost_return,
                notes: form.notes,
                applies_to: form.applies_to,
            },
            {
                onSuccess: () => {
                    toast.success("Settlement config updated.");
                    onClose();
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(
                        typeof first === "string"
                            ? first
                            : "Failed to update config.",
                    );
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
                        Edit Settlement Config
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-5 p-5">
                    {/* Partner name context */}
                    <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        Editing settlement for{" "}
                        <span className="font-medium text-gray-800">
                            {partner.name}
                        </span>
                        {partner.code && (
                            <span className="ml-1 font-mono text-xs text-gray-400">
                                ({partner.code})
                            </span>
                        )}
                    </div>

                    {/* Applies To — only show when partner has multiple types */}
                    {availableAppliesToOptions.length > 1 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Applies To{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.applies_to}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        applies_to: e.target
                                            .value as AppliesToType,
                                    }))
                                }
                                className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                {availableAppliesToOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                {
                                    availableAppliesToOptions.find(
                                        (o) => o.value === form.applies_to,
                                    )?.description
                                }
                            </p>
                        </div>
                    )}

                    {/* Settlement Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Settlement Type{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {SETTLEMENT_TYPE_OPTIONS.map((opt) => (
                                <label
                                    key={opt.value}
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                                        form.settlement_type === opt.value
                                            ? "border-indigo-500 bg-indigo-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="settlement_type"
                                        value={opt.value}
                                        checked={
                                            form.settlement_type === opt.value
                                        }
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                settlement_type: e.target
                                                    .value as SettlementConfigFormData["settlement_type"],
                                                auto_cost_return:
                                                    e.target.value ===
                                                    "cost_plus_profit"
                                                        ? f.auto_cost_return
                                                        : false,
                                            }))
                                        }
                                        className="mt-0.5 accent-indigo-600"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            {opt.label}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {opt.description}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Payment Preference */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Payment Preference{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.payment_preference}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    payment_preference: e.target
                                        .value as SettlementConfigFormData["payment_preference"],
                                }))
                            }
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Select preference...</option>
                            {PAYMENT_PREFERENCE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Auto Cost Return — only for cost_plus_profit */}
                    {form.settlement_type === "cost_plus_profit" && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.auto_cost_return}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            auto_cost_return: e.target.checked,
                                        }))
                                    }
                                    className="mt-0.5 accent-indigo-600"
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        Auto Cost Return
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Automatically calculate cost return from
                                        assigned product sales. Applies to
                                        product partners only.
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Notes{" "}
                            <span className="text-xs font-normal text-gray-400">
                                (optional)
                            </span>
                        </label>
                        <textarea
                            value={form.notes}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    notes: e.target.value,
                                }))
                            }
                            rows={3}
                            maxLength={1000}
                            placeholder="Any notes about this settlement arrangement..."
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
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
                    <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing ? "Saving..." : "Update Config"}
                    </button>
                </div>
            </div>
        </div>
    );
}
