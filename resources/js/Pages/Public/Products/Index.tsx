// resources/js/Pages/Public/Products/Index.tsx

import AddToCartModal from "@/Components/Public/AddToCartModal";
import Pagination from "@/Components/Public/Pagination";
import ProductCard, {
    ProductCardProduct,
} from "@/Components/Public/ProductCard";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    CartItem,
    PaginatedProducts,
    ProductFilters,
    PublicCategory,
    PublicSettings,
} from "@/types/public";
import { Head, router } from "@inertiajs/react";
import {
    Filter,
    Search,
    ShoppingCart,
    SlidersHorizontal,
    Tag,
    X,
} from "lucide-react";
import { useState } from "react";

interface ProductsIndexProps {
    products: PaginatedProducts;
    categories: PublicCategory[];
    filters: ProductFilters;
    settings: PublicSettings;
}

// ─── Cart Toast ───────────────────────────────────────────────────────────────
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

// ─── Sidebar Filters ──────────────────────────────────────────────────────────
function SidebarFilters({
    categories,
    filters,
    onApply,
    onClose,
}: {
    categories: PublicCategory[];
    filters: ProductFilters;
    onApply: (f: Partial<ProductFilters>) => void;
    onClose?: () => void;
}) {
    const [minPrice, setMinPrice] = useState(filters.min_price);
    const [maxPrice, setMaxPrice] = useState(filters.max_price);

    const apply = (f: Partial<ProductFilters>) => {
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

            {/* Categories */}
            {categories.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Categories
                    </p>
                    <div className="space-y-0.5">
                        <button
                            onClick={() => apply({ category: "" })}
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                !filters.category
                                    ? "bg-indigo-50 font-semibold text-indigo-700"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            All Categories
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => apply({ category: cat.slug })}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                    filters.category === cat.slug
                                        ? "bg-indigo-50 font-semibold text-indigo-700"
                                        : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                <span>{cat.name}</span>
                                {cat.products_count !== undefined && (
                                    <span className="text-xs text-gray-400">
                                        {cat.products_count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Price Range */}
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

// ─── Products Index Page ──────────────────────────────────────────────────────
export default function ProductsIndex({
    products,
    categories,
    filters,
    settings,
}: ProductsIndexProps) {
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(filters.q);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [toast, setToast] = useState<CartItem | null>(null);
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
        setToast(item);
        setTimeout(() => setToast(null), 3000);
    };

    const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

    const applyFilters = (overrides: Partial<ProductFilters>) => {
        const merged = { ...filters, ...overrides };
        router.get(
            route("public.products.index"),
            {
                ...(merged.q && { q: merged.q }),
                ...(merged.category && { category: merged.category }),
                ...(merged.min_price && { min_price: merged.min_price }),
                ...(merged.max_price && { max_price: merged.max_price }),
                ...(merged.sort !== "newest" && { sort: merged.sort }),
                ...(merged.featured && { featured: "1" }),
            },
            { preserveScroll: false, replace: true },
        );
    };

    const hasActiveFilters = !!(
        filters.q ||
        filters.category ||
        filters.min_price ||
        filters.max_price ||
        filters.sort !== "newest"
    );

    return (
        <PublicLayout
            settings={settings}
            categories={categories}
            cartCount={cartCount}
        >
            <Head title="All Products" />

            <div className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Top bar */}
                <div className="mb-5 flex flex-wrap items-center gap-3">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
                            All Products
                        </h1>
                        <p className="text-sm text-gray-400">
                            {products.meta?.total ?? products.data?.length ?? 0}{" "}
                            items
                        </p>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        {/* Search */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyFilters({ q: searchInput });
                            }}
                            className="relative"
                        >
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search products..."
                                className="w-40 rounded-full border border-gray-200 bg-gray-50 py-2 pl-4 pr-8 text-sm outline-none transition-[width,box-shadow] duration-200 focus:w-64 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:w-52 sm:focus:w-72"
                            />
                            {searchInput ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchInput("");
                                        applyFilters({ q: "" });
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                                >
                                    <Search size={14} />
                                </button>
                            )}
                        </form>

                        {/* Mobile filter button */}
                        <button
                            onClick={() => setMobileFiltersOpen(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 lg:hidden transition-colors"
                        >
                            <SlidersHorizontal size={14} />
                            Filters
                            {hasActiveFilters && (
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Active filter pills */}
                {hasActiveFilters && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {filters.q && (
                            <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                                "{filters.q}"
                                <button onClick={() => applyFilters({ q: "" })}>
                                    <X size={11} />
                                </button>
                            </span>
                        )}
                        {filters.category && (
                            <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                                {categories.find(
                                    (c) => c.slug === filters.category,
                                )?.name ?? filters.category}
                                <button
                                    onClick={() =>
                                        applyFilters({ category: "" })
                                    }
                                >
                                    <X size={11} />
                                </button>
                            </span>
                        )}
                        {(filters.min_price || filters.max_price) && (
                            <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                                {filters.min_price &&
                                    `From ${currency}${filters.min_price}`}
                                {filters.min_price &&
                                    filters.max_price &&
                                    " – "}
                                {filters.max_price &&
                                    `To ${currency}${filters.max_price}`}
                                <button
                                    onClick={() =>
                                        applyFilters({
                                            min_price: "",
                                            max_price: "",
                                        })
                                    }
                                >
                                    <X size={11} />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={() =>
                                applyFilters({
                                    q: "",
                                    category: "",
                                    min_price: "",
                                    max_price: "",
                                    sort: "newest",
                                })
                            }
                            className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
                        >
                            Clear all
                        </button>
                    </div>
                )}

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
                            <SidebarFilters
                                categories={categories}
                                filters={filters}
                                onApply={applyFilters}
                            />
                        </div>
                    </aside>

                    {/* Mobile filter drawer */}
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
                                <SidebarFilters
                                    categories={categories}
                                    filters={filters}
                                    onApply={applyFilters}
                                    onClose={() => setMobileFiltersOpen(false)}
                                />
                            </div>
                        </>
                    )}

                    {/* Product grid */}
                    <div className="min-w-0 flex-1">
                        {products.data.length === 0 ? (
                            <div className="py-20 text-center">
                                <Tag
                                    size={44}
                                    className="mx-auto mb-4 text-gray-200"
                                />
                                <p className="text-lg font-medium text-gray-500">
                                    No products found
                                </p>
                                <p className="mt-1 text-sm text-gray-400">
                                    Try adjusting your search or filters.
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        onClick={() =>
                                            applyFilters({
                                                q: "",
                                                category: "",
                                                min_price: "",
                                                max_price: "",
                                                sort: "newest",
                                            })
                                        }
                                        className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                    >
                                        Clear filters
                                    </button>
                                )}
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
