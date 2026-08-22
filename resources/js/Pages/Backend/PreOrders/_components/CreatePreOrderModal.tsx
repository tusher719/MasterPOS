// resources/js/Pages/Backend/PreOrders/_components/CreatePreOrderModal.tsx

import { AppDateInput } from "@/Components/DatePicker";
import { PreOrderFormData } from "@/types/pre-order";
import { ADVANCE_PAYMENT_METHOD_OPTIONS } from "@/types/pre-order-colors";
import { router } from "@inertiajs/react";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    onClose: () => void;
}

const EMPTY_FORM: PreOrderFormData = {
    customer_id: null,
    customer_name_snapshot: "",
    customer_phone_snapshot: "",
    product_id: null,
    product_name_snapshot: "",
    booking_date: "",
    expected_delivery_date: "",
    total_amount: "",
    advance_amount: "0",
    advance_payment_method: "",
    advance_transaction_id: "",
    note: "",
};

export default function CreatePreOrderModal({ onClose }: Props) {
    const [form, setForm] = useState<PreOrderFormData>(EMPTY_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // ── Derived ───────────────────────────────────────────────────────────────
    const dueAmount = Math.max(
        0,
        Number(form.total_amount || 0) - Number(form.advance_amount || 0),
    );

    // ── Handlers ──────────────────────────────────────────────────────────────
    function handleChange(
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    function handleSubmit() {
        // Basic client-side guard
        if (!form.customer_name_snapshot.trim()) {
            setErrors({ customer_name_snapshot: "Customer name is required." });
            return;
        }
        if (!form.booking_date) {
            setErrors({ booking_date: "Booking date is required." });
            return;
        }
        if (!form.total_amount || Number(form.total_amount) <= 0) {
            setErrors({ total_amount: "Total amount must be greater than 0." });
            return;
        }
        if (Number(form.advance_amount) > Number(form.total_amount)) {
            setErrors({
                advance_amount: "Advance cannot exceed total amount.",
            });
            return;
        }

        setSubmitting(true);

        router.post(route("backend.pre-orders.store"), form as any, {
            onSuccess: () => {
                toast.success("Pre-order created successfully.");
                onClose();
            },
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                toast.error("Please fix the errors below.");
            },
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-gray-800">
                        New Pre-Order / Booking
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
                    {/* Customer name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Customer Name{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="customer_name_snapshot"
                            value={form.customer_name_snapshot}
                            onChange={handleChange}
                            placeholder="Enter customer name"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.customer_name_snapshot && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.customer_name_snapshot}
                            </p>
                        )}
                    </div>

                    {/* Customer phone */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Customer Phone
                        </label>
                        <input
                            type="text"
                            name="customer_phone_snapshot"
                            value={form.customer_phone_snapshot}
                            onChange={handleChange}
                            placeholder="01XXXXXXXXX"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.customer_phone_snapshot && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.customer_phone_snapshot}
                            </p>
                        )}
                    </div>

                    {/* Product name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Product / Item Description
                        </label>
                        <input
                            type="text"
                            name="product_name_snapshot"
                            value={form.product_name_snapshot}
                            onChange={handleChange}
                            placeholder="What is the customer ordering?"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.product_name_snapshot && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.product_name_snapshot}
                            </p>
                        )}
                    </div>

                    {/* Dates — 2 col */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Booking Date{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <AppDateInput
                                value={form.booking_date}
                                onChange={(val) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        booking_date: val,
                                    }))
                                }
                                required
                                error={errors.booking_date}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Expected Delivery Date
                            </label>
                            <AppDateInput
                                value={form.expected_delivery_date}
                                onChange={(val) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        expected_delivery_date: val,
                                    }))
                                }
                                minDate={
                                    form.booking_date
                                        ? new Date(form.booking_date)
                                        : undefined
                                }
                                clearable
                                error={errors.expected_delivery_date}
                            />
                        </div>
                    </div>

                    {/* Amounts — 2 col */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Total Amount{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="total_amount"
                                value={form.total_amount}
                                onChange={handleChange}
                                min={0}
                                step="0.01"
                                placeholder="0.00"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.total_amount && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.total_amount}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Advance Amount
                            </label>
                            <input
                                type="number"
                                name="advance_amount"
                                value={form.advance_amount}
                                onChange={handleChange}
                                min={0}
                                step="0.01"
                                placeholder="0.00"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.advance_amount && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.advance_amount}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Due amount — read only */}
                    <div className="rounded-md bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            Due Amount
                        </span>
                        <span className="text-sm font-semibold text-red-600">
                            ৳{dueAmount.toLocaleString()}
                        </span>
                    </div>

                    {/* Advance payment method */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Advance Payment Method
                        </label>
                        <select
                            name="advance_payment_method"
                            value={form.advance_payment_method}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">— Select method —</option>
                            {ADVANCE_PAYMENT_METHOD_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Transaction ID */}
                    {form.advance_payment_method &&
                        form.advance_payment_method !== "cash" && (
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Transaction ID
                                </label>
                                <input
                                    type="text"
                                    name="advance_transaction_id"
                                    value={form.advance_transaction_id}
                                    onChange={handleChange}
                                    placeholder="TrxID / Reference"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        )}

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Note
                        </label>
                        <textarea
                            name="note"
                            value={form.note}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Any special instructions..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {submitting ? "Creating..." : "Create Pre-Order"}
                    </button>
                </div>
            </div>
        </div>
    );
}
