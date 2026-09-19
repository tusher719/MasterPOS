// resources/js/Components/Public/AddToCartModal.tsx

import {
    calcDiscountedPrice,
    formatPrice,
    ProductCardProduct,
} from "@/Components/Public/ProductCard";
import { CartItem } from "@/types/public";
import { Link } from "@inertiajs/react";
import { Minus, Plus, ShoppingCart, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";

interface AddToCartModalProps {
    product: ProductCardProduct;
    currencySymbol: string;
    onClose: () => void;
    onAddToCart: (item: CartItem) => void;
}

export default function AddToCartModal({
    product,
    currencySymbol,
    onClose,
    onAddToCart,
}: AddToCartModalProps) {
    const variants = product.variants ?? [];
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
        variants[0]?.id ?? null,
    );
    const [qty, setQty] = useState(1);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, [onClose]);

    const activeVariant = variants.find((v) => v.id === selectedVariantId);
    const displayPrice = activeVariant?.price_override ?? product.sale_price;
    const discounted = calcDiscountedPrice(
        displayPrice,
        product.discount_type,
        product.discount_value,
    );
    const hasDiscount = discounted !== null && discounted < displayPrice;
    const finalPrice = hasDiscount ? discounted! : displayPrice;

    const stockQty = activeVariant?.stock_qty ?? product.stock_qty;
    const inStock = stockQty > 0;

    const attrKeys = variants[0]?.attributes
        ? Object.keys(variants[0].attributes)
        : [];

    const handleAdd = () => {
        if (!inStock) return;
        const variantLabel = activeVariant
            ? attrKeys.map((k) => activeVariant.attributes[k]).join(" / ")
            : undefined;

        onAddToCart({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: finalPrice,
            image: product.primary_image,
            qty,
            variantId: selectedVariantId ?? undefined,
            variantLabel,
        });
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal — centered on desktop, bottom sheet on mobile */}
            <div className="fixed inset-x-0 bottom-0 z-[90] mx-auto w-full max-w-md rounded-t-2xl bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-900">
                        Add to Cart
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 space-y-5">
                    {/* Product summary */}
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                            {product.primary_image ? (
                                <img
                                    src={`/storage/${product.primary_image}`}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Tag size={22} className="text-gray-300" />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            {product.category && (
                                <p className="mb-0.5 text-xs font-medium text-indigo-500">
                                    {product.category.name}
                                </p>
                            )}
                            <p className="line-clamp-2 text-sm font-semibold text-gray-800 leading-snug">
                                {product.name}
                            </p>
                            <div className="mt-1.5 flex items-baseline gap-2">
                                <span className="text-xl font-extrabold text-gray-900">
                                    {formatPrice(currencySymbol, finalPrice)}
                                </span>
                                {hasDiscount && (
                                    <span className="text-sm text-gray-400 line-through">
                                        {formatPrice(
                                            currencySymbol,
                                            displayPrice,
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Variant picker */}
                    {variants.length > 0 &&
                        attrKeys.map((attrKey) => {
                            const uniqueValues = [
                                ...new Set(
                                    variants.map((v) => v.attributes[attrKey]),
                                ),
                            ];
                            return (
                                <div key={attrKey}>
                                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        {attrKey}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueValues.map((val) => {
                                            const match = variants.find(
                                                (v) =>
                                                    v.attributes[attrKey] ===
                                                    val,
                                            );
                                            const isSelected =
                                                match?.id === selectedVariantId;
                                            const unavailable =
                                                !match || match.stock_qty <= 0;

                                            return (
                                                <button
                                                    key={val}
                                                    disabled={unavailable}
                                                    onClick={() =>
                                                        match &&
                                                        setSelectedVariantId(
                                                            match.id,
                                                        )
                                                    }
                                                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                                                        unavailable
                                                            ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 line-through"
                                                            : isSelected
                                                              ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                                                              : "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                                                    }`}
                                                >
                                                    {val}
                                                    {match?.price_override &&
                                                        !unavailable && (
                                                            <span
                                                                className={`ml-1.5 text-xs ${isSelected ? "text-indigo-200" : "text-indigo-500"}`}
                                                            >
                                                                {formatPrice(
                                                                    currencySymbol,
                                                                    match.price_override,
                                                                )}
                                                            </span>
                                                        )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                    {/* Quantity */}
                    <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Quantity
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() =>
                                        setQty((q) => Math.max(1, q - 1))
                                    }
                                    disabled={qty <= 1}
                                    className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    <Minus size={15} />
                                </button>
                                <span className="flex h-10 w-12 items-center justify-center border-x border-gray-200 text-base font-semibold text-gray-900">
                                    {qty}
                                </span>
                                <button
                                    onClick={() =>
                                        setQty((q) => Math.min(stockQty, q + 1))
                                    }
                                    disabled={qty >= stockQty}
                                    className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    <Plus size={15} />
                                </button>
                            </div>
                            <span className="text-sm text-gray-500">
                                {inStock ? (
                                    <span className="text-green-600 font-medium">
                                        {stockQty} in stock
                                    </span>
                                ) : (
                                    <span className="text-red-500 font-medium">
                                        Out of stock
                                    </span>
                                )}
                            </span>
                        </div>
                        {/* Description preview */}
                        {product.description && (
                            <div className="rounded-lg bg-gray-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                                    Description
                                </p>
                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                                    {product.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-5 py-4 flex items-center gap-3">
                    <Link
                        href={route("public.products.show", product.slug)}
                        onClick={onClose}
                        className="flex h-12 flex-1 items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        View Details
                    </Link>
                    <button
                        disabled={!inStock}
                        onClick={handleAdd}
                        className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
                            inStock
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
                                : "cursor-not-allowed bg-gray-100 text-gray-400"
                        }`}
                    >
                        <ShoppingCart size={16} />
                        {inStock ? "Add to Cart" : "Out of Stock"}
                    </button>
                </div>
            </div>
        </>
    );
}
