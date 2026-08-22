// resources/js/Pages/Backend/PreOrders/_components/EditPreOrderModal.tsx

import { AppDateInput } from "@/Components/DatePicker";
import { PreOrder, PreOrderFormData } from "@/types/pre-order";
import { ADVANCE_PAYMENT_METHOD_OPTIONS } from "@/types/pre-order-colors";
import { router } from "@inertiajs/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
    preOrder: PreOrder;
    onClose: () => void;
}

export default function EditPreOrderModal({ preOrder, onClose }: Props) {
    const [form, setForm] = useState<PreOrderFormData>({
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
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // ── Populate form from preOrder prop ──────────────────────────────────────
    useEffect(() => {
        setForm({
            customer_id: preOrder.customer_id,
            customer_name_snapshot: preOrder.customer_name_snapshot,
            customer_phone_snapshot: preOrder.customer_phone_snapshot ?? "",
            product_id: preOrder.product_id,
            product_name_snapshot: preOrder.product_name_snapshot ?? "",
            // date cast returns ISO string — slice to YYYY-MM-DD (Rule 6)
            booking_date: preOrder.booking_date?.slice(0, 10) ?? "",
            expected_delivery_date:
                preOrder.expected_delivery_date?.slice(0, 10) ?? "",
            // decimal fields from Laravel serialize as strings — keep as string for input
            total_amount: String(preOrder.total_amount),
            advance_amount: String(preOrder.advance_amount),
            advance_payment_method: preOrder.advance_payment_method ?? "",
            advance_transaction_id: preOrder.advance_transaction_id ?? "",
            note: preOrder.note ?? "",
        });
    }, [preOrder]);

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

        router.put(
            route("backend.pre-orders.update", preOrder.id),
            form as any,
            {
                onSuccess: () => {
                    toast.success("Pre-order updated successfully.");
                    onClose();
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error("Please fix the errors below.");
                },
                onFinish: () => setSubmitting(false),
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Edit Pre-Order
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {preOrder.customer_name_snapshot}
                        </p>
                    </div>
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
                    </div>

                    {/* Dates */}
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

                    {/* Amounts */}
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
                        {submitting ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
