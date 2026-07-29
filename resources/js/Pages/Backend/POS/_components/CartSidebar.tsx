import { usePage } from "@inertiajs/react";
import { Pause, ShoppingCart, Trash2 } from "lucide-react";
import CartItem, { CartItemRow } from "./CartItem";

interface Props {
    items: CartItemRow[];
    onUpdateItem: (productId: number, updates: Partial<CartItemRow>) => void;
    onRemoveItem: (productId: number) => void;
    onClearCart: () => void;
    subtotal: number;
    onHoldOrder: () => void;
    isHolding: boolean;
    cartHasItems: boolean;
}

export default function CartSidebar({
    items,
    onUpdateItem,
    onRemoveItem,
    onClearCart,
    subtotal,
    onHoldOrder,
    isHolding,
    cartHasItems,
}: Props) {
    const { settings } = usePage().props as any;
    const currency = settings?.currency_symbol ?? "৳";
    return (
        <div className="flex h-full flex-col">
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                    <ShoppingCart size={18} className="text-indigo-600" />
                    <h2 className="font-semibold text-gray-800">Cart</h2>
                    {items.length > 0 && (
                        <span
                            key={items.length}
                            className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 transition-transform"
                            style={{ animation: "badgeBump 0.3s ease-out" }}
                        >
                            {items.length}
                        </span>
                    )}
                </div>
                {items.length > 0 && (
                    <button
                        onClick={onClearCart}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50"
                    >
                        <Trash2 size={12} />
                        Clear
                    </button>
                )}
            </div>

            <style>{`
                @keyframes badgeBump {
                    0% { transform: scale(0.6); }
                    60% { transform: scale(1.25); }
                    100% { transform: scale(1); }
                }

                /* Remove native up/down spinner arrows from number inputs
                   (Chrome, Safari, Edge) */
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                /* Firefox */
                input[type="number"] {
                    -moz-appearance: textfield;
                }
            `}</style>

            {/* ── Cart Items ── */}
            <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <ShoppingCart size={40} className="mb-2 opacity-20" />
                        <p className="text-sm">Cart is empty</p>
                        <p className="text-xs text-gray-400">
                            Click a product to add
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {items.map((item) => (
                            <CartItem
                                key={item.product_id}
                                item={item}
                                onUpdate={(updates) =>
                                    onUpdateItem(item.product_id, updates)
                                }
                                onRemove={() => onRemoveItem(item.product_id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Subtotal ── */}
            {items.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            Subtotal (
                            {items.reduce((s, i) => s + i.quantity, 0)} items)
                        </span>
                        <span className="font-bold text-gray-800">
                            {currency}
                            {Number(subtotal).toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            {/* ── Hold Order Actions ── */}
            {cartHasItems && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                    {/* Compact Button */}
                    <button
                        onClick={onHoldOrder}
                        disabled={isHolding}
                        className="flex w-full items-center justify-center gap-2 rounded-lg
                        border border-blue-300 bg-white px-4 py-2
                        text-sm font-medium text-blue-700
                        hover:bg-blue-50 transition-colors
                        disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Pause className="h-4 w-4 text-blue-600" />
                        <span>
                            {isHolding ? "Holding…" : "Hold Current Order"}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
