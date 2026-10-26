import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Tag,
    Plus,
    Search,
    Filter,
    Percent,
    Ticket,
    History,
    DollarSign,
    CheckCircle2,
    X,
} from "lucide-react";
import CouponTable from "./_components/CouponTable";
import CouponModal, { CouponItem } from "./_components/CouponModal";
import CouponUsagesModal from "./_components/CouponUsagesModal";

interface Props {
    coupons: {
        data: CouponItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search?: string;
        status?: string;
        type?: string;
        trashed?: string;
    };
    stats: {
        total: number;
        active: number;
        total_usages: number;
        total_discount_given: number;
    };
    categories: { id: number; name: string }[];
    products: { id: number; name: string; sku?: string }[];
    can: {
        create: boolean;
    };
}

export default function CouponIndex({
    coupons,
    filters,
    stats,
    categories,
    products,
    can,
}: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");
    const [type, setType] = useState(filters.type || "");
    const [trashed, setTrashed] = useState(filters.trashed || "without");

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);

    const [usagesModalOpen, setUsagesModalOpen] = useState(false);
    const [usageCoupon, setUsageCoupon] = useState<CouponItem | null>(null);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = (newFilters = {}) => {
        router.get(
            route("backend.coupons.index"),
            {
                search,
                status,
                type,
                trashed,
                ...newFilters,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleClearFilters = () => {
        setSearch("");
        setStatus("");
        setType("");
        setTrashed("without");
        router.get(route("backend.coupons.index"));
    };

    const handleOpenCreate = () => {
        setSelectedCoupon(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (coupon: CouponItem) => {
        setSelectedCoupon(coupon);
        setModalOpen(true);
    };

    const handleOpenUsages = (coupon: CouponItem) => {
        setUsageCoupon(coupon);
        setUsagesModalOpen(true);
    };

    const hasActiveFilters = !!search || !!status || !!type || trashed !== "without";

    return (
        <AuthenticatedLayout>
            <Head title="Coupons & Discounts - MasterPOS" />

            <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
                            <Ticket size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Coupons & Promo Codes
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Create and manage discount codes for POS terminal and online storefront
                            </p>
                        </div>
                    </div>

                    {can.create && (
                        <button
                            type="button"
                            onClick={handleOpenCreate}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors shadow-md shadow-indigo-600/20"
                        >
                            <Plus size={16} />
                            New Coupon
                        </button>
                    )}
                </div>

                {/* ── KPI Summary Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                            <span>Total Coupons</span>
                            <Ticket size={16} className="text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                            {stats.total}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">All promo campaigns</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                            <span>Active Coupons</span>
                            <CheckCircle2 size={16} className="text-emerald-500" />
                        </div>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            {stats.active}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">Available for checkout</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                            <span>Total Redemptions</span>
                            <History size={16} className="text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                            {stats.total_usages}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">Customer checkouts</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                            <span>Discount Given</span>
                            <DollarSign size={16} className="text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                            ৳{stats.total_discount_given.toFixed(2)}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">Total revenue saved</p>
                    </div>
                </div>

                {/* ── Filter Bar ── */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-xs space-y-3">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by coupon code or description..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active Now</option>
                                <option value="inactive">Inactive</option>
                                <option value="expired">Expired</option>
                            </select>

                            <select
                                value={type}
                                onChange={(e) => {
                                    setType(e.target.value);
                                    applyFilters({ type: e.target.value });
                                }}
                                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500"
                            >
                                <option value="">All Types</option>
                                <option value="percent">Percentage (%)</option>
                                <option value="fixed">Fixed (৳)</option>
                            </select>

                            <select
                                value={trashed}
                                onChange={(e) => {
                                    setTrashed(e.target.value);
                                    applyFilters({ trashed: e.target.value });
                                }}
                                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500"
                            >
                                <option value="without">Active Only</option>
                                <option value="with">With Trashed</option>
                                <option value="only">Trashed Only</option>
                            </select>

                            <button
                                type="submit"
                                className="rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white px-4 py-2 text-xs font-semibold transition-colors"
                            >
                                Search
                            </button>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Clear filters"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* ── Coupons Table ── */}
                <CouponTable
                    coupons={coupons}
                    onEdit={handleOpenEdit}
                    onViewUsages={handleOpenUsages}
                />

                {/* ── Pagination ── */}
                {coupons.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-slate-500">
                        <p>
                            Showing {(coupons.current_page - 1) * coupons.per_page + 1} to{" "}
                            {Math.min(coupons.current_page * coupons.per_page, coupons.total)} of{" "}
                            {coupons.total} coupons
                        </p>
                        <div className="flex gap-1 flex-wrap">
                            {coupons.links.map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                    disabled={!link.url}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                        link.active
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Create / Edit Modal ── */}
            <CouponModal
                open={modalOpen}
                coupon={selectedCoupon}
                categories={categories}
                products={products}
                onClose={() => setModalOpen(false)}
            />

            {/* ── Redemptions History Modal ── */}
            <CouponUsagesModal
                open={usagesModalOpen}
                coupon={usageCoupon}
                onClose={() => setUsagesModalOpen(false)}
            />
        </AuthenticatedLayout>
    );
}
