// resources/js/Pages/Public/Home.tsx

import AddToCartModal from "@/Components/Public/AddToCartModal";
import ProductCard, {
    ProductCardProduct,
} from "@/Components/Public/ProductCard";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    CartItem,
    PublicCategory,
    PublicProduct,
    PublicSettings,
} from "@/types/public";
import { useCart } from "@/hooks/useCart";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Copy,
    Check,
    ShoppingCart,
    Tag,
    TrendingUp,
    Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";

export interface PublicBanner {
    id: number;
    title: string;
    subtitle: string | null;
    badge_text: string | null;
    image_path: string;
    link_url: string | null;
    button_text: string | null;
    coupon_code: string | null;
    bg_color: string | null;
}

interface HomeProps {
    heroBanners?: PublicBanner[];
    promoBanners?: PublicBanner[];
    featuredProducts: PublicProduct[];
    latestProducts: PublicProduct[];
    categories: PublicCategory[];
    settings: PublicSettings;
}

function CartToast({ item, onClose }: { item: CartItem; onClose: () => void }) {
    return (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-2xl">
            {item.image ? (
                <img
                    src={`/storage/${item.image}`}
                    alt={item.name}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
            ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <ShoppingCart size={16} className="text-gray-400" />
                </div>
            )}
            <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800">
                    Added to cart
                </p>
                <p className="truncate text-xs text-gray-500 max-w-[140px]">
                    {item.name}
                </p>
            </div>
            <button
                onClick={onClose}
                className="ml-1 shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
                OK
            </button>
        </div>
    );
}

function SectionHeader({
    title,
    href,
    linkLabel = "View all",
}: {
    title: string;
    href: string;
    linkLabel?: string;
}) {
    return (
        <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                {title}
            </h2>
            <Link
                href={href}
                className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                {linkLabel} <ArrowRight size={14} />
            </Link>
        </div>
    );
}

export default function Home({
    heroBanners = [],
    promoBanners = [],
    featuredProducts,
    latestProducts,
    categories,
    settings,
}: HomeProps) {
    const currency = settings.currency_symbol;
    const { addItem, cartCount } = useCart();
    const [toast, setToast] = useState<CartItem | null>(null);
    const [modalProduct, setModalProduct] = useState<ProductCardProduct | null>(
        null,
    );

    // Hero Carousel state
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    const [isHeroPaused, setIsHeroPaused] = useState(false);
    const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

    // Auto-advance hero carousel every 5 seconds if not hovered/paused
    useEffect(() => {
        if (!heroBanners || heroBanners.length <= 1 || isHeroPaused) return;

        const timer = setInterval(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % heroBanners.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [heroBanners, isHeroPaused]);

    const handleCopyCoupon = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCoupon(code);
        setTimeout(() => setCopiedCoupon(null), 2500);
    };

    const nextHeroSlide = () => {
        if (!heroBanners || heroBanners.length <= 1) return;
        setCurrentHeroIndex((prev) => (prev + 1) % heroBanners.length);
    };

    const prevHeroSlide = () => {
        if (!heroBanners || heroBanners.length <= 1) return;
        setCurrentHeroIndex(
            (prev) => (prev - 1 + heroBanners.length) % heroBanners.length
        );
    };

    const handleAddToCart = (item: CartItem) => {
        addItem(item);
        setToast(item);
        setTimeout(() => setToast(null), 3000);
        window.dispatchEvent(new CustomEvent("masterpos:open-cart"));
    };

    const activeHero = heroBanners[currentHeroIndex];

    return (
        <PublicLayout
            settings={settings}
            categories={categories}
            cartCount={cartCount}
        >
            <Head title="Home" />

            {/* ── Hero Carousel Slider ─────────────────────────────────────── */}
            {heroBanners && heroBanners.length > 0 && activeHero ? (
                <div
                    className="relative w-full overflow-hidden bg-gray-950 group"
                    style={{ minHeight: 380 }}
                    onMouseEnter={() => setIsHeroPaused(true)}
                    onMouseLeave={() => setIsHeroPaused(false)}
                >
                    {/* Background Slide Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out"
                        style={{
                            backgroundImage: `url('/storage/${activeHero.image_path}')`,
                            opacity: 0.55,
                        }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />

                    {/* Slide Content */}
                    <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
                        <div className="flex min-h-[380px] sm:min-h-[440px] flex-col justify-center py-14 sm:py-20 max-w-xl">
                            {/* Badge */}
                            {activeHero.badge_text && (
                                <div className="mb-3">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/90 backdrop-blur-xs px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-md">
                                        <Sparkles size={12} />
                                        {activeHero.badge_text}
                                    </span>
                                </div>
                            )}

                            {/* Headline */}
                            <h1 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl leading-tight drop-shadow-md">
                                {activeHero.title}
                            </h1>

                            {/* Subtitle */}
                            {activeHero.subtitle && (
                                <p className="mt-3 text-sm text-gray-200 sm:text-base leading-relaxed line-clamp-3">
                                    {activeHero.subtitle}
                                </p>
                            )}

                            {/* CTAs & Coupon pill */}
                            <div className="mt-7 flex flex-wrap items-center gap-3">
                                <Link
                                    href={
                                        activeHero.link_url ||
                                        route("public.products.index")
                                    }
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-gray-900 shadow-xl hover:bg-gray-100 active:scale-95 transition"
                                >
                                    {activeHero.button_text || "Shop Now"}{" "}
                                    <ArrowRight size={15} />
                                </Link>

                                {activeHero.coupon_code && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleCopyCoupon(
                                                activeHero.coupon_code!
                                            )
                                        }
                                        className="inline-flex items-center gap-2 rounded-full bg-emerald-500/90 hover:bg-emerald-600 px-4 py-2.5 text-xs font-mono font-bold text-white shadow-lg backdrop-blur-xs transition"
                                        title="Click to copy promo code"
                                    >
                                        <Tag size={13} />
                                        <span>
                                            CODE: {activeHero.coupon_code}
                                        </span>
                                        {copiedCoupon ===
                                        activeHero.coupon_code ? (
                                            <span className="text-[11px] font-sans font-bold text-white bg-emerald-700/80 px-2 py-0.5 rounded-full">
                                                Copied!
                                            </span>
                                        ) : (
                                            <Copy
                                                size={12}
                                                className="opacity-75"
                                            />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Arrows (if multiple slides) */}
                    {heroBanners.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={prevHeroSlide}
                                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                                aria-label="Previous slide"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={nextHeroSlide}
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                                aria-label="Next slide"
                            >
                                <ChevronRight size={20} />
                            </button>

                            {/* Dot Indicators */}
                            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 z-10">
                                {heroBanners.map((_, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() =>
                                            setCurrentHeroIndex(idx)
                                        }
                                        className={`h-2 rounded-full transition-all ${
                                            idx === currentHeroIndex
                                                ? "w-8 bg-white"
                                                : "w-2 bg-white/40 hover:bg-white/70"
                                        }`}
                                        aria-label={`Go to slide ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                /* Fallback Default Hero (if no custom banners created) */
                <div
                    className="relative w-full overflow-hidden bg-gray-900"
                    style={{ minHeight: 320 }}
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage:
                                "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80')",
                            opacity: 0.45,
                        }}
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
                        <div className="flex min-h-[320px] flex-col justify-center py-14 sm:py-20">
                            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">
                                Welcome to
                            </p>
                            <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
                                {settings.business_name}
                            </h1>
                            <p className="mt-3 max-w-md text-base text-gray-200 sm:text-lg">
                                Discover quality products at the best prices.
                            </p>
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    href={route("public.products.index")}
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-lg hover:bg-gray-100 transition-colors"
                                >
                                    Shop Now <ArrowRight size={15} />
                                </Link>
                                {categories[0] && (
                                    <Link
                                        href={route(
                                            "public.categories.show",
                                            categories[0].slug
                                        )}
                                        className="inline-flex items-center gap-2 rounded-full border-2 border-white/50 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                                    >
                                        Browse Categories
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Page content — container ──────────────────────────────────── */}
            <div className="mx-auto w-full max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Categories */}
                {categories.length > 0 && (
                    <section className="mb-10">
                        <SectionHeader
                            title="Shop by Category"
                            href={route("public.products.index")}
                            linkLabel="All products"
                        />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {categories.slice(0, 6).map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={route(
                                        "public.categories.show",
                                        cat.slug,
                                    )}
                                    className="group relative block overflow-hidden rounded-xl"
                                    style={{ paddingBottom: "100%" }}
                                >
                                    <div className="absolute inset-0">
                                        {cat.image ? (
                                            <img
                                                src={`/storage/${cat.image}`}
                                                alt={cat.name}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-gray-200 transition-colors group-hover:bg-gray-300" />
                                        )}

                                        {/* Overlay — darker at bottom */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 transition-opacity group-hover:from-black/80 group-hover:via-black/40 group-hover:to-black/20" />

                                        {/* Text */}
                                        <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                                            {!cat.image && (
                                                <Tag
                                                    size={22}
                                                    className="mx-auto mb-1.5 text-white/70"
                                                />
                                            )}
                                            <p className="text-sm font-bold text-white drop-shadow-md leading-tight">
                                                {cat.name}
                                            </p>
                                            {cat.products_count !==
                                                undefined && (
                                                <p className="mt-0.5 text-[11px] text-white/75">
                                                    {cat.products_count} items
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Promotional Strip Banner Grid (Mid-page Deals) ───────── */}
                {promoBanners && promoBanners.length > 0 && (
                    <section className="mb-10">
                        <div
                            className={`grid grid-cols-1 ${
                                promoBanners.length === 1
                                    ? "md:grid-cols-1"
                                    : promoBanners.length === 2
                                    ? "md:grid-cols-2"
                                    : "md:grid-cols-3"
                            } gap-4`}
                        >
                            {promoBanners.map((promo) => (
                                <div
                                    key={promo.id}
                                    className="relative overflow-hidden rounded-2xl shadow-xs group min-h-[160px] sm:min-h-[190px] flex items-center p-6 border border-gray-100 dark:border-gray-800"
                                    style={{
                                        backgroundColor:
                                            promo.bg_color || "#111827",
                                    }}
                                >
                                    {/* Image background */}
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                        style={{
                                            backgroundImage: `url('/storage/${promo.image_path}')`,
                                            opacity: 0.45,
                                        }}
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />

                                    {/* Content */}
                                    <div className="relative z-10 max-w-sm">
                                        {promo.badge_text && (
                                            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-gray-950 px-2.5 py-0.5 rounded-full mb-2 shadow-xs">
                                                {promo.badge_text}
                                            </span>
                                        )}
                                        <h3 className="text-lg font-bold text-white leading-tight">
                                            {promo.title}
                                        </h3>
                                        {promo.subtitle && (
                                            <p className="text-xs text-gray-200 mt-1 line-clamp-2">
                                                {promo.subtitle}
                                            </p>
                                        )}
                                        <div className="mt-3.5 flex flex-wrap items-center gap-2">
                                            <Link
                                                href={
                                                    promo.link_url ||
                                                    route(
                                                        "public.products.index"
                                                    )
                                                }
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white hover:text-gray-900 px-3.5 py-1.5 rounded-xl backdrop-blur-xs transition"
                                            >
                                                <span>
                                                    {promo.button_text ||
                                                        "Explore Deal"}
                                                </span>
                                                <ArrowRight size={12} />
                                            </Link>

                                            {promo.coupon_code && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCopyCoupon(
                                                            promo.coupon_code!
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1.5 rounded-xl hover:bg-emerald-900/80 transition"
                                                    title="Click to copy coupon code"
                                                >
                                                    <Tag size={11} />
                                                    <span>
                                                        {promo.coupon_code}
                                                    </span>
                                                    {copiedCoupon ===
                                                    promo.coupon_code ? (
                                                        <Check
                                                            size={11}
                                                            className="text-emerald-400"
                                                        />
                                                    ) : (
                                                        <Copy
                                                            size={10}
                                                            className="opacity-70"
                                                        />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Featured Products */}
                {featuredProducts.length > 0 && (
                    <section className="mb-10">
                        <SectionHeader
                            title="Featured Products"
                            href={
                                route("public.products.index") + "?featured=1"
                            }
                        />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
                            {featuredProducts.map((p) => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    currencySymbol={currency}
                                    onAddToCart={(prod) =>
                                        setModalProduct(prod)
                                    }
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* New Arrivals */}
                {latestProducts.length > 0 && (
                    <section className="mb-4">
                        <SectionHeader
                            title="New Arrivals"
                            href={route("public.products.index")}
                        />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
                            {latestProducts.map((p) => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    currencySymbol={currency}
                                    onAddToCart={(prod) =>
                                        setModalProduct(prod)
                                    }
                                />
                            ))}
                        </div>
                    </section>
                )}

                {featuredProducts.length === 0 &&
                    latestProducts.length === 0 && (
                        <div className="py-20 text-center">
                            <TrendingUp
                                size={48}
                                className="mx-auto mb-4 text-gray-200"
                            />
                            <p className="text-lg font-medium text-gray-500">
                                No products available yet
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                                Check back soon.
                            </p>
                        </div>
                    )}
            </div>

            {/* Cart toast */}
            {toast && <CartToast item={toast} onClose={() => setToast(null)} />}

            {/* Add to Cart Modal */}
            {modalProduct && (
                <AddToCartModal
                    product={modalProduct}
                    currencySymbol={currency}
                    onClose={() => setModalProduct(null)}
                    onAddToCart={handleAddToCart}
                />
            )}
        </PublicLayout>
    );
}
