import React, { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

export interface CartItemRow {
    product_id: number;
    name: string;
    unit_price: number;
    quantity: number;
    discount: number;
    stock_qty: number;
    unit: string | null;
    subtotal: number;
}

interface Props {
    item: CartItemRow;
    onUpdate: (updates: Partial<CartItemRow>) => void;
    onRemove: () => void;
}

export default function CartItem({ item, onUpdate, onRemove }: Props) {
    const [isLeaving, setIsLeaving] = useState(false);

    const unitPrice = Number(item.unit_price);
    const itemSubtotal = Number(item.subtotal);
    const itemDiscount = Number(item.discount);

    const handleQtyChange = (delta: number) => {
        const newQty = item.quantity + delta;
        if (newQty < 1) return;
        if (newQty > item.stock_qty) return;
        const subtotal = unitPrice * newQty - itemDiscount;
        onUpdate({ quantity: newQty, subtotal: Math.max(0, subtotal) });
    };

    const handleDiscountChange = (value: string) => {
        const discount = parseFloat(value) || 0;
        const maxDiscount = unitPrice * item.quantity;
        const capped = Math.min(discount, maxDiscount);
        const subtotal = unitPrice * item.quantity - capped;
        onUpdate({ discount: capped, subtotal: Math.max(0, subtotal) });
    };

    const handleRemoveClick = () => setIsLeaving(true);

    return (
        <div
            className={`transition-all duration-300 ease-in-out ${
                isLeaving
                    ? "max-h-0 -translate-x-3 scale-95 overflow-hidden opacity-0"
                    : "max-h-96 translate-x-0 scale-100 opacity-100"
            }`}
            style={{
                animation: !isLeaving ? "cartItemIn 0.25s ease-out" : undefined,
            }}
            onTransitionEnd={() => {
                if (isLeaving) onRemove();
            }}
        >
            <style>{`
                @keyframes cartItemIn {
                    0% { opacity: 0; transform: translateY(-6px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                            {item.name}
                        </p>
                        <p className="text-xs text-gray-400">
                            ৳{unitPrice.toFixed(2)}
                            {item.unit ? ` / ${item.unit}` : ""}
                        </p>
                    </div>
                    <button
                        onClick={handleRemoveClick}
                        className="group rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                        <Trash2
                            size={14}
                            className="transition-transform duration-200 ease-out group-hover:rotate-12 group-hover:scale-110"
                        />
                    </button>
                </div>

                <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center rounded-md border border-gray-200 transition-colors hover:border-indigo-300">
                        <button
                            onClick={() => handleQtyChange(-1)}
                            disabled={item.quantity <= 1}
                            className="flex h-7 w-7 items-center justify-center rounded-l-md text-gray-500 transition-colors hover:bg-gray-100 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Minus size={12} />
                        </button>
                        <input
                            type="number"
                            min={1}
                            max={item.stock_qty}
                            value={item.quantity}
                            onChange={(e) => {
                                const qty = parseInt(e.target.value) || 1;
                                const capped = Math.min(qty, item.stock_qty);
                                const subtotal =
                                    unitPrice * capped - itemDiscount;
                                onUpdate({
                                    quantity: capped,
                                    subtotal: Math.max(0, subtotal),
                                });
                            }}
                            className="h-7 w-12 border-x border-gray-200 text-center text-sm focus:outline-none focus:ring-0"
                        />
                        <button
                            onClick={() => handleQtyChange(1)}
                            disabled={item.quantity >= item.stock_qty}
                            className="flex h-7 w-7 items-center justify-center rounded-r-md text-gray-500 transition-colors hover:bg-gray-100 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Plus size={12} />
                        </button>
                    </div>

                    <div className="flex flex-1 items-center gap-1">
                        <span className="text-xs text-gray-400">Disc:</span>
                        <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                ৳
                            </span>
                            <input
                                type="number"
                                min={0}
                                max={unitPrice * item.quantity}
                                value={item.discount || ""}
                                onChange={(e) =>
                                    handleDiscountChange(e.target.value)
                                }
                                placeholder="0"
                                className="h-7 w-full rounded-md border border-gray-200 pl-5 pr-2 text-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-1.5 flex justify-end">
                    <span
                        key={item.subtotal}
                        className="text-sm font-semibold text-indigo-600 transition-all"
                        style={{ animation: "cartItemIn 0.2s ease-out" }}
                    >
                        ৳{itemSubtotal.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    );
}
