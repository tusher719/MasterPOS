import type {
    DistributionItem,
    RecordPaymentFormData,
} from "@/types/profit-distribution";
import { Clock, DollarSign, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    item: DistributionItem;
    distributionId: number;
    onClose: () => void;
    onSuccess: () => void;
}

type Action = "pay" | "defer" | "reinvest";

const ACTION_CONFIG = {
    pay: {
        label: "Record Payment",
        icon: DollarSign,
        color: "bg-green-600 hover:bg-green-700",
        description: "Record a full or partial cash payment to this investor.",
    },
    defer: {
        label: "Defer to Next Period",
        icon: Clock,
        color: "bg-purple-600 hover:bg-purple-700",
        description:
            "Carry forward the remaining amount to the next distribution period.",
    },
    reinvest: {
        label: "Reinvest in Capital",
        icon: TrendingUp,
        color: "bg-indigo-600 hover:bg-indigo-700",
        description:
            "Convert the remaining amount into additional invested capital.",
    },
} as const;

export default function ExtendedPaymentModal({
    item,
    distributionId,
    onClose,
    onSuccess,
}: Props) {
    const [action, setAction] = useState<Action>("pay");
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState<RecordPaymentFormData>({
        action: "pay",
        amount: item.remaining_amount.toFixed(2),
        payment_method: "",
        transaction_reference: "",
        note: "",
    });
    const [errors, setErrors] = useState<
        Partial<Record<keyof RecordPaymentFormData, string>>
    >({});

    function selectAction(a: Action) {
        setAction(a);
        setForm((f) => ({ ...f, action: a }));
        setErrors({});
    }

    function validate(): boolean {
        const newErrors: typeof errors = {};

        if (action === "pay") {
            const amt = parseFloat(form.amount);
            if (!form.amount || isNaN(amt) || amt <= 0) {
                newErrors.amount = "Please enter a valid amount.";
            } else if (amt > item.remaining_amount) {
                newErrors.amount = `Amount cannot exceed remaining amount (${item.remaining_amount.toFixed(2)}).`;
            }
            if (!form.payment_method.trim()) {
                newErrors.payment_method = "Payment method is required.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;

        setProcessing(true);

        try {
            const payload: Record<string, string | number | null> = {
                action,
                note: form.note || null,
            };

            if (action === "pay") {
                payload.amount = parseFloat(form.amount);
                payload.payment_method = form.payment_method;
                payload.transaction_reference =
                    form.transaction_reference || null;
            }

            const response = await fetch(
                route("backend.profit-distributions.items.payments.store", {
                    pd: distributionId,
                    item: item.id,
                }),
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRF-TOKEN":
                            (
                                document.querySelector(
                                    'meta[name="csrf-token"]',
                                ) as HTMLMetaElement
                            )?.content ?? "",
                    },
                    body: JSON.stringify(payload),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message ?? "Failed to record payment.");
                return;
            }

            toast.success(data.message ?? "Payment recorded successfully.");
            onSuccess();
            onClose();
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setProcessing(false);
        }
    }

    const config = ACTION_CONFIG[action];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h3 className="text-base font-semibold text-gray-800">
                            Record Payment Action
                        </h3>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {item.investor_name}
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
                <div className="space-y-5 px-5 py-4">
                    {/* Amount Summary */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                            <p className="text-xs text-gray-500">
                                Effective Amount
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-gray-800">
                                ৳{item.effective_amount.toFixed(2)}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                            <p className="text-xs text-gray-500">
                                Already Paid
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-green-600">
                                ৳{item.total_paid.toFixed(2)}
                            </p>
                        </div>
                        <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-center">
                            <p className="text-xs text-amber-600">Remaining</p>
                            <p className="mt-0.5 text-sm font-semibold text-amber-700">
                                ৳{item.remaining_amount.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Action Selector */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Select Action
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(
                                Object.entries(ACTION_CONFIG) as [
                                    Action,
                                    (typeof ACTION_CONFIG)[Action],
                                ][]
                            ).map(([key, cfg]) => {
                                const Ic = cfg.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => selectAction(key)}
                                        className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-xs font-medium transition ${
                                            action === key
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <Ic size={16} />
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                            {config.description}
                        </p>
                    </div>

                    {/* Pay Fields */}
                    {action === "pay" && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Amount */}
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700">
                                        Amount{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        max={item.remaining_amount}
                                        value={form.amount}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                amount: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.amount && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.amount}
                                        </p>
                                    )}
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700">
                                        Payment Method{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={form.payment_method}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                payment_method: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Select method</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">
                                            Bank Transfer
                                        </option>
                                        <option value="Mobile Banking">
                                            Mobile Banking
                                        </option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {errors.payment_method && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.payment_method}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Transaction Reference */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">
                                    Transaction Reference
                                </label>
                                <input
                                    type="text"
                                    value={form.transaction_reference}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            transaction_reference:
                                                e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. TXN-20250701-001"
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Note — always visible */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Note
                        </label>
                        <textarea
                            rows={2}
                            value={form.note}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, note: e.target.value }))
                            }
                            placeholder="Optional note..."
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${config.color}`}
                    >
                        <Icon size={14} />
                        {processing ? "Processing..." : config.label}
                    </button>
                </div>
            </div>
        </div>
    );
}
