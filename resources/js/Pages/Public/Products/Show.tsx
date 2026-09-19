// resources/js/Pages/Public/Products/Show.tsx

import AddToCartModal from "@/Components/Public/AddToCartModal";
import {
    ProductCardProduct,
    calcDiscountedPrice,
    formatPrice,
} from "@/Components/Public/ProductCard";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    CartItem,
    PublicProduct,
    PublicProductDetail,
    PublicSettings,
} from "@/types/public";
import { Head, Link } from "@inertiajs/react";
import {
    ChevronLeft,
    ChevronRight,
    Package,
    Share2,
    ShoppingCart,
    Tag,
} from "lucide-react";
import { useState } from "react";

interface ProductShowProps {
    product: PublicProductDetail;
    related: PublicProduct[];
    settings: PublicSettings;
}

// ─── Image Gallery ────────────────────────────────────────────────────────────
function ImageGallery({
    images,
    productName,
}: {
    images: PublicProductDetail["images"];
    productName: string;
}) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (images.length === 0) {
        return (
            <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-gray-100">
                <Package size={64} className="text-gray-300" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50">
                <img
                    src={`/storage/${images[activeIndex].image_path}`}
                    alt={`${productName} ${activeIndex + 1}`}
                    className="h-full w-full object-cover"
                />
                {images.length > 1 && (
                    <>
                        <button
                            onClick={() =>
                                setActiveIndex(
                                    (i) =>
                                        (i - 1 + images.length) % images.length,
                                )
                            }
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white transition-colors"
                        >
                            <ChevronLeft size={18} className="text-gray-700" />
                        </button>
                        <button
                            onClick={() =>
                                setActiveIndex((i) => (i + 1) % images.length)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white transition-colors"
                        >
                            <ChevronRight size={18} className="text-gray-700" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveIndex(i)}
                                    className={`h-1.5 rounded-full transition-all ${
                                        i === activeIndex
                                            ? "w-5 bg-indigo-600"
                                            : "w-1.5 bg-white/70"
                                    }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                        <button
                            key={img.id}
                            onClick={() => setActiveIndex(i)}
                            className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                                i === activeIndex
                                    ? "border-indigo-500 ring-2 ring-indigo-100"
                                    : "border-gray-100 hover:border-gray-300"
                            }`}
                        >
                            <img
                                src={`/storage/${img.image_path}`}
                                alt={`Thumb ${i + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Related Card ─────────────────────────────────────────────────────────────
function RelatedCard({
    product,
    currencySymbol,
}: {
    product: PublicProduct;
    currencySymbol: string;
}) {
    const discounted = calcDiscountedPrice(
        product.sale_price,
        product.discount_type,
        product.discount_value,
    );
    const hasDiscount = discounted !== null && discounted < product.sale_price;

    return (
        <Link
            href={route("public.products.show", product.slug)}
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
            <div
                className="relative w-full overflow-hidden bg-gray-50"
                style={{ paddingBottom: "100%" }}
            >
                <div className="absolute inset-0">
                    {product.primary_image ? (
                        <img
                            src={`/storage/${product.primary_image}`}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <Tag size={24} className="text-gray-200" />
                        </div>
                    )}
                </div>
            </div>
            <div className="p-3">
                <p className="line-clamp-2 text-sm font-medium text-gray-800 leading-snug group-hover:text-indigo-600 transition-colors">
                    {product.name}
                </p>
                <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">
                        {formatPrice(
                            currencySymbol,
                            hasDiscount ? discounted! : product.sale_price,
                        )}
                    </span>
                    {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">
                            {formatPrice(currencySymbol, product.sale_price)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

// ─── Product Show ─────────────────────────────────────────────────────────────
export default function ProductShow({
    product,
    related,
    settings,
}: ProductShowProps) {
    const currency = settings.currency_symbol;
    const [cart, setCart] = useState<CartItem[]>([]);
    const [modalOpen, setModalOpen] = useState(false);

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
    };

    const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

    // Current display price (without variant — just for display)
    const displayPrice = product.sale_price;
    const discounted = calcDiscountedPrice(
        displayPrice,
        product.discount_type,
        product.discount_value,
    );
    const hasDiscount = discounted !== null && discounted < displayPrice;

    const inStock = product.stock_qty > 0;
    const isLowStock =
        inStock && product.stock_qty <= (product.low_stock_threshold ?? 5);

    // Build modal product
    const modalProduct: ProductCardProduct = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sale_price: product.sale_price,
        discount_type: product.discount_type,
        discount_value: product.discount_value,
        stock_qty: product.stock_qty,
        is_low_stock: product.is_low_stock,
        has_variants: product.has_variants,
        is_featured: product.is_featured,
        primary_image: product.primary_image,
        category: product.category,
        variants: product.variants,
        description: product.description,
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: product.name, url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    return (
        <PublicLayout settings={settings} cartCount={cartCount}>
            <Head title={product.name} />

            <div className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-400">
                    <Link
                        href={route("public.home")}
                        className="hover:text-indigo-600 transition-colors"
                    >
                        Home
                    </Link>
                    <ChevronRight size={13} />
                    <Link
                        href={route("public.products.index")}
                        className="hover:text-indigo-600 transition-colors"
                    >
                        Products
                    </Link>
                    {product.category && (
                        <>
                            <ChevronRight size={13} />
                            <Link
                                href={route(
                                    "public.categories.show",
                                    product.category.slug,
                                )}
                                className="hover:text-indigo-600 transition-colors"
                            >
                                {product.category.name}
                            </Link>
                        </>
                    )}
                    <ChevronRight size={13} />
                    <span className="line-clamp-1 text-gray-700">
                        {product.name}
                    </span>
                </nav>

                {/* Main grid */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Left — Images */}
                    <ImageGallery
                        images={product.images}
                        productName={product.name}
                    />

                    {/* Right — Info */}
                    <div className="flex flex-col gap-4">
                        {/* Category */}
                        {product.category && (
                            <Link
                                href={route(
                                    "public.categories.show",
                                    product.category.slug,
                                )}
                                className="w-fit text-xs font-semibold uppercase tracking-wider text-indigo-500 hover:text-indigo-700 transition-colors"
                            >
                                {product.category.name}
                            </Link>
                        )}

                        {/* Name */}
                        <h1 className="text-2xl font-bold text-gray-900 leading-snug sm:text-3xl">
                            {product.name}
                        </h1>

                        {/* Price */}
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <span className="text-3xl font-extrabold text-gray-900">
                                {formatPrice(
                                    currency,
                                    hasDiscount ? discounted! : displayPrice,
                                )}
                            </span>
                            {hasDiscount && (
                                <>
                                    <span className="text-lg text-gray-400 line-through">
                                        {formatPrice(currency, displayPrice)}
                                    </span>
                                    {product.discount_type === "percentage" && (
                                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-sm font-semibold text-red-600">
                                            -{product.discount_value}% off
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Stock */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                    inStock
                                        ? isLowStock
                                            ? "bg-amber-50 text-amber-700"
                                            : "bg-green-50 text-green-700"
                                        : "bg-red-50 text-red-600"
                                }`}
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                        inStock
                                            ? isLowStock
                                                ? "bg-amber-500"
                                                : "bg-green-500"
                                            : "bg-red-500"
                                    }`}
                                />
                                {inStock
                                    ? isLowStock
                                        ? `Low stock — ${product.stock_qty} left`
                                        : "In Stock"
                                    : "Out of Stock"}
                            </span>
                            {product.unit && (
                                <span className="text-xs text-gray-500">
                                    per {product.unit.name} (
                                    {product.unit.short_code})
                                </span>
                            )}
                        </div>

                        {/* Variants preview — chips, click opens modal */}
                        {product.has_variants &&
                            product.variants.length > 0 &&
                            (() => {
                                const attrKeys = Object.keys(
                                    product.variants[0]?.attributes ?? {},
                                );
                                return (
                                    <div className="space-y-3">
                                        {attrKeys.map((key) => {
                                            const values = [
                                                ...new Set(
                                                    product.variants.map(
                                                        (v) =>
                                                            v.attributes[key],
                                                    ),
                                                ),
                                            ];
                                            return (
                                                <div key={key}>
                                                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                        {key}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {values.map((val) => (
                                                            <button
                                                                key={val}
                                                                onClick={() =>
                                                                    setModalOpen(
                                                                        true,
                                                                    )
                                                                }
                                                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
                                                            >
                                                                {val}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                        {/* CTA buttons */}
                        <div className="flex gap-3 pt-1">
                            <button
                                disabled={!inStock}
                                onClick={() => setModalOpen(true)}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-colors ${
                                    inStock
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
                                        : "cursor-not-allowed bg-gray-100 text-gray-400"
                                }`}
                            >
                                <ShoppingCart size={17} />
                                {inStock ? "Add to Cart" : "Out of Stock"}
                            </button>
                            <button
                                onClick={handleShare}
                                className="rounded-xl border border-gray-200 p-3.5 text-gray-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                title="Share"
                            >
                                <Share2 size={18} />
                            </button>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Description
                                </p>
                                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* Product details table */}
                        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                            <p className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Product Details
                            </p>
                            <dl className="divide-y divide-gray-50">
                                <div className="flex justify-between px-4 py-2.5">
                                    <dt className="text-sm text-gray-500">
                                        SKU
                                    </dt>
                                    <dd className="text-sm font-medium text-gray-800">
                                        {product.sku}
                                    </dd>
                                </div>
                                {product.unit && (
                                    <div className="flex justify-between px-4 py-2.5">
                                        <dt className="text-sm text-gray-500">
                                            Unit
                                        </dt>
                                        <dd className="text-sm font-medium text-gray-800">
                                            {product.unit.name} (
                                            {product.unit.short_code})
                                        </dd>
                                    </div>
                                )}
                                {product.weight && (
                                    <div className="flex justify-between px-4 py-2.5">
                                        <dt className="text-sm text-gray-500">
                                            Weight
                                        </dt>
                                        <dd className="text-sm font-medium text-gray-800">
                                            {product.weight}{" "}
                                            {product.weight_unit}
                                        </dd>
                                    </div>
                                )}
                                {product.category && (
                                    <div className="flex justify-between px-4 py-2.5">
                                        <dt className="text-sm text-gray-500">
                                            Category
                                        </dt>
                                        <dd className="text-sm font-medium text-gray-800">
                                            {product.category.name}
                                        </dd>
                                    </div>
                                )}
                                <div className="flex justify-between px-4 py-2.5">
                                    <dt className="text-sm text-gray-500">
                                        Availability
                                    </dt>
                                    <dd
                                        className={`text-sm font-medium ${inStock ? "text-green-600" : "text-red-500"}`}
                                    >
                                        {inStock
                                            ? `${product.stock_qty} in stock`
                                            : "Out of stock"}
                                    </dd>
                                </div>
                                {product.has_variants && (
                                    <div className="flex justify-between px-4 py-2.5">
                                        <dt className="text-sm text-gray-500">
                                            Variants
                                        </dt>
                                        <dd className="text-sm font-medium text-gray-800">
                                            {product.variants.length} options
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Related products */}
                {/* Related + Featured toggle section */}
                {related.length > 0 && (
                    <section className="mt-14">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                                You May Also Like
                            </h2>
                            <div className="flex items-center gap-2">
                                {product.category && (
                                    <Link
                                        href={route(
                                            "public.categories.show",
                                            product.category.slug,
                                        )}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                    >
                                        View all →
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {related.map((p) => (
                                <RelatedCard
                                    key={p.id}
                                    product={p}
                                    currencySymbol={currency}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Add to Cart Modal */}
            {modalOpen && (
                <AddToCartModal
                    product={modalProduct}
                    currencySymbol={currency}
                    onClose={() => setModalOpen(false)}
                    onAddToCart={handleAddToCart}
                />
            )}
        </PublicLayout>
    );
}
