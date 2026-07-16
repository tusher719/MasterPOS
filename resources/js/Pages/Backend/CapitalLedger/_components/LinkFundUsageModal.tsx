import type {
    ExpenseOption,
    FundUsageFormData,
    PurchaseOption,
    UsableType,
} from "@/types/fund-usage";
import { router } from "@inertiajs/react";
import { Link2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
    entryId: number;
    remainingAmount: number;
    purchases: PurchaseOption[];
    expenses: ExpenseOption[];
    onClose: () => void;
}

const defaultForm: FundUsageFormData = {
    usable_type: "",
    usable_id: "",
    amount: "",
    note: "",
};

export default function LinkFundUsageModal({
    entryId,
    remainingAmount,
    purchases,
    expenses,
    onClose,
}: Props) {
    const [form, setForm] = useState<FundUsageFormData>(defaultForm);
    const [processing, setProcessing] = useState(false);

    // ─── Auto-fill amount from selected usable ────────────────────

    useEffect(() => {
        if (!form.usable_type || form.usable_id === "") {
            setForm((prev) => ({ ...prev, amount: "" }));
            return;
        }

        const id = Number(form.usable_id);

        if (form.usable_type === "purchase") {
            const found = purchases.find((p) => p.id === id);
            if (found) {
                const suggested = Math.min(found.grand_total, remainingAmount);
                setForm((prev) => ({ ...prev, amount: suggested.toFixed(2) }));
            }
        } else if (form.usable_type === "expense") {
            const found = expenses.find((e) => e.id === id);
            if (found) {
                const suggested = Math.min(found.amount, remainingAmount);
                setForm((prev) => ({ ...prev, amount: suggested.toFixed(2) }));
            }
        }
    }, [form.usable_type, form.usable_id]);

    // ─── Reset usable_id when type changes ────────────────────────

    const handleTypeChange = (type: UsableType) => {
        setForm((prev) => ({
            ...prev,
            usable_type: type,
            usable_id: "",
            amount: "",
        }));
    };

    // ─── Options based on selected type ───────────────────────────

    const options: { id: number; label: string }[] =
        form.usable_type === "purchase"
            ? purchases
            : form.usable_type === "expense"
              ? expenses
              : [];

    // ─── Submit ───────────────────────────────────────────────────

    const handleSubmit = () => {
        if (!form.usable_type || form.usable_id === "" || form.amount === "")
            return;

        const amount = Number(form.amount);
        if (amount <= 0 || amount > remainingAmount) return;

        setProcessing(true);

        router.post(
            route("backend.capital-ledger.fund-usages.store", {
                capitalLedgerEntry: entryId,
            }),
            {
                usable_type: form.usable_type,
                usable_id: Number(form.usable_id),
                amount: form.amount,
                note: form.note,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    onClose();
                },
                onError: () => {
                    setProcessing(false);
                },
            },
        );
    };

    // ─── Render ───────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-indigo-500" />
                        <h2 className="text-sm font-semibold text-gray-800">
                            Link Fund Usage
                        </h2>
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
                    {/* Remaining Amount Info */}
                    <div className="rounded-md bg-indigo-50 px-4 py-3">
                        <p className="text-xs text-indigo-600">
                            Remaining linkable amount:{" "}
                            <span className="font-semibold">
                                {remainingAmount.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                })}{" "}
                                BDT
                            </span>
                        </p>
                    </div>

                    {/* Usable Type */}
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                            Link To <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                            {(["purchase", "expense"] as UsableType[]).map(
                                (type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => handleTypeChange(type)}
                                        className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                                            form.usable_type === type
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                        }`}
                                    >
                                        {type === "purchase"
                                            ? "Purchase"
                                            : "Expense"}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>

                    {/* Usable Select */}
                    {form.usable_type !== "" && (
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                Select{" "}
                                {form.usable_type === "purchase"
                                    ? "Purchase"
                                    : "Expense"}{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.usable_id}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        usable_id:
                                            e.target.value === ""
                                                ? ""
                                                : Number(e.target.value),
                                    }))
                                }
                                className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">
                                    — Select{" "}
                                    {form.usable_type === "purchase"
                                        ? "purchase"
                                        : "expense"}{" "}
                                    —
                                </option>
                                {options.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            {options.length === 0 && (
                                <p className="mt-1 text-xs text-amber-600">
                                    No available{" "}
                                    {form.usable_type === "purchase"
                                        ? "purchases"
                                        : "expenses"}{" "}
                                    to link. All existing records are already
                                    linked.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                            Amount (BDT) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            max={remainingAmount}
                            value={form.amount}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    amount: e.target.value,
                                }))
                            }
                            placeholder="0.00"
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {Number(form.amount) > remainingAmount && (
                            <p className="mt-1 text-xs text-red-500">
                                Amount cannot exceed remaining linkable amount (
                                {remainingAmount.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                })}{" "}
                                BDT).
                            </p>
                        )}
                    </div>

                    {/* Note */}
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                            Note{" "}
                            <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            rows={2}
                            value={form.note}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    note: e.target.value,
                                }))
                            }
                            placeholder="Why this withdrawal was used for this transaction..."
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={
                            processing ||
                            !form.usable_type ||
                            form.usable_id === "" ||
                            form.amount === "" ||
                            Number(form.amount) <= 0 ||
                            Number(form.amount) > remainingAmount
                        }
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing ? "Linking..." : "Link Usage"}
                    </button>
                </div>
            </div>
        </div>
    );
}
