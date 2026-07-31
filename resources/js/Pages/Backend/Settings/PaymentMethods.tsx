// resources/js/Pages/Backend/Settings/PaymentMethods.tsx

import useFlashToast from "@/hooks/useFlashToast";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import {
    ArrowUpDown,
    Banknote,
    Building2,
    ChevronDown,
    ChevronRight,
    CreditCard,
    DollarSign,
    MoreHorizontal,
    Pencil,
    Percent,
    Plus,
    Smartphone,
    Trash2,
    University,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentType =
    | "cash"
    | "card"
    | "mobile_banking"
    | "bank_transfer"
    | "other";
type ChargeType = "percent" | "fixed" | "";

interface PaymentMethodBank {
    id: number;
    payment_method_id: number;
    bank_name: string;
    account_number: string | null;
    account_name: string | null;
    charge_type: ChargeType;
    charge_value: string; // decimal as string from Laravel
    charge_enabled: boolean;
    charge_label: string | null;
    is_active: boolean;
    sort_order: number;
}

interface PaymentMethod {
    id: number;
    name: string;
    type: PaymentType;
    is_active: boolean;
    sort_order: number;
    charge_enabled: boolean;
    online_charge_type: ChargeType;
    online_charge_value: string;
    charge_label: string | null;
    deleted_at: string | null;
    banks: PaymentMethodBank[];
}

interface Props {
    paymentMethods: PaymentMethod[];
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
}

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
    PaymentType,
    { label: string; color: string; icon: React.ElementType }
> = {
    cash: {
        label: "Cash",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: Banknote,
    },
    card: {
        label: "Card",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: CreditCard,
    },
    mobile_banking: {
        label: "Mobile Banking",
        color: "bg-purple-100 text-purple-700 border-purple-200",
        icon: Smartphone,
    },
    bank_transfer: {
        label: "Bank Transfer",
        color: "bg-sky-100 text-sky-700 border-sky-200",
        icon: University,
    },
    other: {
        label: "Other",
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: MoreHorizontal,
    },
};

// ─── Empty forms ──────────────────────────────────────────────────────────────
const EMPTY_METHOD_FORM = {
    name: "",
    type: "cash" as PaymentType,
    is_active: true,
    sort_order: 0,
    charge_enabled: false,
    online_charge_type: "" as ChargeType,
    online_charge_value: "0",
    charge_label: "",
};

const EMPTY_BANK_FORM = {
    bank_name: "",
    account_number: "",
    account_name: "",
    charge_enabled: false,
    charge_type: "" as ChargeType,
    charge_value: "0",
    charge_label: "",
    is_active: true,
    sort_order: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function methodChargeSummary(pm: PaymentMethod): string | null {
    if (!pm.charge_enabled || !pm.online_charge_type) return null;
    const val = Number(pm.online_charge_value);
    return pm.online_charge_type === "percent"
        ? `${val}%`
        : `৳${val.toFixed(2)}`;
}

function bankChargeSummary(bank: PaymentMethodBank): string | null {
    if (!bank.charge_enabled || !bank.charge_type) return null;
    const val = Number(bank.charge_value);
    return bank.charge_type === "percent" ? `${val}%` : `৳${val.toFixed(2)}`;
}

// ─── Bank charge sub-form (reused in create + edit bank modal) ────────────────
function BankChargeFields({
    chargeEnabled,
    chargeType,
    chargeValue,
    chargeLabel,
    errors,
    onToggle,
    onTypeChange,
    onValueChange,
    onLabelChange,
}: {
    chargeEnabled: boolean;
    chargeType: ChargeType;
    chargeValue: string;
    chargeLabel: string;
    errors: Partial<Record<string, string>>;
    onToggle: (val: boolean) => void;
    onTypeChange: (val: ChargeType) => void;
    onValueChange: (val: string) => void;
    onLabelChange: (val: string) => void;
}) {
    return (
        <div className="rounded-lg border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3">
                <div>
                    <p className="text-sm font-medium text-gray-700">
                        Bank Charge
                    </p>
                    <p className="text-xs text-gray-400">
                        Extra charge for selecting this bank
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onToggle(!chargeEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${chargeEnabled ? "bg-indigo-600" : "bg-gray-200"}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${chargeEnabled ? "translate-x-6" : "translate-x-1"}`}
                    />
                </button>
            </div>

            {chargeEnabled && (
                <div className="space-y-3 border-t border-gray-100 px-4 pb-4 pt-3">
                    {/* Charge Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Charge Type <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 flex gap-3">
                            {(["percent", "fixed"] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => onTypeChange(t)}
                                    className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                                        chargeType === t
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {t === "percent" ? (
                                        <Percent size={13} />
                                    ) : (
                                        <DollarSign size={13} />
                                    )}
                                    {t === "percent"
                                        ? "Percent (%)"
                                        : "Fixed (৳)"}
                                </button>
                            ))}
                        </div>
                        {errors.charge_type && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.charge_type}
                            </p>
                        )}
                    </div>

                    {/* Charge Value */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Charge Value <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={chargeValue}
                                onChange={(e) => onValueChange(e.target.value)}
                                className="w-36 rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-400">
                                {chargeType === "percent" ? "%" : "৳"}
                            </span>
                        </div>
                        {errors.charge_value && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.charge_value}
                            </p>
                        )}
                    </div>

                    {/* Charge Label */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Charge Label
                            <span className="ml-1 text-xs font-normal text-gray-400">
                                (shown to customer)
                            </span>
                        </label>
                        <input
                            value={chargeLabel}
                            onChange={(e) => onLabelChange(e.target.value)}
                            placeholder="e.g. Dutch-Bangla Charge (1%)"
                            className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Live preview */}
                    {chargeType && Number(chargeValue) > 0 && (
                        <div className="rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                            Preview: on ৳1,000 subtotal →{" "}
                            <strong>
                                {chargeType === "percent"
                                    ? `৳${((1000 * Number(chargeValue)) / 100).toFixed(2)} charge`
                                    : `৳${Number(chargeValue).toFixed(2)} charge`}
                            </strong>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Banks sub-panel (shown inside expanded row for bank_transfer methods) ─────
function BanksPanel({
    paymentMethod,
    can,
}: {
    paymentMethod: PaymentMethod;
    can: Props["can"];
}) {
    const [bankModalOpen, setBankModalOpen] = useState(false);
    const [editingBank, setEditingBank] = useState<PaymentMethodBank | null>(
        null,
    );

    const bankForm = useForm({ ...EMPTY_BANK_FORM });

    const openCreateBank = () => {
        bankForm.reset();
        bankForm.setData({ ...EMPTY_BANK_FORM });
        setEditingBank(null);
        setBankModalOpen(true);
    };

    const openEditBank = (bank: PaymentMethodBank) => {
        setEditingBank(bank);
        bankForm.setData({
            bank_name: bank.bank_name,
            account_number: bank.account_number ?? "",
            account_name: bank.account_name ?? "",
            charge_enabled: bank.charge_enabled,
            charge_type: bank.charge_type ?? "",
            charge_value: bank.charge_value ?? "0",
            charge_label: bank.charge_label ?? "",
            is_active: bank.is_active,
            sort_order: bank.sort_order,
        });
        setBankModalOpen(true);
    };

    const submitBank = () => {
        if (editingBank) {
            bankForm.put(
                route("backend.payment-methods.banks.update", {
                    paymentMethod: paymentMethod.id,
                    bank: editingBank.id,
                }),
                {
                    onSuccess: () => {
                        toast.success("Bank updated.");
                        setBankModalOpen(false);
                    },
                },
            );
        } else {
            bankForm.post(
                route("backend.payment-methods.banks.store", {
                    paymentMethod: paymentMethod.id,
                }),
                {
                    onSuccess: () => {
                        toast.success("Bank added.");
                        setBankModalOpen(false);
                    },
                },
            );
        }
    };

    const destroyBank = (bank: PaymentMethodBank) => {
        Swal.fire({
            title: "Delete Bank?",
            text: `"${bank.bank_name}" will be permanently removed.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
            confirmButtonColor: "#ef4444",
        }).then((result) => {
            if (result.isConfirmed) {
                bankForm.delete(
                    route("backend.payment-methods.banks.destroy", {
                        paymentMethod: paymentMethod.id,
                        bank: bank.id,
                    }),
                    {
                        onSuccess: () => toast.success("Bank deleted."),
                    },
                );
            }
        });
    };

    const toggleBankCharge = (enabled: boolean) => {
        bankForm.setData({
            ...bankForm.data,
            charge_enabled: enabled,
            charge_type: enabled ? bankForm.data.charge_type : "",
            charge_value: enabled ? bankForm.data.charge_value : "0",
            charge_label: enabled ? bankForm.data.charge_label : "",
        });
    };

    return (
        <>
            {/* Banks sub-panel */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-sky-600" />
                        <span className="text-sm font-medium text-gray-700">
                            Individual Banks
                        </span>
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                            {paymentMethod.banks.length}
                        </span>
                    </div>
                    {can.edit && (
                        <button
                            onClick={openCreateBank}
                            className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                        >
                            <Plus size={12} /> Add Bank
                        </button>
                    )}
                </div>

                {paymentMethod.banks.length === 0 ? (
                    <p className="py-3 text-center text-xs text-gray-400">
                        No banks added yet. Add individual banks to show a bank
                        selector at checkout.
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                        Order
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                        Bank Name
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                        Account
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                        Charge
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentMethod.banks.map((bank) => {
                                    const charge = bankChargeSummary(bank);
                                    return (
                                        <tr
                                            key={bank.id}
                                            className="border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-2.5 text-xs text-gray-400">
                                                {bank.sort_order}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="font-medium text-gray-700">
                                                    {bank.bank_name}
                                                </span>
                                                {bank.charge_label && (
                                                    <span className="mt-0.5 block text-xs text-gray-400">
                                                        {bank.charge_label}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-gray-500">
                                                {bank.account_number ? (
                                                    <span>
                                                        {bank.account_number}
                                                        {bank.account_name && (
                                                            <span className="ml-1 text-gray-400">
                                                                (
                                                                {
                                                                    bank.account_name
                                                                }
                                                                )
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {charge ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                                        {bank.charge_type ===
                                                        "percent" ? (
                                                            <Percent
                                                                size={10}
                                                            />
                                                        ) : (
                                                            <DollarSign
                                                                size={10}
                                                            />
                                                        )}
                                                        {charge}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-300">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bank.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                                                >
                                                    {bank.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {can.edit && (
                                                        <button
                                                            onClick={() =>
                                                                openEditBank(
                                                                    bank,
                                                                )
                                                            }
                                                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                        >
                                                            <Pencil size={13} />
                                                        </button>
                                                    )}
                                                    {can.edit && (
                                                        <button
                                                            onClick={() =>
                                                                destroyBank(
                                                                    bank,
                                                                )
                                                            }
                                                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Bank Modal ── */}
            {bankModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                        {/* Header */}
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="text-base font-semibold text-gray-800">
                                {editingBank ? "Edit Bank" : "Add Bank"}
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-400">
                                Under{" "}
                                <span className="font-medium text-gray-600">
                                    {paymentMethod.name}
                                </span>
                            </p>
                        </div>

                        {/* Body */}
                        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
                            {/* Bank Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Bank Name{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={bankForm.data.bank_name}
                                    onChange={(e) =>
                                        bankForm.setData(
                                            "bank_name",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. Dutch-Bangla Bank"
                                    className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {bankForm.errors.bank_name && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {bankForm.errors.bank_name}
                                    </p>
                                )}
                            </div>

                            {/* Account Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Account Number
                                </label>
                                <input
                                    value={bankForm.data.account_number}
                                    onChange={(e) =>
                                        bankForm.setData(
                                            "account_number",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. 1234567890"
                                    className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Account Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Account Name
                                </label>
                                <input
                                    value={bankForm.data.account_name}
                                    onChange={(e) =>
                                        bankForm.setData(
                                            "account_name",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. Master Business"
                                    className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={bankForm.data.sort_order}
                                    onChange={(e) =>
                                        bankForm.setData(
                                            "sort_order",
                                            Number(e.target.value),
                                        )
                                    }
                                    className="mt-1 w-28 rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        Active
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Show this bank at checkout
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        bankForm.setData(
                                            "is_active",
                                            !bankForm.data.is_active,
                                        )
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bankForm.data.is_active ? "bg-indigo-600" : "bg-gray-200"}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${bankForm.data.is_active ? "translate-x-6" : "translate-x-1"}`}
                                    />
                                </button>
                            </div>

                            {/* Charge fields */}
                            <BankChargeFields
                                chargeEnabled={bankForm.data.charge_enabled}
                                chargeType={bankForm.data.charge_type}
                                chargeValue={bankForm.data.charge_value}
                                chargeLabel={bankForm.data.charge_label}
                                errors={bankForm.errors}
                                onToggle={toggleBankCharge}
                                onTypeChange={(t) =>
                                    bankForm.setData("charge_type", t)
                                }
                                onValueChange={(v) =>
                                    bankForm.setData("charge_value", v)
                                }
                                onLabelChange={(l) =>
                                    bankForm.setData("charge_label", l)
                                }
                            />
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                            <button
                                type="button"
                                onClick={() => setBankModalOpen(false)}
                                className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitBank}
                                disabled={bankForm.processing}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {bankForm.processing
                                    ? "Saving..."
                                    : editingBank
                                      ? "Save Changes"
                                      : "Add Bank"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PaymentMethods({ paymentMethods, can }: Props) {
    useFlashToast();

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<PaymentMethod | null>(null);
    const [expandedBankRow, setExpandedBankRow] = useState<number | null>(null);

    const form = useForm({ ...EMPTY_METHOD_FORM });

    const openCreate = () => {
        form.reset();
        form.setData({ ...EMPTY_METHOD_FORM });
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (pm: PaymentMethod) => {
        setEditing(pm);
        form.setData({
            name: pm.name,
            type: pm.type,
            is_active: pm.is_active,
            sort_order: pm.sort_order,
            charge_enabled: pm.charge_enabled,
            online_charge_type: pm.online_charge_type ?? "",
            online_charge_value: pm.online_charge_value ?? "0",
            charge_label: pm.charge_label ?? "",
        });
        setOpen(true);
    };

    const submit = () => {
        if (editing) {
            form.put(route("backend.payment-methods.update", editing.id), {
                onSuccess: () => {
                    toast.success("Payment method updated.");
                    setOpen(false);
                },
            });
        } else {
            form.post(route("backend.payment-methods.store"), {
                onSuccess: () => {
                    toast.success("Payment method created.");
                    setOpen(false);
                },
            });
        }
    };

    const destroy = (pm: PaymentMethod) => {
        Swal.fire({
            title: "Delete Payment Method?",
            text: `"${pm.name}" will be permanently removed.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
            confirmButtonColor: "#ef4444",
        }).then((result) => {
            if (result.isConfirmed) {
                form.delete(route("backend.payment-methods.destroy", pm.id), {
                    onSuccess: () => toast.success("Payment method deleted."),
                });
            }
        });
    };

    const toggleCharge = (enabled: boolean) => {
        form.setData({
            ...form.data,
            charge_enabled: enabled,
            online_charge_type: enabled ? form.data.online_charge_type : "",
            online_charge_value: enabled ? form.data.online_charge_value : "0",
            charge_label: enabled ? form.data.charge_label : "",
        });
    };

    const visible = paymentMethods.filter((pm) => !pm.deleted_at);
    const active = visible.filter((pm) => pm.is_active).length;
    const inactive = visible.filter((pm) => !pm.is_active).length;

    return (
        <AuthenticatedLayout>
            <Head title="Payment Methods" />

            <div className="space-y-5">
                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Payment Methods
                        </h1>
                        <p className="text-sm text-gray-500">
                            Manage accepted payment methods and their charge
                            config
                        </p>
                    </div>
                    {can.create && (
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                        >
                            <Plus size={16} /> Add Method
                        </button>
                    )}
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        {
                            label: "Total Methods",
                            value: visible.length,
                            color: "text-gray-800",
                        },
                        {
                            label: "Active",
                            value: active,
                            color: "text-emerald-600",
                        },
                        {
                            label: "Inactive",
                            value: inactive,
                            color: "text-amber-500",
                        },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="rounded-lg border border-gray-200 bg-white p-4"
                        >
                            <p className="text-sm text-gray-500">{s.label}</p>
                            <p className={`mt-1 text-2xl font-bold ${s.color}`}>
                                {s.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Table ── */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <ArrowUpDown size={13} /> Order
                                    </span>
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Charge
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((pm) => {
                                const cfg = TYPE_CONFIG[pm.type];
                                const Icon = cfg.icon;
                                const charge = methodChargeSummary(pm);
                                const isBankTransfer =
                                    pm.type === "bank_transfer";
                                const isExpanded = expandedBankRow === pm.id;

                                return (
                                    <>
                                        <tr
                                            key={pm.id}
                                            className="border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 text-gray-400">
                                                {pm.sort_order}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="flex items-center gap-2 font-medium text-gray-700">
                                                    <Icon
                                                        size={15}
                                                        className="text-gray-400"
                                                    />
                                                    {pm.name}
                                                </span>
                                                {pm.charge_label && (
                                                    <span className="mt-0.5 block text-xs text-gray-400">
                                                        {pm.charge_label}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}
                                                >
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {isBankTransfer ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                                                        <Building2 size={10} />
                                                        {pm.banks.length} bank
                                                        {pm.banks.length !== 1
                                                            ? "s"
                                                            : ""}
                                                    </span>
                                                ) : charge ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                                                        {pm.online_charge_type ===
                                                        "percent" ? (
                                                            <Percent
                                                                size={11}
                                                            />
                                                        ) : (
                                                            <DollarSign
                                                                size={11}
                                                            />
                                                        )}
                                                        {charge}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pm.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                                                >
                                                    {pm.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Expand banks toggle for bank_transfer */}
                                                    {isBankTransfer && (
                                                        <button
                                                            onClick={() =>
                                                                setExpandedBankRow(
                                                                    isExpanded
                                                                        ? null
                                                                        : pm.id,
                                                                )
                                                            }
                                                            className="rounded-md p-1.5 text-sky-500 hover:bg-sky-50"
                                                            title="Manage banks"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown
                                                                    size={14}
                                                                />
                                                            ) : (
                                                                <ChevronRight
                                                                    size={14}
                                                                />
                                                            )}
                                                        </button>
                                                    )}
                                                    {can.edit && (
                                                        <button
                                                            onClick={() =>
                                                                openEdit(pm)
                                                            }
                                                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                    )}
                                                    {can.delete && (
                                                        <button
                                                            onClick={() =>
                                                                destroy(pm)
                                                            }
                                                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Banks expanded sub-panel */}
                                        {isBankTransfer && isExpanded && (
                                            <tr
                                                key={`${pm.id}-banks`}
                                                className="border-b border-gray-100"
                                            >
                                                <td colSpan={6} className="p-0">
                                                    <BanksPanel
                                                        paymentMethod={pm}
                                                        can={can}
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                            {visible.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-12 text-center text-gray-400"
                                    >
                                        No payment methods found. Add one to get
                                        started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Payment Method Modal ── */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                        {/* Header */}
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="text-base font-semibold text-gray-800">
                                {editing
                                    ? "Edit Payment Method"
                                    : "Add Payment Method"}
                            </h2>
                        </div>

                        {/* Body */}
                        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData("name", e.target.value)
                                    }
                                    placeholder="e.g. bKash, Visa Card"
                                    className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {form.errors.name && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {form.errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.data.type}
                                    onChange={(e) =>
                                        form.setData(
                                            "type",
                                            e.target.value as PaymentType,
                                        )
                                    }
                                    className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="mobile_banking">
                                        Mobile Banking
                                    </option>
                                    <option value="bank_transfer">
                                        Bank Transfer
                                    </option>
                                    <option value="other">Other</option>
                                </select>
                                {form.errors.type && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {form.errors.type}
                                    </p>
                                )}
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.data.sort_order}
                                    onChange={(e) =>
                                        form.setData(
                                            "sort_order",
                                            Number(e.target.value),
                                        )
                                    }
                                    className="mt-1 w-28 rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        Active
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Available as a payment option at
                                        checkout
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        form.setData(
                                            "is_active",
                                            !form.data.is_active,
                                        )
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.data.is_active ? "bg-indigo-600" : "bg-gray-200"}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.data.is_active ? "translate-x-6" : "translate-x-1"}`}
                                    />
                                </button>
                            </div>

                            {/* Charge config — hidden for bank_transfer (charge lives on each bank) */}
                            {form.data.type !== "bank_transfer" ? (
                                <div className="rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">
                                                Payment Charge
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Extra charge applied when
                                                customer uses this method
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleCharge(
                                                    !form.data.charge_enabled,
                                                )
                                            }
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.data.charge_enabled ? "bg-indigo-600" : "bg-gray-200"}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.data.charge_enabled ? "translate-x-6" : "translate-x-1"}`}
                                            />
                                        </button>
                                    </div>

                                    {form.data.charge_enabled && (
                                        <div className="space-y-3 border-t border-gray-100 px-4 pb-4 pt-3">
                                            {/* Charge Type */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Charge Type{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <div className="mt-1 flex gap-3">
                                                    {(
                                                        [
                                                            "percent",
                                                            "fixed",
                                                        ] as const
                                                    ).map((t) => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            onClick={() =>
                                                                form.setData(
                                                                    "online_charge_type",
                                                                    t,
                                                                )
                                                            }
                                                            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                                                                form.data
                                                                    .online_charge_type ===
                                                                t
                                                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            {t === "percent" ? (
                                                                <Percent
                                                                    size={13}
                                                                />
                                                            ) : (
                                                                <DollarSign
                                                                    size={13}
                                                                />
                                                            )}
                                                            {t === "percent"
                                                                ? "Percent (%)"
                                                                : "Fixed (৳)"}
                                                        </button>
                                                    ))}
                                                </div>
                                                {form.errors
                                                    .online_charge_type && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {
                                                            form.errors
                                                                .online_charge_type
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Charge Value */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Charge Value{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            form.data
                                                                .online_charge_value
                                                        }
                                                        onChange={(e) =>
                                                            form.setData(
                                                                "online_charge_value",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-36 rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-400">
                                                        {form.data
                                                            .online_charge_type ===
                                                        "percent"
                                                            ? "%"
                                                            : "৳"}
                                                    </span>
                                                </div>
                                                {form.errors
                                                    .online_charge_value && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {
                                                            form.errors
                                                                .online_charge_value
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Charge Label */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Charge Label
                                                    <span className="ml-1 text-xs font-normal text-gray-400">
                                                        (shown to customer)
                                                    </span>
                                                </label>
                                                <input
                                                    value={
                                                        form.data.charge_label
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "charge_label",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g. bKash Charge (1.5%)"
                                                    className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            </div>

                                            {/* Live preview */}
                                            {form.data.online_charge_type &&
                                                Number(
                                                    form.data
                                                        .online_charge_value,
                                                ) > 0 && (
                                                    <div className="rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                                                        Preview: on ৳1,000
                                                        subtotal →{" "}
                                                        <strong>
                                                            {form.data
                                                                .online_charge_type ===
                                                            "percent"
                                                                ? `৳${((1000 * Number(form.data.online_charge_value)) / 100).toFixed(2)} charge`
                                                                : `৳${Number(form.data.online_charge_value).toFixed(2)} charge`}
                                                        </strong>
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Bank Transfer hint — charge lives on individual banks */
                                <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
                                    <p className="flex items-center gap-2 text-sm font-medium text-sky-700">
                                        <Building2 size={14} /> Bank Transfer
                                        charges
                                    </p>
                                    <p className="mt-1 text-xs text-sky-600">
                                        Charges are configured per individual
                                        bank. Use the banks panel (
                                        <ChevronRight
                                            size={11}
                                            className="inline"
                                        />{" "}
                                        icon in the table row) to add banks and
                                        set their charges.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={form.processing}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {form.processing
                                    ? "Saving..."
                                    : editing
                                      ? "Save Changes"
                                      : "Create Method"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
