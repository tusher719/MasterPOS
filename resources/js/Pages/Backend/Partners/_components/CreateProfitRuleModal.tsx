import { PROFIT_SOURCE_LABELS, RULE_TYPE_LABELS } from "@/types/partner-colors";
import {
    Partner,
    ProfitRuleFormData,
    ProfitSource,
    RuleType,
} from "@/types/partner.d";
import { router } from "@inertiajs/react";
import { X } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
    partner: Partner;
    onClose: () => void;
}

interface AvailableSource {
    source: ProfitSource;
    isEnabled: boolean;
}

type InputEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
type FormErrors = Partial<Record<keyof ProfitRuleFormData, string>>;
type FormPayload = Record<string, string>;

const EMPTY_FORM: ProfitRuleFormData = {
    rule_type: "",
    profit_source: "",
    share_percent: "",
    effective_from: "",
    reason: "",
};

const RULE_TYPES: RuleType[] = [
    "fixed_percent",
    "product_based",
    "capital_based",
    "mixed",
];

const ALL_PROFIT_SOURCES: ProfitSource[] = [
    "capital_share",
    "working_share",
    "product_share",
    "custom",
];

// Which partner_type_* flag is required for each profit_source
const SOURCE_TYPE_REQUIREMENT: Partial<Record<ProfitSource, keyof Partner>> = {
    capital_share: "partner_type_capital",
    working_share: "partner_type_working",
    product_share: "partner_type_product",
};

export default function CreateProfitRuleModal({ partner, onClose }: Props) {
    const [form, setForm] = useState<ProfitRuleFormData>(EMPTY_FORM);
    const [errors, setErrors] = useState<FormErrors>({});
    const [processing, setProcessing] = useState<boolean>(false);

    // Compute which profit_source options are available for this partner's types.
    // "custom" is always enabled.
    // Others require the corresponding partner_type_* flag to be true.
    const availableSources = useMemo<AvailableSource[]>(() => {
        return ALL_PROFIT_SOURCES.map((source) => {
            const requiredFlag: keyof Partner | undefined = SOURCE_TYPE_REQUIREMENT[source];
            const isEnabled = requiredFlag
                ? Boolean(partner[requiredFlag])
                : true; // custom — always enabled
            return { source, isEnabled };
        });
    }, [partner]);

    // Active partner types — shown as hint below the profit_source select
    const activeTypeLabels = useMemo<string[]>(() => {
        const labels: string[] = [];
        if (partner.partner_type_capital) labels.push("Capital");
        if (partner.partner_type_working) labels.push("Working");
        if (partner.partner_type_product) labels.push("Product");
        return labels;
    }, [partner]);

    const handleChange = (e: InputEvent): void => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof ProfitRuleFormData]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = (): void => {
        setProcessing(true);
        router.post(
            route("backend.partners.profit-rules.store", {
                partner: partner.id,
            }),
            form as unknown as FormPayload,
            {
                onSuccess: (): void => {
                    toast.success("Profit rule created. Awaiting approval.");
                    onClose();
                },
                onError: (errs: FormErrors): void => {
                    setErrors(errs);
                    toast.error("Please fix the errors below.");
                },
                onFinish: (): void => setProcessing(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            New Profit Rule
                        </h2>
                        <p className="text-xs text-gray-500">{partner.name}</p>
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
                    {/* Rule Type */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Rule Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="rule_type"
                            value={form.rule_type}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Select rule type</option>
                            {RULE_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {RULE_TYPE_LABELS[type]}
                                </option>
                            ))}
                        </select>
                        {errors.rule_type && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.rule_type}
                            </p>
                        )}
                    </div>

                    {/* Profit Source */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Profit Source{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="profit_source"
                            value={form.profit_source}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Select profit source</option>
                            {availableSources.map(({ source, isEnabled }) => (
                                <option
                                    key={source}
                                    value={source}
                                    disabled={!isEnabled}
                                    className={
                                        !isEnabled ? "text-gray-300" : undefined
                                    }
                                >
                                    {PROFIT_SOURCE_LABELS[source]}
                                    {!isEnabled ? " (not applicable)" : ""}
                                </option>
                            ))}
                        </select>

                        {/* Partner type hint */}
                        <p className="mt-1 text-xs text-gray-400">
                            {activeTypeLabels.length > 0
                                ? `This partner is: ${activeTypeLabels.join(", ")} type.`
                                : "No partner type set — only Custom source is available."}
                        </p>

                        {errors.profit_source && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.profit_source}
                            </p>
                        )}
                    </div>

                    {/* Share Percent */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Share Percent (%){" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="share_percent"
                            value={form.share_percent}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="e.g. 35.00"
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                            Manually configured — never derived from capital
                            amount.
                        </p>
                        {errors.share_percent && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.share_percent}
                            </p>
                        )}
                    </div>

                    {/* Effective From */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Effective From{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="effective_from"
                            value={form.effective_from}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.effective_from && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.effective_from}
                            </p>
                        )}
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Reason
                        </label>
                        <textarea
                            name="reason"
                            value={form.reason}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Why is this rule being created? (optional)"
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.reason && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.reason}
                            </p>
                        )}
                    </div>

                    {/* Info note */}
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                        <p className="text-xs text-amber-700">
                            This rule will be <strong>pending approval</strong>{" "}
                            until a Super Admin approves it. It will not affect
                            any profit calculations until approved.
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
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing ? "Creating..." : "Create Rule"}
                    </button>
                </div>
            </div>
        </div>
    );
}
