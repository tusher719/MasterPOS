import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Supplier {
    id: number;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    opening_balance: string;
    is_active: boolean;
}

interface Props {
    show: boolean;
    onClose: () => void;
    supplier: Supplier | null;
}

const defaultValues = {
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Bangladesh",
    opening_balance: "0.00",
    is_active: true as boolean,
};

export default function SupplierModal({ show, onClose, supplier }: Props) {
    const isEdit = supplier !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm(defaultValues);

    useEffect(() => {
        if (!show) return;
        clearErrors();
        if (isEdit && supplier) {
            setData({
                name: supplier.name,
                company: supplier.company ?? "",
                email: supplier.email ?? "",
                phone: supplier.phone ?? "",
                address: supplier.address ?? "",
                city: supplier.city ?? "",
                country: supplier.country ?? "Bangladesh",
                opening_balance: Number(supplier.opening_balance).toFixed(2),
                is_active: supplier.is_active,
            });
        } else {
            reset();
        }
    }, [show, supplier]);

    if (!show) return null;

    const handleSubmit = () => {
        if (isEdit && supplier) {
            put(route("backend.suppliers.update", supplier.id), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Supplier updated successfully.");
                    onClose();
                },
                onError: () => toast.error("Please fix the errors below."),
            });
        } else {
            post(route("backend.suppliers.store"), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Supplier created successfully.");
                    onClose();
                    reset();
                },
                onError: () => toast.error("Please fix the errors below."),
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        {isEdit ? "Edit Supplier" : "Add New Supplier"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4 text-slate-700 dark:text-slate-300">
                    {/* Name + Company */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                Contact Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Contact person name"
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                Company
                            </label>
                            <input
                                type="text"
                                value={data.company}
                                onChange={(e) =>
                                    setData("company", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Company name"
                            />
                            {errors.company && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {errors.company}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Email + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="email@example.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {errors.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                Phone Number
                            </label>
                            <input
                                type="text"
                                value={data.phone}
                                onChange={(e) =>
                                    setData("phone", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="+880 1XXX-XXXXXX"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {errors.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                            Address
                        </label>
                        <textarea
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Street address / warehouse location"
                        />
                        {errors.address && (
                            <p className="mt-1 text-xs text-rose-500">
                                {errors.address}
                            </p>
                        )}
                    </div>

                    {/* City + Country */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                City
                            </label>
                            <input
                                type="text"
                                value={data.city}
                                onChange={(e) =>
                                    setData("city", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Dhaka"
                            />
                            {errors.city && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {errors.city}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                Country
                            </label>
                            <input
                                type="text"
                                value={data.country}
                                onChange={(e) =>
                                    setData("country", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Bangladesh"
                            />
                            {errors.country && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {errors.country}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Opening Balance + Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                Opening Balance (৳)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.opening_balance}
                                onChange={(e) =>
                                    setData("opening_balance", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="0.00"
                            />
                            {errors.opening_balance && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {errors.opening_balance}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                Status
                            </label>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setData("is_active", !data.is_active)
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        data.is_active
                                            ? "bg-indigo-600"
                                            : "bg-slate-200 dark:bg-slate-700"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                            data.is_active
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                        }`}
                                    />
                                </button>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {data.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-5 py-3.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-5 py-2 text-xs font-semibold text-white transition-colors shadow-sm disabled:opacity-60"
                    >
                        {processing
                            ? isEdit
                                ? "Updating..."
                                : "Creating..."
                            : isEdit
                              ? "Update Supplier"
                              : "Create Supplier"}
                    </button>
                </div>
            </div>
        </div>
    );
}
