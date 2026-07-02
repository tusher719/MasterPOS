import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    CreditCard,
    Banknote,
    Smartphone,
    MoreHorizontal,
    ArrowUpDown,
} from "lucide-react";
import useFlashToast from "@/hooks/useFlashToast";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentType = "cash" | "card" | "mobile_banking" | "other";

interface PaymentMethod {
    id: number;
    name: string;
    type: PaymentType;
    is_active: boolean;
    sort_order: number;
    deleted_at: string | null;
}

interface Props {
    paymentMethods: PaymentMethod[];
}

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
    PaymentType,
    {
        label: string;
        color: string;
        icon: React.ElementType;
    }
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
};

export default function PaymentMethods({ paymentMethods }: Props) {
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
                            Manage accepted payment methods for sales
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        <Plus size={16} /> Add Method
                    </button>
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
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}
                                            >
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    pm.is_active
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-500"
                                                }`}
                                            >
                                                {pm.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(pm)}
                                                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => destroy(pm)}
                                                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {visible.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
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
                        {/* Modal header */}
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="text-base font-semibold text-gray-800">
                                {editing
                                    ? "Edit Payment Method"
                                    : "Add Payment Method"}
                            </h2>
                        </div>

                        {/* Modal body */}
                        <div className="space-y-4 px-5 py-4">
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
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        form.data.is_active
                                            ? "bg-indigo-600"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                            form.data.is_active
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Modal footer */}
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
