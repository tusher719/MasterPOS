import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, History, User, Receipt, DollarSign, Calendar, Loader2 } from "lucide-react";
import { CouponItem } from "./CouponModal";

interface Props {
    open: boolean;
    coupon: CouponItem | null;
    onClose: () => void;
}

interface UsageRow {
    id: number;
    uuid: string;
    customer_phone: string | null;
    discount_amount: number;
    created_at: string;
    customer?: {
        id: number;
        name: string;
        phone: string;
    } | null;
    sale?: {
        id: number;
        reference_no: string;
        grand_total: number;
        sale_date: string;
    } | null;
}

export default function CouponUsagesModal({ open, coupon, onClose }: Props) {
    const [usages, setUsages] = useState<UsageRow[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && coupon) {
            fetchUsages();
        } else {
            setUsages([]);
        }
    }, [open, coupon]);

    const fetchUsages = async () => {
        if (!coupon) return;
        setLoading(true);
        try {
            const res = await axios.get(route("backend.coupons.usages", coupon.id));
            setUsages(res.data.data ?? []);
        } catch (e) {
            console.error("Failed to load coupon usages", e);
        } finally {
            setLoading(false);
        }
    };

    if (!open || !coupon) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-900/70">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            <History size={18} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                                Redemption History:{" "}
                                <span className="font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md text-xs font-bold">
                                    {coupon.code}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400">
                                {coupon.used_count} total time(s) redeemed
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

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="animate-spin mb-2" size={24} />
                            <p className="text-xs">Loading redemption logs...</p>
                        </div>
                    ) : usages.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Receipt className="mx-auto mb-2 opacity-50" size={32} />
                            <p className="text-sm font-medium">No redemptions yet</p>
                            <p className="text-xs mt-1">This coupon hasn't been redeemed by any customer yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            {usages.map((u) => (
                                <div key={u.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                {u.customer?.name || "Guest Customer"}
                                            </span>
                                            <span className="text-slate-400 font-mono">
                                                ({u.customer?.phone || u.customer_phone || "Walk-in"})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                                            <span className="flex items-center gap-1 font-mono">
                                                <Receipt size={12} className="text-slate-400" />
                                                #{u.sale?.reference_no ?? "Sale"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} className="text-slate-400" />
                                                {new Date(u.created_at).toLocaleString("en-US", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                            -৳{Number(u.discount_amount).toFixed(2)}
                                        </div>
                                        {u.sale && (
                                            <div className="text-[11px] text-slate-400">
                                                Order: ৳{Number(u.sale.grand_total).toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-3 bg-slate-50/70 dark:bg-slate-900/70 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
