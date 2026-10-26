import { CartItem } from "@/types/public";
import { useEffect, useState } from "react";

const CART_STORAGE_KEY = "masterpos_public_cart";
const CART_EVENT = "masterpos:cart-updated";

function getStoredCart(): CartItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveCart(items: CartItem[]) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: items }));
    } catch (e) {
        console.error("Failed to save cart to localStorage", e);
    }
}

export function useCart() {
    const [items, setItems] = useState<CartItem[]>(getStoredCart);

    useEffect(() => {
        // Sync on mount
        setItems(getStoredCart());

        const handleSync = () => {
            setItems(getStoredCart());
        };

        window.addEventListener(CART_EVENT, handleSync);
        window.addEventListener("storage", handleSync);

        return () => {
            window.removeEventListener(CART_EVENT, handleSync);
            window.removeEventListener("storage", handleSync);
        };
    }, []);

    const addItem = (newItem: CartItem) => {
        const current = getStoredCart();
        const existingIndex = current.findIndex(
            (i) =>
                i.id === newItem.id &&
                (i.variantId ?? null) === (newItem.variantId ?? null),
        );

        let updated: CartItem[];
        if (existingIndex > -1) {
            updated = [...current];
            updated[existingIndex].qty += newItem.qty;
        } else {
            updated = [...current, newItem];
        }

        saveCart(updated);
        setItems(updated);
    };

    const addItems = (newItems: CartItem[]) => {
        let updated = [...getStoredCart()];
        for (const newItem of newItems) {
            const existingIndex = updated.findIndex(
                (i) =>
                    i.id === newItem.id &&
                    (i.variantId ?? null) === (newItem.variantId ?? null),
            );
            if (existingIndex > -1) {
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    qty: updated[existingIndex].qty + newItem.qty,
                };
            } else {
                updated.push(newItem);
            }
        }
        saveCart(updated);
        setItems(updated);
    };

    const updateQty = (
        id: number,
        variantId: number | undefined,
        qty: number,
    ) => {
        if (qty <= 0) {
            removeItem(id, variantId);
            return;
        }

        const current = getStoredCart();
        const updated = current.map((item) => {
            if (
                item.id === id &&
                (item.variantId ?? null) === (variantId ?? null)
            ) {
                return { ...item, qty };
            }
            return item;
        });

        saveCart(updated);
        setItems(updated);
    };

    const removeItem = (id: number, variantId: number | undefined) => {
        const current = getStoredCart();
        const updated = current.filter(
            (item) =>
                !(
                    item.id === id &&
                    (item.variantId ?? null) === (variantId ?? null)
                ),
        );

        saveCart(updated);
        setItems(updated);
    };

    const clearCart = () => {
        saveCart([]);
        setItems([]);
    };

    const cartCount = items.reduce((sum, item) => sum + (item.qty || 0), 0);
    const subtotal = items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 0),
        0,
    );

    return {
        items,
        addItem,
        addItems,
        updateQty,
        removeItem,
        clearCart,
        cartCount,
        subtotal,
    };
}
