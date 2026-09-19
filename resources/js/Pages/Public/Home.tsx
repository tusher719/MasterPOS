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
import { Head, Link } from "@inertiajs/react";
import { ArrowRight, ShoppingCart, Tag, TrendingUp } from "lucide-react";
import { useState } from "react";

interface HomeProps {
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
    featuredProducts,
    latestProducts,
    categories,
    settings,
}: HomeProps) {
    const currency = settings.currency_symbol;
    const [cart, setCart] = useState<CartItem[]>([]);
    const [toast, setToast] = useState<CartItem | null>(null);
    const [modalProduct, setModalProduct] = useState<ProductCardProduct | null>(
        null,
    );

    const handleAddToCart = (item: CartItem) => {
        setCart((prev) => {
            const key = `${item.id}-${item.variantId ?? ""}`;
            const existing = prev.find(
                (c) => `${c.id}-${c.variantId ?? ""}` === key,
            );
            if (existing)
                return prev.map((c) =>
                    `${c.id}-${c.variantId ?? ""}` === key
                        ? { ...c, qty: c.qty + item.qty }
                        : c,
                );
            return [...prev, item];
        });
        setToast(item);
        setTimeout(() => setToast(null), 3000);
    };

    const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

    return (
        <PublicLayout
            settings={settings}
            categories={categories}
            cartCount={cartCount}
        >
            {/* Page title — "Home - EloriaBD" */}
            <Head title="Home" />

            {/* ── Hero — full viewport width, no container ─────────────────── */}
            <div
                className="relative w-full overflow-hidden bg-gray-900"
                style={{ minHeight: 320 }}
            >
                {/* BG image */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80')",
                        opacity: 0.45,
                    }}
                />

                {/* Dark overlay — only on text area */}
                <div className="absolute inset-0 bg-black/20" />

                {/* Text — inside container */}
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
                                        categories[0].slug,
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
