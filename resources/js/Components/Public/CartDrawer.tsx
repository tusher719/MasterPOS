// resources/js/Components/Public/CartDrawer.tsx

import { formatPrice } from "@/Components/Public/ProductCard";
import { useCart } from "@/hooks/useCart";
import { Link } from "@inertiajs/react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";

interface CartDrawerProps {
    open: boolean;
    onClose: () => void;
    currencySymbol?: string;
}

export default function CartDrawer({
    open,
    onClose,
    currencySymbol = "৳",
}: CartDrawerProps) {
    const { items, updateQty, removeItem, clearCart, cartCount, subtotal } =
        useCart();

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">
                                    Shopping Cart
                                </h2>
                                <p className="text-xs text-gray-500 font-medium">
                                    {cartCount} {cartCount === 1 ? "item" : "items"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    {items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4 animate-pulse">
                                <ShoppingBag size={36} />
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 mb-1">
                                Your cart is empty
                            </h3>
                            <p className="text-sm text-gray-500 max-w-xs mb-6">
                                Looks like you haven't added any products to your cart yet.
                            </p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                            >
                                Start Shopping
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Items list */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-gray-100 space-y-4">
                                {items.map((item) => (
                                    <div
                                        key={`${item.id}-${item.variantId ?? "default"}`}
                                        className="pt-4 first:pt-0 flex gap-4"
                                    >
                                        {/* Image */}
                                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                                            {item.image ? (
                                                <img
                                                    src={`/storage/${item.image}`}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover object-center"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                    <ShoppingBag size={24} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex flex-1 flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                                                        {item.name}
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeItem(
                                                                item.id,
                                                                item.variantId,
                                                            )
                                                        }
                                                        className="text-gray-400 hover:text-red-500 transition p-1"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                {item.variantLabel && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {item.variantLabel}
                                                    </p>
                                                )}
                                                <p className="text-sm font-bold text-indigo-600 mt-1">
                                                    {formatPrice(
                                                        currencySymbol,
                                                        item.price,
                                                    )}
                                                </p>
                                            </div>

                                            {/* Quantity selector */}
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50/50">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQty(
                                                                item.id,
                                                                item.variantId,
                                                                item.qty - 1,
                                                            )
                                                        }
                                                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg transition"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-bold text-gray-800">
                                                        {item.qty}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQty(
                                                                item.id,
                                                                item.variantId,
                                                                item.qty + 1,
                                                            )
                                                        }
                                                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg transition"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                <span className="text-xs font-medium text-gray-400 ml-auto">
                                                    Total:{" "}
                                                    <strong className="text-gray-700">
                                                        {formatPrice(
                                                            currencySymbol,
                                                            item.price *
                                                                item.qty,
                                                        )}
                                                    </strong>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/60">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-gray-600">
                                        Subtotal
                                    </span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {formatPrice(
                                            currencySymbol,
                                            subtotal,
                                        )}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-5">
                                    Shipping & taxes calculated at checkout.
                                </p>

                                <div className="space-y-2.5">
                                    <Link
                                        href={route("public.checkout.index")}
                                        onClick={onClose}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                                    >
                                        Proceed to Checkout
                                        <ArrowRight size={16} />
                                    </Link>

                                    <div className="flex items-center justify-between pt-1">
                                        <button
                                            type="button"
                                            onClick={clearCart}
                                            className="text-xs font-medium text-gray-400 hover:text-red-500 transition"
                                        >
                                            Clear All Items
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="text-xs font-semibold text-indigo-600 hover:underline"
                                        >
                                            Continue Shopping
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
