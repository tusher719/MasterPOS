import { router } from "@inertiajs/react";
import { X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface CreatePartnerModalProps {
    onClose: () => void;
}

interface FormData {
    name: string;
    partner_type_capital: boolean;
    partner_type_working: boolean;
    partner_type_product: boolean;
    phone: string;
    email: string;
    address: string;
    note: string;
    is_active: boolean;
}

const defaultForm: FormData = {
    name: "",
    partner_type_capital: false,
    partner_type_working: false,
    partner_type_product: false,
    phone: "",
    email: "",
    address: "",
    note: "",
    is_active: true,
};

export default function CreatePartnerModal({
    onClose,
}: CreatePartnerModalProps) {
    const [form, setForm] = useState<FormData>(defaultForm);
    const [errors, setErrors] = useState<
        Partial<Record<keyof FormData, string>>
    >({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const target = e.target as HTMLInputElement;
        const value =
            target.type === "checkbox" ? target.checked : target.value;
        setForm((prev) => ({ ...prev, [target.name]: value }));
        setErrors((prev) => ({ ...prev, [target.name]: undefined }));
    };

    const handleSubmit = () => {
        setProcessing(true);
        setErrors({});

        router.post(route("backend.partners.store"), { ...form }, {
            onSuccess: () => {
                toast.success("Partner created successfully.");
                onClose();
            },
            onError: (errs) => {
                setErrors(errs as Partial<Record<keyof FormData, string>>);
                toast.error("Please fix the errors below.");
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-gray-800">
                        Add New Partner
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-5 py-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Partner full name"
                            className="mt-1 w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Partner Types */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Partner Type{" "}
                            <span className="text-xs text-gray-400">
                                (select all that apply)
                            </span>
                        </label>
                        <div className="mt-2 flex flex-wrap gap-4">
                            {[
                                {
                                    key: "partner_type_capital",
                                    label: "Capital",
                                    color: "text-blue-700",
                                },
                                {
                                    key: "partner_type_working",
                                    label: "Working",
                                    color: "text-purple-700",
                                },
                                {
                                    key: "partner_type_product",
                                    label: "Product",
                                    color: "text-orange-700",
                                },
                            ].map(({ key, label, color }) => (
                                <label
                                    key={key}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        name={key}
                                        checked={
                                            form[
                                                key as keyof FormData
                                            ] as boolean
                                        }
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-indigo-600"
                                    />
                                    <span
                                        className={`text-sm font-medium ${color}`}
                                    >
                                        {label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Phone
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+880..."
                            className="mt-1 w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.phone && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.phone}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="partner@example.com"
                            className="mt-1 w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Address
                        </label>
                        <textarea
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Full address..."
                            className="mt-1 w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.address && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.address}
                            </p>
                        )}
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Note
                        </label>
                        <textarea
                            name="note"
                            value={form.note}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Any additional notes..."
                            className="mt-1 w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_active"
                            id="create_is_active"
                            checked={form.is_active}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-indigo-600"
                        />
                        <label
                            htmlFor="create_is_active"
                            className="text-sm font-medium text-gray-700"
                        >
                            Active
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing ? "Creating..." : "Create Partner"}
                    </button>
                </div>
            </div>
        </div>
    );
}
