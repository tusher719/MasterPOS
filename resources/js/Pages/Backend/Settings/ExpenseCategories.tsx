import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import useFlashToast from "@/hooks/useFlashToast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExpenseCategory {
    id:          number;
    name:        string;
    description: string | null;
    color:       string;
    is_active:   boolean;
    deleted_at:  string | null;
}

interface Props {
    categories: ExpenseCategory[];
}

// ─── Preset color palette ─────────────────────────────────────────────────────
const COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
    "#f97316", "#f59e0b", "#10b981", "#14b8a6",
    "#3b82f6", "#06b6d4", "#64748b", "#1e293b",
];

const EMPTY_FORM = {
    name:        "",
    description: "",
    color:       "#6366f1",
    is_active:   true,
};

export default function ExpenseCategories({ categories }: Props) {
    useFlashToast();

    const [open,    setOpen]    = useState(false);
    const [editing, setEditing] = useState<ExpenseCategory | null>(null);

    const form = useForm({ ...EMPTY_FORM });

    const openCreate = () => {
        form.reset();
        form.setData({ ...EMPTY_FORM });
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (cat: ExpenseCategory) => {
        setEditing(cat);
        form.setData({
            name:        cat.name,
            description: cat.description ?? "",
            color:       cat.color,
            is_active:   cat.is_active,
        });
        setOpen(true);
    };

    const submit = () => {
        if (editing) {
            form.put(route("backend.expense-categories.update", editing.id), {
                onSuccess: () => { toast.success("Category updated."); setOpen(false); },
            });
        } else {
            form.post(route("backend.expense-categories.store"), {
                onSuccess: () => { toast.success("Category created."); setOpen(false); },
            });
        }
    };

    const destroy = (cat: ExpenseCategory) => {
        Swal.fire({
            title:              "Delete Category?",
            text:               `"${cat.name}" will be permanently removed.`,
            icon:               "warning",
            showCancelButton:   true,
            confirmButtonText:  "Yes, delete",
            confirmButtonColor: "#ef4444",
        }).then((result) => {
            if (result.isConfirmed) {
                form.delete(route("backend.expense-categories.destroy", cat.id), {
                    onSuccess: () => toast.success("Category deleted."),
                });
            }
        });
    };

    const visible  = categories.filter((c) => !c.deleted_at);
    const active   = visible.filter((c) => c.is_active).length;
    const inactive = visible.filter((c) => !c.is_active).length;

    return (
        <AuthenticatedLayout>
            <Head title="Expense Categories" />

            <div className="space-y-5">
                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Expense Categories</h1>
                        <p className="text-sm text-gray-500">
                            Organize and classify business expenses
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        <Plus size={16} /> Add Category
                    </button>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Categories", value: visible.length, color: "text-gray-800"   },
                        { label: "Active",           value: active,         color: "text-emerald-600" },
                        { label: "Inactive",         value: inactive,       color: "text-amber-500"   },
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
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((cat) => (
                                <tr
                                    key={cat.id}
                                    className="border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-3">
                                            {/* Color swatch */}
                                            <span
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                                style={{
                                                    backgroundColor: cat.color + "20",
                                                    border:          `2px solid ${cat.color}`,
                                                }}
                                            >
                                                <Tag
                                                    size={13}
                                                    style={{ color: cat.color }}
                                                />
                                            </span>
                                            <span className="font-medium text-gray-700">{cat.name}</span>
                                        </span>
                                    </td>
                                    <td className="max-w-xs px-4 py-3 text-gray-400">
                                        <span className="line-clamp-1">
                                            {cat.description || "—"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            cat.is_active
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-500"
                                        }`}>
                                            {cat.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => openEdit(cat)}
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => destroy(cat)}
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
                                        No categories yet. Add one to start organizing expenses.
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
                                {editing ? "Edit Category" : "Add Expense Category"}
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
                                    placeholder="e.g. Office Supplies"
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
                                    placeholder="Brief description..."
                                    rows={2}
                                    className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Color picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Color <span className="text-red-500">*</span>
                                </label>

                                {/* Preset palette */}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => form.setData("color", c)}
                                            className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                                            style={{
                                                backgroundColor: c,
                                                outline:         form.data.color === c ? `3px solid ${c}` : "none",
                                                outlineOffset:   "2px",
                                                border:          form.data.color === c ? "2px solid white" : "2px solid transparent",
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Custom hex + native picker + live preview */}
                                <div className="mt-3 flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={form.data.color}
                                        onChange={(e) => form.setData("color", e.target.value)}
                                        className="h-9 w-14 cursor-pointer rounded border border-gray-300 bg-transparent p-0.5"
                                    />
                                    <input
                                        value={form.data.color}
                                        onChange={(e) => form.setData("color", e.target.value)}
                                        maxLength={7}
                                        placeholder="#6366f1"
                                        className="w-full rounded-md border-gray-300 font-mono text-sm uppercase shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {/* Live preview swatch */}
                                    <span
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                        style={{
                                            backgroundColor: form.data.color + "25",
                                            border:          `2px solid ${form.data.color}`,
                                        }}
                                    >
                                        <Tag size={14} style={{ color: form.data.color }} />
                                    </span>
                                </div>
                                {form.errors.color && (
                                    <p className="mt-1 text-xs text-red-600">{form.errors.color}</p>
                                )}
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Active</p>
                                    <p className="text-xs text-gray-400">
                                        Available when logging expenses
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
                                    : editing ? "Save Changes" : "Create Category"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
