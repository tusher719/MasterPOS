import { useForm } from "@inertiajs/react";
import { X } from "lucide-react";

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string;
    opening_balance: string;
    is_active: boolean;
    deleted_at: string | null;
    created_at: string;
}

interface Props {
    mode: "create" | "edit";
    customer: Customer | null;
    onClose: () => void;
}

interface FormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    opening_balance: string;
    is_active: boolean;
    [key: string]: string | boolean;
}

export default function CustomerModal({ mode, customer, onClose }: Props) {
    const { data, setData, post, put, processing, errors, reset } =
        useForm<FormData>({
            name: customer?.name ?? "",
            email: customer?.email ?? "",
            phone: customer?.phone ?? "",
            address: customer?.address ?? "",
            city: customer?.city ?? "",
            country: customer?.country ?? "Bangladesh",
            opening_balance: customer?.opening_balance ?? "0",
            is_active: customer?.is_active ?? true,
        });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (mode === "create") {
            post(route("backend.customers.store"), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            put(route("backend.customers.update", customer!.id), {
                preserveScroll: true,
                onSuccess: () => onClose(),
            });
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-gray-800">
                        {mode === "create" ? "Add Customer" : "Edit Customer"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 px-5 py-4 max-h-[70vh] overflow-y-auto">
                        {/* Name */}
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
                                placeholder="Full name"
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Email */}
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

                        {/* Phone */}
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

                        {/* City + Country */}
                        <div className="grid grid-cols-2 gap-3">
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
                                    Country{" "}
                                    <span className="text-red-500">*</span>
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

                        {/* Address */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Address
                            </label>
                            <textarea
                                value={data.address}
                                onChange={(e) =>
                                    setData("address", e.target.value)
                                }
                                rows={2}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Street address..."
                            />
                            {errors.address && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.address}
                                </p>
                            )}
                        </div>

                        {/* Opening Balance */}
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

                        {/* Status Toggle */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    Active Status
                                </p>
                                <p className="text-xs text-gray-400">
                                    Customer can be used in sales
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setData("is_active", !data.is_active)
                                }
                                className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {processing
                                ? mode === "create"
                                    ? "Creating..."
                                    : "Saving..."
                                : mode === "create"
                                  ? "Create Customer"
                                  : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
