import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { X, Sparkles, Tag, Percent, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export interface CouponItem {
    id: number;
    uuid: string;
    code: string;
    description: string | null;
    type: "percent" | "fixed";
    value: number;
    min_order_amount: number | null;
    max_discount_amount: number | null;
    usage_limit: number | null;
    usage_limit_per_customer: number | null;
    used_count: number;
    applicable_to: "all" | "category" | "product";
    applicable_category_ids: number[];
    applicable_product_ids: number[];
    starts_at: string | null;
    expires_at: string | null;
    coupon_stackable: boolean;
    is_active: boolean;
    is_expired?: boolean;
    creator_name?: string;
    created_at?: string;
    deleted_at?: string | null;
    can?: {
        edit: boolean;
        delete: boolean;
        restore: boolean;
    };
}

interface Props {
    open: boolean;
    coupon?: CouponItem | null;
    categories: { id: number; name: string }[];
    products: { id: number; name: string; sku?: string }[];
    onClose: () => void;
}

export default function CouponModal({
    open,
    coupon,
    categories,
    products,
    onClose,
}: Props) {
    const isEdit = !!coupon;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        code: "",
        description: "",
        type: "percent" as "percent" | "fixed",
        value: "" as number | string,
        min_order_amount: "" as number | string,
        max_discount_amount: "" as number | string,
        usage_limit: "" as number | string,
        usage_limit_per_customer: 1 as number | string,
        applicable_to: "all" as "all" | "category" | "product",
        applicable_category_ids: [] as number[],
        applicable_product_ids: [] as number[],
        starts_at: "",
        expires_at: "",
        coupon_stackable: false,
        is_active: true,
    });

    useEffect(() => {
        if (coupon) {
            setData({
                code: coupon.code,
                description: coupon.description ?? "",
                type: coupon.type,
                value: coupon.value,
                min_order_amount: coupon.min_order_amount ?? "",
                max_discount_amount: coupon.max_discount_amount ?? "",
                usage_limit: coupon.usage_limit ?? "",
                usage_limit_per_customer: coupon.usage_limit_per_customer ?? 1,
                applicable_to: coupon.applicable_to,
                applicable_category_ids: coupon.applicable_category_ids ?? [],
                applicable_product_ids: coupon.applicable_product_ids ?? [],
                starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : "",
                expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : "",
                coupon_stackable: coupon.coupon_stackable,
                is_active: coupon.is_active,
            });
        } else {
            reset();
        }
        clearErrors();
    }, [coupon, open]);

    if (!open) return null;

    const generateRandomCode = () => {
        const prefixes = ["SAVE", "OFF", "SUPER", "DEAL", "PROMO", "SPECIAL"];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const num = Math.floor(10 + Math.random() * 90);
        setData("code", `${prefix}${num}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit) {
            put(route("backend.coupons.update", coupon.id), {
                onSuccess: () => {
                    toast.success("Coupon updated successfully!");
                    onClose();
                },
            });
        } else {
            post(route("backend.coupons.store"), {
                onSuccess: () => {
                    toast.success("Coupon created successfully!");
                    onClose();
                },
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-900/70">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            <Tag size={18} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                                {isEdit ? "Edit Coupon" : "Create New Coupon"}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {isEdit ? `Updating promo code ${coupon?.code}` : "Configure promotional discount rules"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Code & Auto-generator */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Coupon Code <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={data.code}
                                    onChange={(e) => setData("code", e.target.value.toUpperCase())}
                                    placeholder="e.g. EID2026"
                                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-mono uppercase tracking-wider text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={generateRandomCode}
                                    title="Generate random code"
                                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-medium flex items-center gap-1 transition-colors"
                                >
                                    <Sparkles size={14} className="text-amber-500" />
                                    Gen
                                </button>
                            </div>
                            {errors.code && <p className="text-xs text-rose-500 mt-1">{errors.code}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Discount Type <span className="text-rose-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setData("type", "percent")}
                                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                                        data.type === "percent"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                                    }`}
                                >
                                    <Percent size={14} /> Percentage (%)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData("type", "fixed")}
                                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                                        data.type === "fixed"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                                    }`}
                                >
                                    <DollarSign size={14} /> Fixed Amount (৳)
                                </button>
                            </div>
                            {errors.type && <p className="text-xs text-rose-500 mt-1">{errors.type}</p>}
                        </div>
                    </div>

                    {/* Value, Min Order, Max Cap */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Discount Value <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={data.value}
                                    onChange={(e) => setData("value", e.target.value)}
                                    placeholder={data.type === "percent" ? "e.g. 15" : "e.g. 200"}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                                    {data.type === "percent" ? "%" : "৳"}
                                </span>
                            </div>
                            {errors.value && <p className="text-xs text-rose-500 mt-1">{errors.value}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Min Order Amount (৳)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.min_order_amount}
                                onChange={(e) => setData("min_order_amount", e.target.value)}
                                placeholder="Optional (e.g. 500)"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                            {errors.min_order_amount && <p className="text-xs text-rose-500 mt-1">{errors.min_order_amount}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Max Discount Cap (৳)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.max_discount_amount}
                                onChange={(e) => setData("max_discount_amount", e.target.value)}
                                placeholder={data.type === "percent" ? "Optional (e.g. 300)" : "N/A for fixed"}
                                disabled={data.type === "fixed"}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                            />
                            {errors.max_discount_amount && <p className="text-xs text-rose-500 mt-1">{errors.max_discount_amount}</p>}
                        </div>
                    </div>

                    {/* Usage Limits */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Total Usage Limit
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={data.usage_limit}
                                onChange={(e) => setData("usage_limit", e.target.value)}
                                placeholder="Unlimited if blank (e.g. 100)"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                            {errors.usage_limit && <p className="text-xs text-rose-500 mt-1">{errors.usage_limit}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Usage Limit Per Customer
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={data.usage_limit_per_customer}
                                onChange={(e) => setData("usage_limit_per_customer", e.target.value)}
                                placeholder="e.g. 1 (Default)"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                            {errors.usage_limit_per_customer && <p className="text-xs text-rose-500 mt-1">{errors.usage_limit_per_customer}</p>}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Starts At (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={data.starts_at}
                                onChange={(e) => setData("starts_at", e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                            {errors.starts_at && <p className="text-xs text-rose-500 mt-1">{errors.starts_at}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Expires At (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={data.expires_at}
                                onChange={(e) => setData("expires_at", e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                            {errors.expires_at && <p className="text-xs text-rose-500 mt-1">{errors.expires_at}</p>}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Description / Customer Note (Optional)
                        </label>
                        <textarea
                            rows={2}
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                            placeholder="e.g. Special 15% discount for Eid campaign on all items"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description}</p>}
                    </div>

                    {/* Toggles */}
                    <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData("is_active", e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Active (Ready for customer redemption)
                            </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.coupon_stackable}
                                onChange={(e) => setData("coupon_stackable", e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Stackable with item discounts
                            </span>
                        </label>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-semibold text-white transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
                        >
                            {processing ? "Saving..." : isEdit ? "Update Coupon" : "Create Coupon"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
