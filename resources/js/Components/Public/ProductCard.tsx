// resources/js/Components/Public/ProductCard.tsx

import { Link } from "@inertiajs/react";
import { ShoppingCart, Tag } from "lucide-react";

interface ProductCardProduct {
    id: number;
    name: string;
    slug: string;
    sale_price: number;
    discount_type: "flat" | "percentage" | null;
    discount_value: number | null;
    stock_qty: number;
    is_low_stock: boolean;
    has_variants: boolean;
    is_featured?: boolean;
    primary_image: string | null;
    category: { id: number; name: string; slug: string } | null;
    variants?: {
        id: number;
        sku: string;
        attributes: Record<string, string>;
        stock_qty: number;
        price_override: number | null;
        cost_price_override: number | null;
        is_active: boolean;
    }[];
    description?: string | null;
}

interface ProductCardProps {
    product: ProductCardProduct;
    currencySymbol: string;
    onAddToCart?: (product: ProductCardProduct) => void;
}

export function calcDiscountedPrice(
    price: number,
    type: string | null,
    value: number | null,
): number | null {
    if (!type || value === null || value === undefined) return null;
    if (type === "flat") return Math.max(0, price - value);
    if (type === "percentage")
        return Math.max(0, price - (price * value) / 100);
    return null;
}

export function formatPrice(symbol: string, price: number): string {
    return `${symbol}${Number(price).toLocaleString("en-BD", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
}

export default function ProductCard({
    product,
    currencySymbol,
    onAddToCart,
}: ProductCardProps) {
    const discounted = calcDiscountedPrice(
        product.sale_price,
        product.discount_type,
        product.discount_value,
    );
    const hasDiscount = discounted !== null && discounted < product.sale_price;
    const finalPrice = hasDiscount ? discounted! : product.sale_price;
    const outOfStock = product.stock_qty <= 0;

    return (
        <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            {/* Image — padding-bottom trick for perfect square */}
            <Link
                href={route("public.products.show", product.slug)}
                className="relative block w-full overflow-hidden bg-gray-50"
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
                            <Tag size={28} className="text-gray-200" />
                        </div>
                    )}
                </div>

                {/* Badges */}
                <div className="absolute left-2 top-2 flex flex-col gap-1 z-10">
                    {product.is_featured && (
                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                            Featured
                        </span>
                    )}
                    {hasDiscount && product.discount_type === "percentage" && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                            -{product.discount_value}%
                        </span>
                    )}
                    {outOfStock && (
                        <span className="rounded-full bg-gray-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                            Out of stock
                        </span>
                    )}
                </div>
            </Link>

            {/* Info */}
            <div className="flex flex-1 flex-col p-3">
                {product.category && (
                    <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-indigo-500">
                        {product.category.name}
                    </p>
                )}

                <Link
                    href={route("public.products.show", product.slug)}
                    className="line-clamp-2 flex-1 text-sm font-medium text-gray-800 leading-snug hover:text-indigo-600 transition-colors"
                >
                    {product.name}
                </Link>

                <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-base font-bold text-gray-900">
                        {formatPrice(currencySymbol, finalPrice)}
                    </span>
                    {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">
                            {formatPrice(currencySymbol, product.sale_price)}
                        </span>
                    )}
                </div>

                {product.is_low_stock && !outOfStock && (
                    <p className="mt-0.5 text-[11px] font-medium text-amber-600">
                        Low stock
                    </p>
                )}

                {onAddToCart && (
                    <button
                        disabled={outOfStock}
                        onClick={() => !outOfStock && onAddToCart(product)}
                        className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                            outOfStock
                                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
                        }`}
                    >
                        <ShoppingCart size={13} />
                        {outOfStock ? "Out of Stock" : "Add to Cart"}
                    </button>
                )}
            </div>
        </div>
    );
}

export type { ProductCardProduct };
