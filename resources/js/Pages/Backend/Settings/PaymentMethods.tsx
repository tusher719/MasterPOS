// resources/js/Pages/Backend/Settings/PaymentMethods.tsx

import useFlashToast from "@/hooks/useFlashToast";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import {
    ArrowUpDown,
    Banknote,
    CreditCard,
    DollarSign,
    MoreHorizontal,
    Pencil,
    Percent,
    Plus,
    Smartphone,
    Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentType = "cash" | "card" | "mobile_banking" | "other";
type ChargeType = "percent" | "fixed" | "";

interface PaymentMethod {
    id: number;
    name: string;
    type: PaymentType;
    is_active: boolean;
    sort_order: number;
    charge_enabled: boolean;
    online_charge_type: ChargeType;
    online_charge_value: string; // decimal serialized as string from Laravel
    charge_label: string | null;
    deleted_at: string | null;
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
    other: {
        label: "Other",
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: MoreHorizontal,
    },
};

const EMPTY_FORM = {
    name: "",
    type: "cash" as PaymentType,
    is_active: true,
    sort_order: 0,
    charge_enabled: false,
    online_charge_type: "" as ChargeType,
    online_charge_value: "0",
    charge_label: "",
};

// ─── Charge summary helper ────────────────────────────────────────────────────
function chargeSummary(pm: PaymentMethod): string | null {
    if (!pm.charge_enabled || !pm.online_charge_type) return null;
    const val = Number(pm.online_charge_value);
    if (pm.online_charge_type === "percent") return `${val}%`;
    return `৳${val.toFixed(2)}`;
}

export default function PaymentMethods({ paymentMethods, can }: Props) {
    useFlashToast();

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<PaymentMethod | null>(null);

    const form = useForm({ ...EMPTY_FORM });

    const openCreate = () => {
        form.reset();
        form.setData({ ...EMPTY_FORM });
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

    const visible = paymentMethods.filter((pm) => !pm.deleted_at);
    const active = visible.filter((pm) => pm.is_active).length;
    const inactive = visible.filter((pm) => !pm.is_active).length;

    // charge_enabled toggle — clear type/value when disabling
    const toggleCharge = (enabled: boolean) => {
        form.setData({
            ...form.data,
            charge_enabled: enabled,
            online_charge_type: enabled ? form.data.online_charge_type : "",
            online_charge_value: enabled ? form.data.online_charge_value : "0",
            charge_label: enabled ? form.data.charge_label : "",
        });
    };

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
                                const charge = chargeSummary(pm);
                                return (
                                    <tr
                                        key={pm.id}
                                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
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
                                            {charge ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                                                    {pm.online_charge_type ===
                                                    "percent" ? (
                                                        <Percent size={11} />
                                                    ) : (
                                                        <DollarSign size={11} />
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

            {/* ── Modal ── */}
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

                            {/* ── Charge Config Section ── */}
                            <div className="rounded-lg border border-gray-200">
                                {/* Charge enable toggle */}
                                <div className="flex items-center justify-between px-4 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">
                                            Payment Charge
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Extra charge applied when customer
                                            uses this method
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

                                {/* Charge fields — shown only when enabled */}
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
                                            {form.errors.online_charge_type && (
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
                                                value={form.data.charge_label}
                                                onChange={(e) =>
                                                    form.setData(
                                                        "charge_label",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g. bKash Charge (1.5%)"
                                                className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                            {form.errors.charge_label && (
                                                <p className="mt-1 text-xs text-red-600">
                                                    {form.errors.charge_label}
                                                </p>
                                            )}
                                        </div>

                                        {/* Live preview */}
                                        {form.data.online_charge_type &&
                                            Number(
                                                form.data.online_charge_value,
                                            ) > 0 && (
                                                <div className="rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                                                    Preview: on ৳1,000 subtotal
                                                    →{" "}
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
