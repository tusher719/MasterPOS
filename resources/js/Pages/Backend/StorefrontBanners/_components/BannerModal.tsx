import React, { useState, useEffect } from "react";
import { router, useForm } from "@inertiajs/react";
import { X, Upload, Sparkles, Image as ImageIcon, Link as LinkIcon, Tag, Calendar, Palette } from "lucide-react";
import { toast } from "sonner";

export interface BannerItem {
    id: number;
    uuid: string;
    title: string;
    subtitle: string | null;
    badge_text: string | null;
    image_path: string;
    link_url: string | null;
    button_text: string | null;
    coupon_code: string | null;
    placement: "hero_slider" | "promo_strip" | "popup_banner";
    bg_color: string | null;
    sort_order: number;
    is_active: boolean;
    starts_at: string | null;
    expires_at: string | null;
}

interface CouponOption {
    id: number;
    code: string;
    type: string;
    value: number;
    description?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    banner: BannerItem | null;
    coupons: CouponOption[];
}

export default function BannerModal({ isOpen, onClose, banner, coupons }: Props) {
    if (!isOpen) return null;

    const [imagePreview, setImagePreview] = useState<string | null>(
        banner ? `/storage/${banner.image_path}` : null
    );

    const { data, setData, post, processing, errors, reset } = useForm<{
        title: string;
        subtitle: string;
        badge_text: string;
        image: File | null;
        link_url: string;
        button_text: string;
        coupon_code: string;
        placement: "hero_slider" | "promo_strip" | "popup_banner";
        bg_color: string;
        sort_order: number;
        is_active: boolean;
        starts_at: string;
        expires_at: string;
        _method?: string;
    }>({
        title: banner?.title || "",
        subtitle: banner?.subtitle || "",
        badge_text: banner?.badge_text || "",
        image: null,
        link_url: banner?.link_url || "",
        button_text: banner?.button_text || "Shop Now",
        coupon_code: banner?.coupon_code || "",
        placement: banner?.placement || "hero_slider",
        bg_color: banner?.bg_color || "#111827",
        sort_order: banner?.sort_order ?? 0,
        is_active: banner ? banner.is_active : true,
        starts_at: banner?.starts_at ? banner.starts_at.slice(0, 16) : "",
        expires_at: banner?.expires_at ? banner.expires_at.slice(0, 16) : "",
    });

    useEffect(() => {
        if (banner) {
            setData({
                title: banner.title,
                subtitle: banner.subtitle || "",
                badge_text: banner.badge_text || "",
                image: null,
                link_url: banner.link_url || "",
                button_text: banner.button_text || "Shop Now",
                coupon_code: banner.coupon_code || "",
                placement: banner.placement,
                bg_color: banner.bg_color || "#111827",
                sort_order: banner.sort_order,
                is_active: banner.is_active,
                starts_at: banner.starts_at ? banner.starts_at.slice(0, 16) : "",
                expires_at: banner.expires_at ? banner.expires_at.slice(0, 16) : "",
            });
            setImagePreview(`/storage/${banner.image_path}`);
        } else {
            reset();
            setImagePreview(null);
        }
    }, [banner]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData("image", file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (banner) {
            // Update using router.post with _method=PUT to support multipart file upload
            router.post(
                route("backend.storefront.banners.update", banner.id),
                {
                    ...data,
                    _method: "PUT",
                },
                {
                    forceFormData: true,
                    onSuccess: () => {
                        toast.success("Banner updated successfully");
                        onClose();
                    },
                    onError: () => {
                        toast.error("Failed to update banner. Check input fields.");
                    },
                }
            );
        } else {
            // Create
            post(route("backend.storefront.banners.store"), {
                forceFormData: true,
                onSuccess: () => {
                    toast.success("Banner created successfully");
                    onClose();
                },
                onError: () => {
                    toast.error("Failed to create banner. Check input fields.");
                },
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden my-8">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-850">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                {banner ? "Edit Storefront Banner" : "New Storefront Banner"}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Configure hero sliders, promotional strips, and coupon highlights
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
                    {/* Image Upload & Live Preview */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            Banner Image {!banner && <span className="text-red-500">*</span>}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                            {imagePreview ? (
                                <div className="relative h-28 w-48 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0 bg-gray-900 shadow-xs group">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <label
                                            htmlFor="banner-file-input"
                                            className="cursor-pointer text-[11px] font-semibold text-white bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-xs hover:bg-black/80"
                                        >
                                            Change
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label
                                    htmlFor="banner-file-input"
                                    className="h-28 w-48 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition shrink-0"
                                >
                                    <Upload size={22} className="text-gray-400" />
                                    <span className="text-xs font-medium text-gray-500">Upload Banner</span>
                                    <span className="text-[10px] text-gray-400">Max 4MB (JPG, PNG, WebP)</span>
                                </label>
                            )}

                            <div className="flex-1 space-y-2">
                                <input
                                    id="banner-file-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Recommended resolution: <strong>1600 × 500 px</strong> for Hero Slider, <strong>1200 × 300 px</strong> for Promotional Strip.
                                </p>
                                {imagePreview && (
                                    <label
                                        htmlFor="banner-file-input"
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                    >
                                        <Upload size={14} /> Choose different image
                                    </label>
                                )}
                                {errors.image && (
                                    <p className="text-xs text-red-600 dark:text-red-400">{errors.image}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Title & Badge */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Headline Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={data.title}
                                onChange={(e) => setData("title", e.target.value)}
                                placeholder="e.g. Mega Clearance Sale"
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                            {errors.title && (
                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.title}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Badge Pill (Optional)
                            </label>
                            <input
                                type="text"
                                value={data.badge_text}
                                onChange={(e) => setData("badge_text", e.target.value)}
                                placeholder="e.g. 50% OFF"
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Subtitle */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Subtitle / Description
                        </label>
                        <input
                            type="text"
                            value={data.subtitle}
                            onChange={(e) => setData("subtitle", e.target.value)}
                            placeholder="e.g. Grab top electronics, accessories, and new arrivals at discount prices."
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Placement, Button Text & Link */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Placement <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.placement}
                                onChange={(e) =>
                                    setData("placement", e.target.value as any)
                                }
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            >
                                <option value="hero_slider">Hero Slider (Main Carousel)</option>
                                <option value="promo_strip">Promotional Strip (Mid Page)</option>
                                <option value="popup_banner">Popup / Offer Card</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Button Text
                            </label>
                            <input
                                type="text"
                                value={data.button_text}
                                onChange={(e) => setData("button_text", e.target.value)}
                                placeholder="Shop Now"
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Link URL (Optional)
                            </label>
                            <input
                                type="text"
                                value={data.link_url}
                                onChange={(e) => setData("link_url", e.target.value)}
                                placeholder="/products or /categories/..."
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Linked Coupon & Sort Order */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                <Tag size={13} className="text-emerald-600" />
                                <span>Highlight Promo Code</span>
                            </label>
                            <select
                                value={data.coupon_code}
                                onChange={(e) => setData("coupon_code", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                            >
                                <option value="">-- No Coupon Linked --</option>
                                {coupons.map((c) => (
                                    <option key={c.id} value={c.code}>
                                        {c.code} ({c.type === "percent" ? `${c.value}% OFF` : `৳${c.value} OFF`})
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-[11px] text-gray-400">
                                Displays a 1-click copy coupon badge on the banner.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Sort Order (Priority)
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={data.sort_order}
                                onChange={(e) => setData("sort_order", parseInt(e.target.value) || 0)}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                            <p className="mt-1 text-[11px] text-gray-400">
                                0 appears first. Higher numbers appear later.
                            </p>
                        </div>
                    </div>

                    {/* Date Schedule */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                <Calendar size={13} className="text-gray-400" />
                                Starts At (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={data.starts_at}
                                onChange={(e) => setData("starts_at", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                <Calendar size={13} className="text-gray-400" />
                                Expires At (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={data.expires_at}
                                onChange={(e) => setData("expires_at", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData("is_active", e.target.checked)}
                                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <div>
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    Publish Immediately
                                </span>
                                <span className="block text-xs text-gray-400">
                                    When checked, banner will be visible to online visitors immediately.
                                </span>
                            </div>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {processing && <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {banner ? "Save Changes" : "Create Banner"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
