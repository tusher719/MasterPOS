import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useState } from "react";
import { Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import useFlashToast from "@/hooks/useFlashToast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface InvestmentType {
    id:          number;
    name:        string;
    description: string | null;
    is_active:   boolean;
    deleted_at:  string | null;
}

interface Props {
    investmentTypes: InvestmentType[];
}

const EMPTY_FORM = {
    name:        "",
    description: "",
    is_active:   true,
};

export default function InvestmentTypes({ investmentTypes }: Props) {
    useFlashToast();

    const [open,    setOpen]    = useState(false);
    const [editing, setEditing] = useState<InvestmentType | null>(null);

    const form = useForm({ ...EMPTY_FORM });

    const openCreate = () => {
        form.reset();
        form.setData({ ...EMPTY_FORM });
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (type: InvestmentType) => {
        setEditing(type);
        form.setData({
            name:        type.name,
            description: type.description ?? "",
            is_active:   type.is_active,
        });
        setOpen(true);
    };

    const submit = () => {
        if (editing) {
            form.put(route("backend.investment-types.update", editing.id), {
                onSuccess: () => { toast.success("Investment type updated."); setOpen(false); },
            });
        } else {
            form.post(route("backend.investment-types.store"), {
                onSuccess: () => { toast.success("Investment type created."); setOpen(false); },
            });
        }
    };

    const destroy = (type: InvestmentType) => {
        Swal.fire({
            title:              "Delete Investment Type?",
            text:               `"${type.name}" will be permanently removed.`,
            icon:               "warning",
            showCancelButton:   true,
            confirmButtonText:  "Yes, delete",
            confirmButtonColor: "#ef4444",
        }).then((result) => {
            if (result.isConfirmed) {
                form.delete(route("backend.investment-types.destroy", type.id), {
                    onSuccess: () => toast.success("Investment type deleted."),
                });
            }
        });
    };

    const visible  = investmentTypes.filter((t) => !t.deleted_at);
    const active   = visible.filter((t) => t.is_active).length;
    const inactive = visible.filter((t) => !t.is_active).length;

    return (
        <AuthenticatedLayout>
            <Head title="Investment Types" />

            <div className="space-y-5">
                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Investment Types</h1>
                        <p className="text-sm text-gray-500">
                            Categorize capital investments in the business
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        <Plus size={16} /> Add Type
                    </button>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Types", value: visible.length, color: "text-gray-800"   },
                        { label: "Active",      value: active,         color: "text-emerald-600" },
                        { label: "Inactive",    value: inactive,       color: "text-amber-500"   },
                    ].map((s) => (
                        <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="text-sm text-gray-500">{s.label}</p>
                            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Table ── */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Type Name</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((type) => (
                                <tr
                                    key={type.id}
                                    className="border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-3">
                                            {/* Icon badge */}
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200">
                                                <TrendingUp size={13} className="text-emerald-600" />
                                            </span>
                                            <span className="font-medium text-gray-700">{type.name}</span>
                                        </span>
                                    </td>
                                    <td className="max-w-xs px-4 py-3 text-gray-400">
                                        <span className="line-clamp-1">
                                            {type.description || "—"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            type.is_active
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-500"
                                        }`}>
                                            {type.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => openEdit(type)}
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => destroy(type)}
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {visible.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-400">
                                        No investment types yet. Add one to get started.
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
                                {editing ? "Edit Investment Type" : "Add Investment Type"}
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
                                    onChange={(e) => form.setData("name", e.target.value)}
                                    placeholder="e.g. Equipment Purchase"
                                    className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {form.errors.name && (
                                    <p className="mt-1 text-xs text-red-600">{form.errors.name}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    value={form.data.description}
                                    onChange={(e) => form.setData("description", e.target.value)}
                                    placeholder="Brief description of this investment type..."
                                    rows={3}
                                    className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {form.errors.description && (
                                    <p className="mt-1 text-xs text-red-600">{form.errors.description}</p>
                                )}
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Active</p>
                                    <p className="text-xs text-gray-400">
                                        Available when recording investments
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => form.setData("is_active", !form.data.is_active)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        form.data.is_active ? "bg-indigo-600" : "bg-gray-200"
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                        form.data.is_active ? "translate-x-6" : "translate-x-1"
                                    }`} />
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
                                    : editing ? "Save Changes" : "Create Type"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
