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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-gray-800">
                        {isEdit ? "Edit Supplier" : "Add New Supplier"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
                    {/* Name + Company */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Contact person name"
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Company
                            </label>
                            <input
                                type="text"
                                value={data.company}
                                onChange={(e) =>
                                    setData("company", e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Company name"
                            />
                            {errors.company && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.company}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Email + Phone */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="email@example.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Phone
                            </label>
                            <input
                                type="text"
                                value={data.phone}
                                onChange={(e) =>
                                    setData("phone", e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="+880 1XXX-XXXXXX"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Address
                        </label>
                        <textarea
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Street address"
                        />
                        {errors.address && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.address}
                            </p>
                        )}
                    </div>

                    {/* City + Country */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                City
                            </label>
                            <input
                                type="text"
                                value={data.city}
                                onChange={(e) =>
                                    setData("city", e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Dhaka"
                            />
                            {errors.city && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.city}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Country
                            </label>
                            <input
                                type="text"
                                value={data.country}
                                onChange={(e) =>
                                    setData("country", e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Bangladesh"
                            />
                            {errors.country && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.country}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Opening Balance + Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
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
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="0.00"
                            />
                            {errors.opening_balance && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.opening_balance}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
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
                                            : "bg-gray-200"
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
                                <span className="text-sm text-gray-600">
                                    {data.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
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
