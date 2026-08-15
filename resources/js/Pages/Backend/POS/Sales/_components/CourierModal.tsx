// resources/js/Pages/Backend/POS/Sales/_components/CourierModal.tsx

import { router } from "@inertiajs/react";
import { Truck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    COURIER_STATUS_OPTIONS,
    type CourierStatus,
    type Sale,
} from "../Index";

interface Props {
    sale: Sale;
    onClose: () => void;
}

interface FormData {
    courier_provider: string;
    courier_tracking_id: string;
    courier_status: CourierStatus | "";
    courier_note: string;
}

interface FormErrors {
    courier_provider?: string;
    courier_tracking_id?: string;
    courier_status?: string;
    courier_note?: string;
}

const requiresDelivery = (deliveryType: Sale["delivery_type"]) =>
    deliveryType === "inside_dhaka" ||
    deliveryType === "outside_dhaka" ||
    deliveryType === "parallel";

export default function CourierModal({ sale, onClose }: Props) {
    const [form, setForm] = useState<FormData>({
        courier_provider: sale.courier_provider ?? "",
        courier_tracking_id: sale.courier_tracking_id ?? "",
        courier_status: (sale.courier_status ?? "") as CourierStatus | "",
        courier_note: sale.courier_note ?? "",
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [processing, setProcessing] = useState(false);

    // Pre-fill walk_in status for store_pickup deliveries
    useEffect(() => {
        if (sale.delivery_type === "store_pickup" && !sale.courier_status) {
            setForm((prev) => ({ ...prev, courier_status: "walk_in" }));
        }
    }, [sale.delivery_type, sale.courier_status]);

    const isRequired = requiresDelivery(sale.delivery_type);
    const isEdit = !!sale.courier_provider || !!sale.courier_status;

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = () => {
        // Client-side guard for required fields
        const newErrors: FormErrors = {};
        if (isRequired && !form.courier_provider.trim()) {
            newErrors.courier_provider = "Courier provider is required.";
        }
        if (isRequired && !form.courier_status) {
            newErrors.courier_status = "Courier status is required.";
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setProcessing(true);

        router.post(
            route("backend.pos.sales.update-courier", sale.id),
            {
                courier_provider: form.courier_provider || null,
                courier_tracking_id: form.courier_tracking_id || null,
                courier_status: form.courier_status || null,
                courier_note: form.courier_note || null,
            },
            {
                onSuccess: () => {
                    toast.success("Courier info updated successfully.");
                    onClose();
                },
                onError: (errs) => {
                    setErrors(errs as FormErrors);
                    toast.error("Please fix the errors and try again.");
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    // Close on backdrop click
    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={handleBackdrop}
        >
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* ── Header ── */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <Truck size={16} className="text-indigo-600" />
                        <div>
                            <h2 className="text-sm font-semibold text-gray-800">
                                {isEdit
                                    ? "Edit Courier Info"
                                    : "Add Courier Info"}
                            </h2>
                            <p className="text-xs text-gray-400">
                                {sale.reference_no}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="space-y-4 px-5 py-4">
                    {/* Courier Provider */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Courier Provider
                            {isRequired && (
                                <span className="ml-1 text-red-500">*</span>
                            )}
                        </label>
                        <input
                            type="text"
                            name="courier_provider"
                            value={form.courier_provider}
                            onChange={handleChange}
                            placeholder="e.g. Pathao, Redx, SA Paribahan"
                            className={`w-full rounded-md border px-3 py-2 text-sm
                                focus:outline-none focus:ring-1 focus:ring-indigo-500
                                ${
                                    errors.courier_provider
                                        ? "border-red-400 focus:border-red-400"
                                        : "border-gray-300 focus:border-indigo-500"
                                }`}
                        />
                        {errors.courier_provider && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.courier_provider}
                            </p>
                        )}
                    </div>

                    {/* Tracking ID */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Tracking ID
                            <span className="ml-1 text-gray-400">
                                (optional)
                            </span>
                        </label>
                        <input
                            type="text"
                            name="courier_tracking_id"
                            value={form.courier_tracking_id}
                            onChange={handleChange}
                            placeholder="e.g. PTH-202608-00123"
                            className={`w-full rounded-md border px-3 py-2 text-sm
                                focus:outline-none focus:ring-1 focus:ring-indigo-500
                                ${
                                    errors.courier_tracking_id
                                        ? "border-red-400 focus:border-red-400"
                                        : "border-gray-300 focus:border-indigo-500"
                                }`}
                        />
                        {errors.courier_tracking_id && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.courier_tracking_id}
                            </p>
                        )}
                    </div>

                    {/* Courier Status */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Courier Status
                            {isRequired && (
                                <span className="ml-1 text-red-500">*</span>
                            )}
                        </label>
                        <select
                            name="courier_status"
                            value={form.courier_status}
                            onChange={handleChange}
                            className={`w-full rounded-md border px-3 py-2 text-sm
                                focus:outline-none focus:ring-1 focus:ring-indigo-500
                                ${
                                    errors.courier_status
                                        ? "border-red-400 focus:border-red-400"
                                        : "border-gray-300 focus:border-indigo-500"
                                }`}
                        >
                            <option value="">— Select status —</option>
                            {COURIER_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {errors.courier_status && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.courier_status}
                            </p>
                        )}
                    </div>

                    {/* Courier Note */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Note
                            <span className="ml-1 text-gray-400">
                                (optional)
                            </span>
                        </label>
                        <textarea
                            name="courier_note"
                            value={form.courier_note}
                            onChange={handleChange}
                            placeholder="Any courier-specific remarks..."
                            rows={2}
                            className={`w-full rounded-md border px-3 py-2 text-sm
                                focus:outline-none focus:ring-1 focus:ring-indigo-500
                                ${
                                    errors.courier_note
                                        ? "border-red-400 focus:border-red-400"
                                        : "border-gray-300 focus:border-indigo-500"
                                }`}
                        />
                        {errors.courier_note && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.courier_note}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm
                                   text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2
                                   text-sm font-semibold text-white hover:bg-indigo-700
                                   disabled:opacity-50 transition-colors"
                    >
                        <Truck size={14} />
                        {processing
                            ? "Saving..."
                            : isEdit
                              ? "Update Courier"
                              : "Save Courier Info"}
                    </button>
                </div>
            </div>
        </div>
    );
}
