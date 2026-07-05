import React, { useState } from "react";
import { ShoppingCart, AlertTriangle, Check, Info } from "lucide-react";
import ProductDetailModal from "./ProductDetailModal";

export interface Product {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    sale_price: number;
    cost_price: number;
    stock_qty: number;
    low_stock_threshold: number | null;
    min_sale_qty: number | null;
    category: string | null;
    unit: string | null;
    description: string | null;
    weight: number | null;
    weight_unit: string | null;
    is_featured: boolean;
    is_taxable: boolean;
    discount_type: string | null;
    discount_value: number | null;
    image: string | null;
    images: string[];
}

interface Props {
    products: Product[];
    onAddToCart: (product: Product) => void;
}

export default function ProductGrid({ products, onAddToCart }: Props) {
    const [pulseId, setPulseId] = useState<number | null>(null);
    const [detailProduct, setDetailProduct] = useState<Product | null>(null);

    const handleAdd = (product: Product) => {
        if (product.stock_qty <= 0) return;
        onAddToCart(product);
        setPulseId(product.id);
        window.setTimeout(() => {
            setPulseId((prev) => (prev === product.id ? null : prev));
        }, 700);
    };

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <ShoppingCart size={48} className="mb-3 opacity-30" />
                <p className="text-sm">No products found</p>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes badgeIn {
                    0% { opacity: 0; transform: translateY(-4px) scale(0.7); }
                    15% { opacity: 1; transform: translateY(0) scale(1.05); }
                    25% { transform: scale(1); }
                    80% { opacity: 1; }
                    100% { opacity: 0; transform: translateY(-4px) scale(0.9); }
                }
            `}</style>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((product) => {
                    const outOfStock = product.stock_qty <= 0;
                    const isLowStock =
                        !outOfStock &&
                        product.low_stock_threshold !== null &&
                        product.stock_qty <= product.low_stock_threshold;
                    const isPulsing = pulseId === product.id;

                    return (
                        <div
                            key={product.id}
                            role="button"
                            tabIndex={outOfStock ? -1 : 0}
                            onClick={() => handleAdd(product)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleAdd(product);
                                }
                            }}
                            style={{ WebkitTapHighlightColor: "transparent" }}
                            className={`
                                group relative flex select-none flex-col overflow-hidden rounded-xl
                                border bg-white p-3 text-left shadow-sm outline-none transition-all
                                duration-200 ease-out focus-visible:ring-2 focus-visible:ring-indigo-300
                                ${
                                    outOfStock
                                        ? "cursor-not-allowed opacity-50"
                                        : "cursor-pointer hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-lg active:scale-95 active:shadow-sm"
                                }
                            `}
                        >
                            {/* ── Info Button ── */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailProduct(product);
                                }}
                                title="View details"
                                className="absolute right-1.5 top-1.5 z-10 rounded-full bg-white/90 p-1
                                           text-gray-400 shadow-sm transition-colors hover:bg-white hover:text-indigo-600"
                            >
                                <Info size={13} />
                            </button>

                            {/* ── Product Image ── */}
                            <div className="mb-2 flex h-20 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                                {product.image ? (
                                    <img
                                        src={`/storage/${product.image}`}
                                        alt={product.name}
                                        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                                    />
                                ) : (
                                    <ShoppingCart
                                        size={24}
                                        className="text-gray-300 transition-transform duration-300 group-hover:scale-110"
                                    />
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* ── Product Info ── */}
                                <p className="line-clamp-2 text-xs font-medium text-gray-800 leading-tight">
                                    {product.name}
                                </p>

                                {product.sku && (
                                    <p className="mt-0.5 text-xs text-gray-400">
                                        ({product.sku})
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* ── Price ── */}
                                <p className="mt-1.5 text-sm font-bold text-indigo-600 transition-colors group-hover:text-indigo-700">
                                    ৳{product.sale_price.toFixed(2)}
                                </p>

                                {/* ── Stock Badge ── */}
                                <div className="mt-1.5">
                                    {outOfStock ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                                            Out of Stock
                                        </span>
                                    ) : isLowStock ? (
                                        <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">
                                            <AlertTriangle size={10} />
                                            Low: {product.stock_qty}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                            Stock: {product.stock_qty}
                                        </span>
                                    )}
                                </div>

                                {/* ── Out of Stock Overlay ── */}
                                {outOfStock && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
                                        <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                                            Out of Stock
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ── Added-to-cart Corner Badge (doesn't cover the card) ── */}
                            {isPulsing && (
                                <div
                                    className="pointer-events-none absolute right-2 bottom-2 z-10 flex items-center gap-1
                                               rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-lg"
                                    style={{
                                        animation:
                                            "badgeIn 0.7s ease-out forwards",
                                    }}
                                >
                                    <Check size={12} />
                                    Added
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {detailProduct && (
                <ProductDetailModal
                    product={detailProduct}
                    onClose={() => setDetailProduct(null)}
                    onAddToCart={onAddToCart}
                />
            )}
        </>
    );
}
