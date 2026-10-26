import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Image as ImageIcon,
    Plus,
    Search,
    Filter,
    SlidersHorizontal,
    Sparkles,
    Eye,
    Tag,
    X,
    Layout,
} from "lucide-react";
import BannerTable from "./_components/BannerTable";
import BannerModal, { BannerItem } from "./_components/BannerModal";

interface Props {
    banners: {
        data: BannerItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search?: string;
        placement?: string;
        status?: string;
        trashed?: boolean;
    };
    stats: {
        total: number;
        active: number;
        expired: number;
        hero_count: number;
        promo_count: number;
        trashed: number;
    };
    coupons: {
        id: number;
        code: string;
        type: string;
        value: number;
        description?: string;
    }[];
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        restore: boolean;
    };
}

export default function StorefrontBannersIndex({
    banners,
    filters,
    stats,
    coupons,
    can,
}: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [placement, setPlacement] = useState(filters.placement || "");
    const [status, setStatus] = useState(filters.status || "");
    const [trashed, setTrashed] = useState(filters.trashed ? "true" : "false");

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<BannerItem | null>(null);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = (newFilters = {}) => {
        router.get(
            route("backend.storefront.banners.index"),
            {
                search: search || undefined,
                placement: placement || undefined,
                status: status || undefined,
                trashed: trashed === "true" ? "1" : undefined,
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
        setPlacement("");
        setStatus("");
        setTrashed("false");
        router.get(route("backend.storefront.banners.index"));
    };

    const handleOpenCreate = () => {
        setSelectedBanner(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (banner: BannerItem) => {
        setSelectedBanner(banner);
        setModalOpen(true);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Storefront Banners & Promotions" />

            <div className="space-y-6 pb-12">
                {/* Executive Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                <SlidersHorizontal size={22} />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
                                    Storefront CMS & Banners
                                </h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Control homepage hero carousel sliders, promotional strips, and coupon discount highlights
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <a
                            href={route("public.home")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                        >
                            <Eye size={15} />
                            Preview Store
                        </a>

                        {can.create && (
                            <button
                                onClick={handleOpenCreate}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition"
                            >
                                <Plus size={16} />
                                Add New Banner
                            </button>
                        )}
                    </div>
                </div>

                {/* 4 KPI Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Total Banners */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Total Banners
                            </span>
                            <span className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <ImageIcon size={16} />
                            </span>
                        </div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                            {stats.total}
                        </p>
                    </div>

                    {/* 2. Active Online */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Active Online
                            </span>
                            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                                <Sparkles size={16} />
                            </span>
                        </div>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                            {stats.active}
                        </p>
                    </div>

                    {/* 3. Hero Sliders */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Hero Sliders
                            </span>
                            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                                <Layout size={16} />
                            </span>
                        </div>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                            {stats.hero_count}
                        </p>
                    </div>

                    {/* 4. Promo Strips */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Promo Strips
                            </span>
                            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                                <Tag size={16} />
                            </span>
                        </div>
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                            {stats.promo_count}
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center"
                    >
                        {/* Search */}
                        <div className="lg:col-span-4 relative">
                            <Search
                                size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by title, subtitle, or coupon..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 outline-none"
                            />
                        </div>

                        {/* Placement */}
                        <div className="lg:col-span-3">
                            <select
                                value={placement}
                                onChange={(e) => {
                                    setPlacement(e.target.value);
                                    applyFilters({ placement: e.target.value || undefined });
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                            >
                                <option value="">All Placements</option>
                                <option value="hero_slider">Hero Slider</option>
                                <option value="promo_strip">Promo Strip</option>
                                <option value="popup_banner">Popup / Offer Card</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div className="lg:col-span-2">
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    applyFilters({ status: e.target.value || undefined });
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active Online</option>
                                <option value="inactive">Draft / Inactive</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>

                        {/* Trashed */}
                        <div className="lg:col-span-2">
                            <select
                                value={trashed}
                                onChange={(e) => {
                                    setTrashed(e.target.value);
                                    applyFilters({ trashed: e.target.value === "true" ? "1" : undefined });
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                            >
                                <option value="false">Active Banners</option>
                                <option value="true">Trashed / Deleted ({stats.trashed})</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="lg:col-span-1 flex gap-1.5">
                            <button
                                type="submit"
                                className="flex-1 rounded-xl bg-gray-900 dark:bg-gray-700 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition"
                                title="Apply filters"
                            >
                                <Filter size={14} className="mx-auto" />
                            </button>
                            {(search || placement || status || trashed === "true") && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                                    title="Reset filters"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Table */}
                <BannerTable
                    banners={banners}
                    onEdit={handleOpenEdit}
                    can={can}
                    isTrashed={trashed === "true"}
                />

                {/* Banner Modal */}
                <BannerModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    banner={selectedBanner}
                    coupons={coupons}
                />
            </div>
        </AuthenticatedLayout>
    );
}
