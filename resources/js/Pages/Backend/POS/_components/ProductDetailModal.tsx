import React, { useState } from "react";
import {
    X,
    ChevronLeft,
    ChevronRight,
    ShoppingCart,
    ImageOff,
    Star,
    Tag,
    Package,
    Ruler,
} from "lucide-react";
import { Product } from "./ProductGrid";

interface Props {
    product: Product;
    onClose: () => void;
    onAddToCart: (product: Product) => void;
}

export default function ProductDetailModal({
    product,
    onClose,
    onAddToCart,
}: Props) {
    const images =
        product.images && product.images.length > 0
            ? product.images
            : product.image
              ? [product.image]
              : [];

    const [index, setIndex] = useState(0);
    const outOfStock = product.stock_qty <= 0;

    const goPrev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
    const goNext = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

    const hasDiscount =
        !!product.discount_type &&
        product.discount_type !== "none" &&
        (product.discount_value ?? 0) > 0;

    const discountedPrice = hasDiscount
        ? product.discount_type === "percentage"
            ? product.sale_price -
              (product.sale_price * (product.discount_value ?? 0)) / 100
            : Math.max(0, product.sale_price - (product.discount_value ?? 0))
        : product.sale_price;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: "modalPop 0.2s ease-out" }}
            >
                <style>{`
                    @keyframes modalPop {
                        0% { opacity: 0; transform: scale(0.95) translateY(6px); }
                        100% { opacity: 1; transform: scale(1) translateY(0); }
                    }
                `}</style>

                {/* ── Image Slider ── */}
                <div className="relative h-56 w-full flex-shrink-0 bg-gray-100">
                    {images.length > 0 ? (
                        <img
                            src={`/storage/${images[index]}`}
                            alt={product.name}
                            className="h-full w-full object-cover transition-opacity duration-200"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <ImageOff size={40} />
                        </div>
                    )}

                    {product.is_featured && (
                        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-white shadow">
                            <Star size={11} fill="currentColor" />
                            Featured
                        </span>
                    )}

                    <button
                        onClick={onClose}
                        className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-gray-600 shadow hover:bg-white"
                    >
                        <X size={16} />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={goPrev}
                                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-700 shadow transition-transform hover:scale-110 hover:bg-white"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={goNext}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-700 shadow transition-transform hover:scale-110 hover:bg-white"
                            >
                                <ChevronRight size={18} />
                            </button>

                            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                                {images.map((_, i) => (
                                    <span
                                        key={i}
                                        className={`h-1.5 rounded-full transition-all ${
                                            i === index
                                                ? "w-4 bg-white"
                                                : "w-1.5 bg-white/60"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Details (scrollable) ── */}
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            {product.name}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {product.sku && (
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                                    SKU: {product.sku}
                                </span>
                            )}
                            {product.barcode && (
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                                    {product.barcode}
                                </span>
                            )}
                            {product.category && (
                                <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                                    <Tag size={10} />
                                    {product.category}
                                </span>
                            )}
                        </div>
                    </div>

                    {product.description && (
                        <p className="text-sm leading-relaxed text-gray-600">
                            {product.description}
                        </p>
                    )}

                    {/* Price + Stock */}
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                        <div>
                            <p className="text-xs text-gray-400">Price</p>
                            {hasDiscount ? (
                                <div className="flex items-baseline gap-1.5">
                                    <p className="text-xl font-bold text-indigo-600">
                                        ৳{discountedPrice.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-400 line-through">
                                        ৳{product.sale_price.toFixed(2)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xl font-bold text-indigo-600">
                                    ৳{product.sale_price.toFixed(2)}
                                </p>
                            )}
                            {product.unit && (
                                <p className="text-xs text-gray-400">
                                    per {product.unit}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Stock</p>
                            <p
                                className={`font-semibold ${
                                    outOfStock
                                        ? "text-red-500"
                                        : "text-green-600"
                                }`}
                            >
                                {outOfStock
                                    ? "Out of stock"
                                    : product.stock_qty}
                            </p>
                            {product.min_sale_qty &&
                                product.min_sale_qty > 1 && (
                                    <p className="text-xs text-gray-400">
                                        Min qty: {product.min_sale_qty}
                                    </p>
                                )}
                        </div>
                    </div>

                    {/* Extra meta: weight */}
                    {product.weight ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Ruler size={13} className="text-gray-400" />
                            Weight: {product.weight} {product.weight_unit ?? ""}
                        </div>
                    ) : null}

                    {product.is_taxable && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Package size={13} className="text-gray-400" />
                            Taxable product
                        </div>
                    )}

                    <button
                        onClick={() => {
                            if (outOfStock) return;
                            onAddToCart(product);
                            onClose();
                        }}
                        disabled={outOfStock}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600
                                   py-3 text-sm font-semibold text-white transition-colors
                                   hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ShoppingCart size={16} />
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}
