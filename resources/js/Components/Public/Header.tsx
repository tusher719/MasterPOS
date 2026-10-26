// resources/js/Components/Public/Header.tsx

import CartDrawer from "@/Components/Public/CartDrawer";
import { useCart } from "@/hooks/useCart";
import { PublicCategory, PublicSettings } from "@/types/public";
import { Link, usePage } from "@inertiajs/react";
import { ChevronRight, Menu, Search, ShoppingBag, Tag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface HeaderProps {
    settings: PublicSettings;
    categories: PublicCategory[];
    cartCount?: number;
}

interface LogoSegment {
    text: string;
    color?: string;
}

function StorefrontLogo({ settings }: { settings: PublicSettings }) {
    const parseSegments = (): LogoSegment[] => {
        try {
            const parsed = JSON.parse(settings.logo_text_segments ?? "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    if (settings.logo_type === "image" && settings.logo_image_path) {
        return (
            <img
                src={`/storage/${settings.logo_image_path}`}
                alt={settings.business_name}
                className="h-9 max-w-[160px] object-contain"
            />
        );
    }

    if (settings.logo_type === "both") {
        const segments = parseSegments();
        return (
            <div className="flex items-center gap-2">
                {settings.logo_image_path && (
                    <img
                        src={`/storage/${settings.logo_image_path}`}
                        alt={settings.business_name}
                        className="h-8 w-8 object-contain"
                    />
                )}
                {segments.length > 0 && (
                    <span className="text-xl font-bold">
                        {segments.map((seg, i) => (
                            <span key={i} style={{ color: seg.color }}>
                                {seg.text}
                            </span>
                        ))}
                    </span>
                )}
            </div>
        );
    }

    const segments = parseSegments();
    if (settings.logo_type === "text" && segments.length > 0) {
        return (
            <span className="text-xl font-bold">
                {segments.map((seg, i) => (
                    <span key={i} style={{ color: seg.color }}>
                        {seg.text}
                    </span>
                ))}
            </span>
        );
    }

    return (
        <span className="text-xl font-bold text-indigo-600">
            {settings.business_name}
        </span>
    );
}

function SearchBar({ className = "" }: { className?: string }) {
    const { settings } = usePage().props as any;
    const currencySymbol = settings?.currency_symbol ?? "৳";

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [related, setRelated] = useState<any[]>([]);
    const [relatedLabel, setRelatedLabel] = useState("");
    const [loading, setLoading] = useState(false);
    const [showDrop, setShowDrop] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target as Node)
            ) {
                setShowDrop(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleChange = (val: string) => {
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (val.trim().length < 2) {
            setResults([]);
            setRelated([]);
            setShowDrop(false);
            return;
        }
        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    route("public.search") +
                        `?q=${encodeURIComponent(val.trim())}`,
                    {
                        headers: {
                            "X-Requested-With": "XMLHttpRequest",
                            Accept: "application/json",
                        },
                    },
                );
                const data = await res.json();
                const hits = data.products?.data ?? [];
                setResults(hits);
                setRelated(data.related ?? []);
                setRelatedLabel(data.related_label ?? "");
                setShowDrop(true);
            } catch {
                setResults([]);
                setRelated([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        setShowDrop(false);
        if (!q) return;
        window.location.href =
            route("public.search") + `?q=${encodeURIComponent(q)}`;
    };

    const goTo = (slug: string) => {
        setShowDrop(false);
        setQuery("");
        window.location.href = route("public.products.show", slug);
    };

    const formatPrice = (price: number) =>
        `${currencySymbol}${Number(price).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

    const hasResults = results.length > 0;
    const hasRelated = related.length > 0;
    const showDropdown = showDrop && (hasResults || hasRelated || loading);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <form onSubmit={handleSubmit}>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={() =>
                        (results.length > 0 || related.length > 0) &&
                        setShowDrop(true)
                    }
                    placeholder="Search products..."
                    className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-5 pr-12
                               text-sm text-gray-800 placeholder-gray-400 outline-none transition
                               focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
                <button
                    type="submit"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                    {loading ? (
                        <span className="block w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
                    ) : (
                        <Search size={16} />
                    )}
                </button>
            </form>

            {/* ── Dropdown ── */}
            {showDropdown && (
                <div
                    className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl
                                border border-gray-100 shadow-xl overflow-hidden"
                >
                    {/* Direct matches — grid */}
                    {hasResults && (
                        <div className="p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                                Results for "{query}"
                            </p>
                            <div className="grid grid-cols-6 gap-3">
                                {results.slice(0, 6).map((p: any) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => goTo(p.slug)}
                                        className="flex flex-col rounded-xl border border-gray-100
                                                   hover:border-indigo-200 hover:shadow-sm transition-all
                                                   overflow-hidden text-left group"
                                    >
                                        {/* Image */}
                                        <div
                                            className="relative w-full bg-gray-50"
                                            style={{ paddingBottom: "80%" }}
                                        >
                                            <div className="absolute inset-0">
                                                {p.primary_image ? (
                                                    <img
                                                        src={`/storage/${p.primary_image}`}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Tag
                                                            size={20}
                                                            className="text-gray-200"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div className="p-2">
                                            <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
                                                {p.name}
                                            </p>
                                            <p className="mt-1 text-xs font-bold text-indigo-600">
                                                {formatPrice(
                                                    Number(p.sale_price),
                                                )}
                                            </p>
                                            {p.stock_qty <= 0 && (
                                                <p className="text-[10px] text-red-400 mt-0.5">
                                                    Out of stock
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Divider */}
                    {hasResults && hasRelated && (
                        <div className="border-t border-gray-100 mx-4" />
                    )}

                    {/* Related / Top products — grid */}
                    {hasRelated && (
                        <div className="p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                                {relatedLabel || "You might also like"}
                            </p>
                            <div className="grid grid-cols-6 gap-3">
                                {related.slice(0, 6).map((p: any) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => goTo(p.slug)}
                                        className="flex flex-col rounded-xl border border-gray-100
                                                   hover:border-indigo-200 hover:shadow-sm transition-all
                                                   overflow-hidden text-left group"
                                    >
                                        <div
                                            className="relative w-full bg-gray-50"
                                            style={{ paddingBottom: "80%" }}
                                        >
                                            <div className="absolute inset-0">
                                                {p.primary_image ? (
                                                    <img
                                                        src={`/storage/${p.primary_image}`}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Tag
                                                            size={20}
                                                            className="text-gray-200"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
                                                {p.name}
                                            </p>
                                            <p className="mt-1 text-xs font-bold text-indigo-600">
                                                {formatPrice(
                                                    Number(p.sale_price),
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No results */}
                    {!loading && !hasResults && !hasRelated && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm text-gray-500">
                                No products found for "
                                <span className="font-medium text-gray-700">
                                    {query}
                                </span>
                                "
                            </p>
                        </div>
                    )}

                    {/* Footer — view all */}
                    {hasResults && (
                        <div className="border-t border-gray-100">
                            <a
                                href={
                                    route("public.search") +
                                    `?q=${encodeURIComponent(query)}`
                                }
                                className="flex items-center justify-center gap-1.5 py-3 text-xs
                                           font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                                View all results for "{query}"
                                <span className="text-gray-400">→</span>
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function MobileDrawer({
    open,
    onClose,
    categories,
    settings,
}: {
    open: boolean;
    onClose: () => void;
    categories: PublicCategory[];
    settings: PublicSettings;
}) {
    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-[60] bg-black/50"
                onClick={onClose}
            />
            <div className="fixed inset-y-0 left-0 z-[70] flex w-72 flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
                    <StorefrontLogo settings={settings} />
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Mobile search */}
                <div className="border-b border-gray-100 px-4 py-3">
                    <SearchBar />
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                    <Link
                        href={route("public.home")}
                        onClick={onClose}
                        className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    >
                        Home
                    </Link>
                    <Link
                        href={route("public.products.index")}
                        onClick={onClose}
                        className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    >
                        All Products
                    </Link>
                    <Link
                        href={route("public.track-order")}
                        onClick={onClose}
                        className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    >
                        Track Order
                    </Link>

                    {categories.length > 0 && (
                        <>
                            <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Categories
                            </p>
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={route(
                                        "public.categories.show",
                                        cat.slug,
                                    )}
                                    onClick={onClose}
                                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                                >
                                    <span>{cat.name}</span>
                                    <ChevronRight
                                        size={14}
                                        className="text-gray-400"
                                    />
                                </Link>
                            ))}
                        </>
                    )}
                </nav>
            </div>
        </>
    );
}

export default function Header({
    settings,
    categories,
    cartCount: propCartCount = 0,
}: HeaderProps) {
    const { cartCount: liveCartCount } = useCart();
    const effectiveCartCount = liveCartCount || propCartCount;

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);

    // Listen for custom open-cart event
    useEffect(() => {
        const handleOpenCart = () => setCartDrawerOpen(true);
        window.addEventListener("masterpos:open-cart", handleOpenCart);
        return () => window.removeEventListener("masterpos:open-cart", handleOpenCart);
    }, []);

    // Close drawer on resize to desktop
    useEffect(() => {
        const handler = () => {
            if (window.innerWidth >= 768) setDrawerOpen(false);
        };
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    return (
        <>
            <header
                ref={headerRef}
                className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm"
            >
                {/* Main navbar */}
                <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center gap-4">
                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
                        >
                            <Menu size={22} />
                        </button>

                        {/* Logo */}
                        <Link href={route("public.home")} className="shrink-0">
                            <StorefrontLogo settings={settings} />
                        </Link>

                        {/* Desktop search — takes remaining space */}
                        <div className="hidden flex-1 md:block">
                            <SearchBar />
                        </div>

                        {/* Desktop nav links */}
                        <nav className="hidden items-center gap-1 lg:flex shrink-0">
                            <Link
                                href={route("public.home")}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                            >
                                Home
                            </Link>
                            <Link
                                href={route("public.products.index")}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                            >
                                Products
                            </Link>
                            <Link
                                href={route("public.track-order")}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                            >
                                Track Order
                            </Link>
                        </nav>

                        {/* Right icons */}
                        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
                            {/* Mobile search link */}
                            <Link
                                href={route("public.search")}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors md:hidden"
                            >
                                <Search size={20} />
                            </Link>

                            {/* Cart */}
                            <button
                                type="button"
                                onClick={() => setCartDrawerOpen(true)}
                                className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                                aria-label="Open Cart"
                            >
                                <ShoppingBag size={20} />
                                {effectiveCartCount > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs">
                                        {effectiveCartCount > 99
                                            ? "99+"
                                            : effectiveCartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category strip — desktop only */}
                {categories.length > 0 && (
                    <div className="hidden border-t border-gray-100 md:block">
                        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-0.5 overflow-x-auto py-2 scrollbar-none">
                                <Link
                                    href={route("public.products.index")}
                                    className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors whitespace-nowrap"
                                >
                                    All
                                </Link>
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={route(
                                            "public.categories.show",
                                            cat.slug,
                                        )}
                                        className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors whitespace-nowrap"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Mobile navigation drawer */}
            <MobileDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                categories={categories}
                settings={settings}
            />

            {/* Cart Slide-Over Drawer */}
            <CartDrawer
                open={cartDrawerOpen}
                onClose={() => setCartDrawerOpen(false)}
                currencySymbol={settings?.currency_symbol ?? "৳"}
            />
        </>
    );
}
