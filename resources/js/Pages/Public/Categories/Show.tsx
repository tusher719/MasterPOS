// resources/js/Pages/Public/Categories/Show.tsx

import AddToCartModal from "@/Components/Public/AddToCartModal";
import Pagination from "@/Components/Public/Pagination";
import ProductCard, {
    ProductCardProduct,
} from "@/Components/Public/ProductCard";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    CartItem,
    CategoryFilters,
    PaginatedProducts,
    PublicCategory,
    PublicSettings,
} from "@/types/public";
import { Head, Link, router } from "@inertiajs/react";
import { ChevronRight, Filter, SlidersHorizontal, Tag, X } from "lucide-react";
import { useState } from "react";

interface CategoryShowProps {
    category: {
        id: number;
        name: string;
        slug: string;
        description: string | null;
        image: string | null;
        children: { id: number; name: string; slug: string }[];
    };
    products: PaginatedProducts;
    allCategories: PublicCategory[];
    filters: CategoryFilters;
    settings: PublicSettings;
}

function Sidebar({
    allCategories,
    currentSlug,
    filters,
    onApply,
    onClose,
}: {
    allCategories: PublicCategory[];
    currentSlug: string;
    filters: CategoryFilters;
    onApply: (f: Partial<CategoryFilters>) => void;
    onClose?: () => void;
}) {
    const [minPrice, setMinPrice] = useState(filters.min_price);
    const [maxPrice, setMaxPrice] = useState(filters.max_price);

    const apply = (f: Partial<CategoryFilters>) => {
        onApply(f);
        onClose?.();
    };

    const sortOptions = [
        { value: "newest", label: "Newest First" },
        { value: "price_asc", label: "Price: Low to High" },
        { value: "price_desc", label: "Price: High to Low" },
        { value: "name_asc", label: "Name A–Z" },
    ];

    return (
        <div className="space-y-6">
            {/* Sort */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Sort By
                </p>
                <div className="space-y-0.5">
                    {sortOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => apply({ sort: opt.value as any })}
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                filters.sort === opt.value
                                    ? "bg-indigo-50 font-semibold text-indigo-700"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Availability */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Availability
                </p>
                <button
                    onClick={() => apply({ in_stock: !filters.in_stock })}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        filters.in_stock
                            ? "bg-indigo-50 font-semibold text-indigo-700"
                            : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                    <span
                        className={`h-4 w-4 rounded border-2 transition-colors ${
                            filters.in_stock
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-gray-300 bg-white"
                        }`}
                    />
                    In Stock Only
                </button>
            </div>

            {/* Other categories */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Other Categories
                </p>
                <div className="space-y-0.5">
                    {allCategories
                        .filter((c) => c.slug !== currentSlug)
                        .slice(0, 8)
                        .map((cat) => (
                            <Link
                                key={cat.id}
                                href={route("public.categories.show", cat.slug)}
                                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <span>{cat.name}</span>
                                {cat.products_count !== undefined && (
                                    <span className="text-xs text-gray-400">
                                        {cat.products_count}
                                    </span>
                                )}
                            </Link>
                        ))}
                </div>
            </div>

            {/* Price range */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Price Range
                </p>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                    />
                    <span className="shrink-0 text-gray-400">–</span>
                    <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                    />
                </div>
                <button
                    onClick={() =>
                        apply({ min_price: minPrice, max_price: maxPrice })
                    }
                    className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                    Apply
                </button>
                {(filters.min_price || filters.max_price) && (
                    <button
                        onClick={() => {
                            setMinPrice("");
                            setMaxPrice("");
                            apply({ min_price: "", max_price: "" });
                        }}
                        className="mt-1 w-full rounded-lg px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        Clear price
                    </button>
                )}
            </div>
        </div>
    );
}

export default function CategoryShow({
    category,
    products,
    allCategories,
    filters,
    settings,
}: CategoryShowProps) {
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [modalProduct, setModalProduct] = useState<ProductCardProduct | null>(
        null,
    );
    const currency = settings.currency_symbol;

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

    const applyFilters = (overrides: Partial<CategoryFilters>) => {
        const merged = { ...filters, ...overrides };
        router.get(
            route("public.categories.show", category.slug),
            {
                ...(merged.q && { q: merged.q }),
                ...(merged.in_stock && { in_stock: "1" }),
                ...(merged.min_price && { min_price: merged.min_price }),
                ...(merged.max_price && { max_price: merged.max_price }),
                ...(merged.sort !== "newest" && { sort: merged.sort }),
            },
            { preserveScroll: false, replace: true },
        );
    };

    return (
        <PublicLayout
            settings={settings}
            categories={allCategories}
            cartCount={cartCount}
        >
            <Head title={category.name} />

            <div className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="mb-5 flex items-center gap-1.5 text-sm text-gray-400">
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
                    <ChevronRight size={13} />
                    <span className="text-gray-700 font-medium">
                        {category.name}
                    </span>
                </nav>

                {/* Category header */}
                <div className="mb-6 flex items-start gap-4">
                    {category.image && (
                        <img
                            src={`/storage/${category.image}`}
                            alt={category.name}
                            className="h-14 w-14 rounded-xl object-cover shadow-sm"
                        />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {category.name}
                        </h1>
                        {category.description && (
                            <p className="mt-1 text-sm text-gray-500">
                                {category.description}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                            {products.meta.total} products
                        </p>
                    </div>
                </div>

                {/* Subcategory pills */}
                {category.children.length > 0 && (
                    <div className="mb-5 flex flex-wrap gap-2">
                        {category.children.map((child) => (
                            <Link
                                key={child.id}
                                href={route(
                                    "public.categories.show",
                                    child.slug,
                                )}
                                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors shadow-sm"
                            >
                                {child.name}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Mobile filter toggle */}
                <div className="mb-4 flex items-center justify-between lg:hidden">
                    <p className="text-sm text-gray-500">
                        {products.meta.total} products
                    </p>
                    <button
                        onClick={() => setMobileFiltersOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <SlidersHorizontal size={15} />
                        Filters
                    </button>
                </div>

                <div className="flex gap-6">
                    {/* Desktop sidebar */}
                    <aside className="hidden w-64 shrink-0 lg:block">
                        <div className="sticky top-24 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Filter size={14} className="text-gray-500" />
                                <p className="text-sm font-semibold text-gray-700">
                                    Filters
                                </p>
                            </div>
                            <Sidebar
                                allCategories={allCategories}
                                currentSlug={category.slug}
                                filters={filters}
                                onApply={applyFilters}
                            />
                        </div>
                    </aside>

                    {/* Mobile drawer */}
                    {mobileFiltersOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-50 bg-black/40"
                                onClick={() => setMobileFiltersOpen(false)}
                            />
                            <div className="fixed inset-y-0 right-0 z-[60] w-72 overflow-y-auto bg-white p-5 shadow-2xl">
                                <div className="mb-4 flex items-center justify-between">
                                    <p className="font-semibold text-gray-800">
                                        Filters
                                    </p>
                                    <button
                                        onClick={() =>
                                            setMobileFiltersOpen(false)
                                        }
                                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <Sidebar
                                    allCategories={allCategories}
                                    currentSlug={category.slug}
                                    filters={filters}
                                    onApply={applyFilters}
                                    onClose={() => setMobileFiltersOpen(false)}
                                />
                            </div>
                        </>
                    )}

                    {/* Grid */}
                    <div className="min-w-0 flex-1">
                        {products.data.length === 0 ? (
                            <div className="py-20 text-center">
                                <Tag
                                    size={44}
                                    className="mx-auto mb-4 text-gray-200"
                                />
                                <p className="text-lg font-medium text-gray-500">
                                    No products in this category
                                </p>
                                <p className="mt-1 text-sm text-gray-400">
                                    Try a different category or remove filters.
                                </p>
                                <Link
                                    href={route("public.products.index")}
                                    className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                >
                                    Browse all products
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                                {products.data.map((p) => (
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
                        )}
                        <Pagination
                            meta={products.meta}
                            links={products.links}
                        />
                    </div>
                </div>
            </div>

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
