import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
    Edit2,
    Trash2,
    RotateCcw,
    ExternalLink,
    Tag,
    Image as ImageIcon,
    Eye,
    Calendar,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    Copy,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { BannerItem } from "./BannerModal";

interface Props {
    banners: {
        data: BannerItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: any[];
    };
    onEdit: (banner: BannerItem) => void;
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        restore: boolean;
    };
    isTrashed?: boolean;
}

export default function BannerTable({ banners, onEdit, can, isTrashed }: Props) {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.success(`Coupon code ${code} copied!`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleToggleStatus = (banner: BannerItem) => {
        router.patch(
            route("backend.storefront.banners.toggle-status", banner.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Status updated");
                },
            }
        );
    };

    const handleDelete = (banner: BannerItem) => {
        Swal.fire({
            title: "Delete Banner?",
            text: `Are you sure you want to delete banner "${banner.title}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("backend.storefront.banners.destroy", banner.id),
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast.success("Banner deleted successfully");
                        },
                    }
                );
            }
        });
    };

    const handleRestore = (banner: BannerItem) => {
        router.post(
            route("backend.storefront.banners.restore", banner.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Banner restored successfully");
                },
            }
        );
    };

    const getPlacementBadge = (placement: string) => {
        switch (placement) {
            case "hero_slider":
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                        Hero Slider
                    </span>
                );
            case "promo_strip":
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                        Promo Strip
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-800">
                        Popup / Offer
                    </span>
                );
        }
    };

    const getValidityStatus = (banner: BannerItem) => {
        const now = new Date();
        const starts = banner.starts_at ? new Date(banner.starts_at) : null;
        const expires = banner.expires_at ? new Date(banner.expires_at) : null;

        if (expires && expires < now) {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
                    <XCircle size={11} /> Expired
                </span>
            );
        }
        if (starts && starts > now) {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full">
                    <Calendar size={11} /> Scheduled
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} /> Live
            </span>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/75 dark:bg-gray-850 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            <th className="py-3.5 px-4 w-12 text-center">#</th>
                            <th className="py-3.5 px-4">Banner Preview</th>
                            <th className="py-3.5 px-4">Title & Details</th>
                            <th className="py-3.5 px-4">Placement</th>
                            <th className="py-3.5 px-4">Promo Coupon</th>
                            <th className="py-3.5 px-4 text-center">Order</th>
                            <th className="py-3.5 px-4 text-center">Status</th>
                            <th className="py-3.5 px-4">Validity</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-xs">
                        {banners.data.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-12 text-center text-gray-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="h-12 w-12 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                            <ImageIcon size={24} />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            No storefront banners found
                                        </p>
                                        <p className="text-xs text-gray-400 max-w-sm">
                                            Create promotional hero banners to highlight sales, events, and coupons to storefront visitors.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            banners.data.map((banner, index) => (
                                <tr
                                    key={banner.id}
                                    className="hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors"
                                >
                                    {/* Index */}
                                    <td className="py-3 px-4 text-center font-mono text-gray-400">
                                        {(banners.current_page - 1) * 15 + index + 1}
                                    </td>

                                    {/* Image Thumbnail */}
                                    <td className="py-3 px-4">
                                        <div
                                            onClick={() => setLightboxImage(`/storage/${banner.image_path}`)}
                                            className="relative h-14 w-28 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-900 cursor-pointer group shadow-2xs shrink-0"
                                            title="Click to view full image"
                                        >
                                            <img
                                                src={`/storage/${banner.image_path}`}
                                                alt={banner.title}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                                <Eye size={16} />
                                            </div>
                                        </div>
                                    </td>

                                    {/* Title & Subtitle */}
                                    <td className="py-3 px-4 max-w-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 dark:text-white line-clamp-1">
                                                {banner.title}
                                            </span>
                                            {banner.badge_text && (
                                                <span className="shrink-0 text-[10px] font-extrabold uppercase bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded">
                                                    {banner.badge_text}
                                                </span>
                                            )}
                                        </div>
                                        {banner.subtitle && (
                                            <p className="text-[11px] text-gray-400 dark:text-gray-400 line-clamp-1 mt-0.5">
                                                {banner.subtitle}
                                            </p>
                                        )}
                                        {banner.link_url && (
                                            <a
                                                href={banner.link_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                                            >
                                                <span>CTA: {banner.button_text || "Shop"}</span>
                                                <ExternalLink size={9} />
                                            </a>
                                        )}
                                    </td>

                                    {/* Placement */}
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        {getPlacementBadge(banner.placement)}
                                    </td>

                                    {/* Coupon Code */}
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        {banner.coupon_code ? (
                                            <button
                                                onClick={() => handleCopy(banner.coupon_code!)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition"
                                                title="Click to copy coupon code"
                                            >
                                                <Tag size={12} />
                                                <span>{banner.coupon_code}</span>
                                                {copiedCode === banner.coupon_code ? (
                                                    <Check size={12} className="text-emerald-600" />
                                                ) : (
                                                    <Copy size={11} className="text-emerald-500 opacity-60" />
                                                )}
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-xs">—</span>
                                        )}
                                    </td>

                                    {/* Sort Order */}
                                    <td className="py-3 px-4 text-center font-mono font-bold text-gray-600 dark:text-gray-300">
                                        {banner.sort_order}
                                    </td>

                                    {/* Active Toggle */}
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(banner)}
                                            disabled={!can.edit || isTrashed}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                banner.is_active
                                                    ? "bg-emerald-500"
                                                    : "bg-gray-300 dark:bg-gray-600"
                                            } ${!can.edit ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                                    banner.is_active ? "translate-x-4" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </td>

                                    {/* Validity Status */}
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        {getValidityStatus(banner)}
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {isTrashed ? (
                                                can.restore && (
                                                    <button
                                                        onClick={() => handleRestore(banner)}
                                                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                                                        title="Restore Banner"
                                                    >
                                                        <RotateCcw size={15} />
                                                    </button>
                                                )
                                            ) : (
                                                <>
                                                    {can.edit && (
                                                        <button
                                                            onClick={() => onEdit(banner)}
                                                            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                                            title="Edit Banner"
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                    )}
                                                    {can.delete && (
                                                        <button
                                                            onClick={() => handleDelete(banner)}
                                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                                                            title="Delete Banner"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div
                    onClick={() => setLightboxImage(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out animate-in fade-in"
                >
                    <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                        <img
                            src={lightboxImage}
                            alt="Full View"
                            className="max-h-[85vh] w-auto object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
