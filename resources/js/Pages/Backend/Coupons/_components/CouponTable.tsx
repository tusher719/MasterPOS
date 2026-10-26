import React from "react";
import { Link, router } from "@inertiajs/react";
import {
    Copy,
    Edit,
    Trash2,
    RotateCcw,
    History,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Calendar,
    Tag,
} from "lucide-react";
import { toast } from "sonner";
import { CouponItem } from "./CouponModal";

interface Props {
    coupons: {
        data: CouponItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: any[];
    };
    onEdit: (coupon: CouponItem) => void;
    onViewUsages: (coupon: CouponItem) => void;
}

export default function CouponTable({ coupons, onEdit, onViewUsages }: Props) {
    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success(`Coupon "${code}" copied to clipboard!`);
    };

    const handleToggleStatus = (coupon: CouponItem) => {
        router.patch(
            route("backend.coupons.toggle-status", coupon.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Coupon ${coupon.code} status updated.`),
            }
        );
    };

    const handleDelete = (coupon: CouponItem) => {
        if (!confirm(`Are you sure you want to move coupon "${coupon.code}" to trash?`)) return;
        router.delete(route("backend.coupons.destroy", coupon.id), {
            preserveScroll: true,
            onSuccess: () => toast.success(`Coupon ${coupon.code} moved to trash.`),
        });
    };

    const handleRestore = (coupon: CouponItem) => {
        router.post(route("backend.coupons.restore", coupon.id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Coupon ${coupon.code} restored from trash.`),
        });
    };

    if (coupons.data.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
                <Tag size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    No coupons found
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Try adjusting your filters, or click "New Coupon" to create your first promotional discount.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="px-5 py-3.5">Code & Description</th>
                            <th className="px-5 py-3.5">Discount Value</th>
                            <th className="px-5 py-3.5">Restrictions</th>
                            <th className="px-5 py-3.5">Usage / Limit</th>
                            <th className="px-5 py-3.5">Validity Period</th>
                            <th className="px-5 py-3.5 text-center">Status</th>
                            <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {coupons.data.map((c) => {
                            const isDeleted = !!c.deleted_at;
                            const isExpired = c.is_expired;
                            const usagePct = c.usage_limit
                                ? Math.min(100, Math.round((c.used_count / c.usage_limit) * 100))
                                : null;

                            return (
                                <tr
                                    key={c.id}
                                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                                        isDeleted ? "opacity-60 bg-rose-50/20" : ""
                                    }`}
                                >
                                    {/* Code & Description */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 tracking-wide">
                                                {c.code}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyCode(c.code)}
                                                title="Copy code"
                                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                                            >
                                                <Copy size={13} />
                                            </button>
                                        </div>
                                        {c.description && (
                                            <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5" title={c.description}>
                                                {c.description}
                                            </p>
                                        )}
                                    </td>

                                    {/* Discount Value */}
                                    <td className="px-5 py-3.5">
                                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                                            {c.type === "percent" ? `${c.value}% OFF` : `৳${Number(c.value).toFixed(2)} OFF`}
                                        </span>
                                        {c.max_discount_amount && c.type === "percent" && (
                                            <p className="text-[10px] text-slate-400 font-mono">
                                                Max: ৳{Number(c.max_discount_amount).toFixed(2)}
                                            </p>
                                        )}
                                    </td>

                                    {/* Restrictions */}
                                    <td className="px-5 py-3.5 space-y-0.5 text-[11px]">
                                        {c.min_order_amount ? (
                                            <p className="text-slate-600 dark:text-slate-300 font-mono">
                                                Min: ৳{Number(c.min_order_amount).toFixed(2)}
                                            </p>
                                        ) : (
                                            <p className="text-slate-400">No min amount</p>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <span className="capitalize text-slate-500 text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                {c.applicable_to === "all" ? "All items" : c.applicable_to}
                                            </span>
                                            {c.coupon_stackable && (
                                                <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded font-medium">
                                                    Stackable
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Usage / Limit */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                                {c.used_count}
                                            </span>
                                            <span className="text-slate-400 font-mono">
                                                / {c.usage_limit ?? "∞"}
                                            </span>
                                        </div>
                                        {usagePct !== null && (
                                            <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        usagePct >= 100
                                                            ? "bg-rose-500"
                                                            : usagePct > 70
                                                            ? "bg-amber-500"
                                                            : "bg-indigo-600"
                                                    }`}
                                                    style={{ width: `${usagePct}%` }}
                                                />
                                            </div>
                                        )}
                                    </td>

                                    {/* Validity Period */}
                                    <td className="px-5 py-3.5 text-[11px] space-y-0.5">
                                        {c.starts_at && (
                                            <p className="text-slate-500">
                                                From: {c.starts_at.slice(0, 10)}
                                            </p>
                                        )}
                                        {c.expires_at ? (
                                            <p className={isExpired ? "text-rose-500 font-semibold" : "text-slate-700 dark:text-slate-300"}>
                                                Until: {c.expires_at.slice(0, 10)}
                                            </p>
                                        ) : (
                                            <p className="text-slate-400">No expiry date</p>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-3.5 text-center">
                                        {isDeleted ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                                                Trashed
                                            </span>
                                        ) : isExpired ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                                                Expired
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(c)}
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                                    c.is_active
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-200"
                                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                                                }`}
                                            >
                                                {c.is_active ? (
                                                    <>
                                                        <CheckCircle2 size={11} /> Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle size={11} /> Inactive
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => onViewUsages(c)}
                                                title="View redemptions"
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                                            >
                                                <History size={15} />
                                            </button>

                                            {isDeleted ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRestore(c)}
                                                    title="Restore coupon"
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                                                >
                                                    <RotateCcw size={15} />
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => onEdit(c)}
                                                        title="Edit coupon"
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(c)}
                                                        title="Delete coupon"
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
