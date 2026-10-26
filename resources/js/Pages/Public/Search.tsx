import Pagination from "@/Components/Public/Pagination";
import ProductCard, {
    type ProductCardProduct,
} from "@/Components/Public/ProductCard";
import PublicLayout from "@/Layouts/PublicLayout";
import { Head, router, usePage } from "@inertiajs/react";
import {
    ChevronDown,
    ChevronUp,
    Search as SearchIcon,
    SlidersHorizontal,
    X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    sale_price: string | number;
    cost_price: string | number;
    stock_qty: string | number;
    low_stock_threshold: string | number;
    is_featured: boolean;
    has_variants: boolean;
    category: Category | null;
    // images: ProductImage[];
    primary_image: string | null;
    discount_type: "flat" | "percentage" | null;
    discount_value: number | null;
    is_low_stock: boolean;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface PaginationLinks {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
}

interface PaginatedProducts {
    data: Product[];
    meta: PaginationMeta;
    links: PaginationLinks;
}

interface Filters {
    q: string;
    category: number | null;
    min_price: string | null;
    max_price: string | null;
    sort: string;
}

interface Props {
    products: PaginatedProducts;
    categories: Category[];
    featuredProducts: Product[];
    filters: Filters;
}

const toProductCardProduct = (product: Product): ProductCardProduct => ({
    ...product,
    sale_price: Number(product.sale_price),
    stock_qty: Number(product.stock_qty),
    discount_value:
        product.discount_value !== null ? Number(product.discount_value) : null,
    category: product.category ? { ...product.category, slug: "" } : null,
});

// ─── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
    { value: "latest", label: "Latest" },
    { value: "price_asc", label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
    { value: "name_asc", label: "Name: A → Z" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Search({
    products,
    categories,
    featuredProducts,
    filters,
}: Props) {
    const { settings } = usePage().props as any;
    const currencySymbol = settings?.currency_symbol ?? "৳";
    const meta = products.meta ?? {};
    const links = products.links ?? {};

    // Local filter state — synced from props on mount
    const [q, setQ] = useState(filters.q ?? "");
    const [category, setCategory] = useState<number | null>(
        filters.category ?? null,
    );
    const [minPrice, setMinPrice] = useState(filters.min_price ?? "");
    const [maxPrice, setMaxPrice] = useState(filters.max_price ?? "");
    const [sort, setSort] = useState(filters.sort ?? "latest");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [priceOpen, setPriceOpen] = useState(true);
    const [catOpen, setCatOpen] = useState(true);

    // Keep local state in sync when Inertia navigates back
    useEffect(() => {
        setQ(filters.q ?? "");
        setCategory(filters.category ?? null);
        setMinPrice(filters.min_price ?? "");
        setMaxPrice(filters.max_price ?? "");
        setSort(filters.sort ?? "latest");
    }, [filters]);

    // ── Apply filters ────────────────────────────────────────────────────────
    const applyFilters = useCallback(
        (overrides: Partial<Filters> = {}) => {
            const params: Record<string, string | number | null> = {
                q: overrides.q !== undefined ? overrides.q : q,
                category:
                    overrides.category !== undefined
                        ? overrides.category
                        : category,
                min_price:
                    overrides.min_price !== undefined
                        ? overrides.min_price
                        : minPrice || null,
                max_price:
                    overrides.max_price !== undefined
                        ? overrides.max_price
                        : maxPrice || null,
                sort: overrides.sort !== undefined ? overrides.sort : sort,
            };

            // Strip nulls / empty strings
            const clean: Record<string, string | number> = {};
            Object.entries(params).forEach(([k, v]) => {
                if (v !== null && v !== "") clean[k] = v;
            });

            router.get(route("public.search"), clean, {
                preserveScroll: true,
                replace: true,
            });
        },
        [q, category, minPrice, maxPrice, sort],
    );

    // ── Search submit (Enter key / button) ───────────────────────────────────
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    // ── Sort change ──────────────────────────────────────────────────────────
    const handleSortChange = (value: string) => {
        setSort(value);
        applyFilters({ sort: value });
    };

    // ── Category change ──────────────────────────────────────────────────────
    const handleCategoryChange = (id: number | null) => {
        setCategory(id);
        applyFilters({ category: id });
    };

    // ── Price apply ──────────────────────────────────────────────────────────
    const handlePriceApply = () => {
        applyFilters({
            min_price: minPrice || null,
            max_price: maxPrice || null,
        });
    };

    // ── Clear all filters ────────────────────────────────────────────────────
    const handleClearAll = () => {
        setQ("");
        setCategory(null);
        setMinPrice("");
        setMaxPrice("");
        setSort("latest");
        router.get(route("public.search"), {}, { replace: true });
    };

    const hasActiveFilters =
        category !== null ||
        minPrice !== "" ||
        maxPrice !== "" ||
        sort !== "latest";
    const hasResults = (meta.total ?? 0) > 0;

    // ── Page title ───────────────────────────────────────────────────────────
    const pageTitle = filters.q
        ? `Search results for "${filters.q}"`
        : "Search Products";

    return (
        <PublicLayout>
            <Head title={pageTitle} />

            {/* ── Search bar header ── */}
            <div className="bg-white border-b border-gray-100 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="flex gap-3 max-w-2xl"
                    >
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search products by name, SKU, or description…"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            {q && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQ("");
                                        applyFilters({ q: "" });
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium
                                       rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Search
                        </button>
                    </form>

                    {/* Result count + sort row */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-500">
                            {hasResults ? (
                                <>
                                    Showing{" "}
                                    <span className="font-medium text-gray-800">
                                        {meta.from ?? 0}–{meta.to ?? 0}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-medium text-gray-800">
                                        {meta.total}
                                    </span>{" "}
                                    {meta.total === 1 ? "product" : "products"}
                                    {filters.q && (
                                        <>
                                            {" "}
                                            for{" "}
                                            <span className="font-medium text-indigo-600">
                                                "{filters.q}"
                                            </span>
                                        </>
                                    )}
                                </>
                            ) : filters.q ? (
                                <>
                                    No results for{" "}
                                    <span className="font-medium text-gray-800">
                                        "{filters.q}"
                                    </span>
                                </>
                            ) : (
                                "No products found"
                            )}
                        </p>

                        <div className="flex items-center gap-3">
                            {/* Mobile filter toggle */}
                            <button
                                type="button"
                                onClick={() => setSidebarOpen((o) => !o)}
                                className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200
                                           rounded-lg px-3 py-2 hover:bg-gray-50 lg:hidden"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                                {hasActiveFilters && (
                                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                )}
                            </button>

                            {/* Sort */}
                            <select
                                value={sort}
                                onChange={(e) =>
                                    handleSortChange(e.target.value)
                                }
                                className="text-sm border border-gray-200 rounded-lg px-3 py-2
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                {SORT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="text-sm text-red-500 hover:text-red-700"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* ── Sidebar filters ── */}
                    <aside
                        className={`
                            w-64 flex-shrink-0
                            ${sidebarOpen ? "block" : "hidden"} lg:block
                            fixed inset-0 z-40 bg-white lg:static lg:z-auto lg:bg-transparent
                            overflow-y-auto lg:overflow-visible
                            p-6 lg:p-0
                        `}
                    >
                        {/* Mobile close */}
                        <div className="flex items-center justify-between mb-5 lg:hidden">
                            <span className="font-semibold text-gray-800">
                                Filters
                            </span>
                            <button onClick={() => setSidebarOpen(false)}>
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Category filter */}
                        <div className="mb-6">
                            <button
                                type="button"
                                onClick={() => setCatOpen((o) => !o)}
                                className="flex items-center justify-between w-full text-sm font-semibold
                                           text-gray-800 mb-3"
                            >
                                Category
                                {catOpen ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                            {catOpen && (
                                <div className="space-y-1.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleCategoryChange(null)
                                        }
                                        className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors
                                            ${
                                                category === null
                                                    ? "bg-indigo-50 text-indigo-700 font-medium"
                                                    : "text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        All Categories
                                    </button>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() =>
                                                handleCategoryChange(cat.id)
                                            }
                                            className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors
                                                ${
                                                    category === cat.id
                                                        ? "bg-indigo-50 text-indigo-700 font-medium"
                                                        : "text-gray-600 hover:bg-gray-50"
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 my-4" />

                        {/* Price range filter */}
                        <div className="mb-6">
                            <button
                                type="button"
                                onClick={() => setPriceOpen((o) => !o)}
                                className="flex items-center justify-between w-full text-sm font-semibold
                                           text-gray-800 mb-3"
                            >
                                Price Range
                                {priceOpen ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                            {priceOpen && (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 mb-1 block">
                                                Min (৳)
                                            </label>
                                            <input
                                                type="number"
                                                value={minPrice}
                                                onChange={(e) =>
                                                    setMinPrice(e.target.value)
                                                }
                                                placeholder="0"
                                                min="0"
                                                className="w-full border border-gray-200 rounded-md px-3 py-1.5
                                                           text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 mb-1 block">
                                                Max (৳)
                                            </label>
                                            <input
                                                type="number"
                                                value={maxPrice}
                                                onChange={(e) =>
                                                    setMaxPrice(e.target.value)
                                                }
                                                placeholder="∞"
                                                min="0"
                                                className="w-full border border-gray-200 rounded-md px-3 py-1.5
                                                           text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handlePriceApply}
                                        className="w-full py-1.5 text-sm bg-indigo-600 text-white rounded-md
                                                   hover:bg-indigo-700 transition-colors"
                                    >
                                        Apply
                                    </button>
                                    {(minPrice !== "" || maxPrice !== "") && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMinPrice("");
                                                setMaxPrice("");
                                                applyFilters({
                                                    min_price: null,
                                                    max_price: null,
                                                });
                                            }}
                                            className="w-full py-1.5 text-sm text-gray-500 hover:text-red-500"
                                        >
                                            Clear price
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Mobile sidebar backdrop */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    {/* ── Product grid ── */}
                    <div className="flex-1 min-w-0">
                        {hasResults ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {products.data.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={toProductCardProduct(
                                                product,
                                            )}
                                            currencySymbol={currencySymbol}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {(meta.last_page ?? 1) > 1 && (
                                    <div className="mt-8">
                                        <Pagination
                                            meta={{
                                                current_page:
                                                    meta.current_page ?? 1,
                                                last_page: meta.last_page ?? 1,
                                                per_page: meta.per_page ?? 0,
                                                total: meta.total ?? 0,
                                                from: meta.from ?? null,
                                                to: meta.to ?? null,
                                            }}
                                            links={{
                                                first: links.first ?? null,
                                                last: links.last ?? null,
                                                prev: links.prev ?? null,
                                                next: links.next ?? null,
                                            }}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            /* ── Empty state ── */
                            <div className="text-center py-16">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <SearchIcon className="w-7 h-7 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                    {filters.q
                                        ? `No results for "${filters.q}"`
                                        : "No products found"}
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    {hasActiveFilters
                                        ? "Try adjusting your filters or search with different keywords."
                                        : "Try a different keyword to find what you're looking for."}
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={handleClearAll}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        Clear all filters
                                    </button>
                                )}

                                {/* Featured products fallback */}
                                {featuredProducts.length > 0 && (
                                    <div className="mt-14 text-left">
                                        <h4 className="text-base font-semibold text-gray-800 mb-5">
                                            Featured Products
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {featuredProducts.map((product) => (
                                                <ProductCard
                                                    key={product.id}
                                                    product={toProductCardProduct(
                                                        product,
                                                    )}
                                                    currencySymbol={
                                                        currencySymbol
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
