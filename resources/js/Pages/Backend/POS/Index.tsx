import React, { useState, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { toast } from "sonner";
import axios from "axios";
import ProductSearch from "./_components/ProductSearch";
import ProductGrid, { Product } from "./_components/ProductGrid";
import CartSidebar from "./_components/CartSidebar";
import { CartItemRow } from "./_components/CartItem";
import CheckoutPanel from "./_components/CheckoutPanel";
import ReceiptModal from "./_components/ReceiptModal";

export interface Customer {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
}

export interface PaymentMethod {
    id: number;
    name: string;
}

interface Props {
    products: Product[];
    customers: Customer[];
    paymentMethods: PaymentMethod[];
    can: {
        create: boolean;
        delete: boolean;
        restore: boolean;
    };
}

export default function POSIndex({
    products,
    customers,
    paymentMethods,
    can,
}: Props) {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const categories = useMemo(() => {
        const cats = products
            .map((p) => p.category)
            .filter((c): c is string => !!c);
        return [...new Set(cats)].sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch =
                !search ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
            const matchesCategory =
                !selectedCategory || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, search, selectedCategory]);

    const [cartItems, setCartItems] = useState<CartItemRow[]>([]);

    const handleAddToCart = (product: Product) => {
        setCartItems((prev) => {
            const existing = prev.find((i) => i.product_id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock_qty) {
                    toast.warning("Maximum stock reached for " + product.name);
                    return prev;
                }
                return prev.map((i) =>
                    i.product_id === product.id
                        ? {
                              ...i,
                              quantity: i.quantity + 1,
                              subtotal:
                                  i.unit_price * (i.quantity + 1) - i.discount,
                          }
                        : i,
                );
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    unit_price: product.sale_price,
                    quantity: 1,
                    discount: 0,
                    stock_qty: product.stock_qty,
                    unit: product.unit,
                    subtotal: product.sale_price,
                },
            ];
        });
        toast.success(product.name + " added to cart");
    };

    const handleUpdateItem = (
        productId: number,
        updates: Partial<CartItemRow>,
    ) => {
        setCartItems((prev) =>
            prev.map((i) =>
                i.product_id === productId ? { ...i, ...updates } : i,
            ),
        );
    };

    const handleRemoveItem = (productId: number) => {
        setCartItems((prev) => prev.filter((i) => i.product_id !== productId));
    };

    const handleClearCart = () => setCartItems([]);

    const subtotal = useMemo(
        () => cartItems.reduce((sum, i) => sum + i.subtotal, 0),
        [cartItems],
    );

    const [customerId, setCustomerId] = useState<number | null>(null);
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [note, setNote] = useState("");
    const [processing, setProcessing] = useState(false);

    const grandTotal = useMemo(
        () => Math.max(0, subtotal - discount + tax),
        [subtotal, discount, tax],
    );
    const dueAmount = useMemo(
        () => Math.max(0, grandTotal - paidAmount),
        [grandTotal, paidAmount],
    );

    const paymentStatus: "paid" | "partial" | "due" = useMemo(() => {
        if (paidAmount <= 0) return "due";
        if (paidAmount >= grandTotal) return "paid";
        return "partial";
    }, [paidAmount, grandTotal]);

    const [receiptSale, setReceiptSale] = useState<any>(null);

    const handleCheckout = async () => {
        if (!can.create) {
            toast.error("You do not have permission to create sales.");
            return;
        }
        if (cartItems.length === 0) {
            toast.error("Cart is empty.");
            return;
        }

        setProcessing(true);
        try {
            const payload = {
                customer_id: customerId,
                sale_date: new Date().toISOString().split("T")[0],
                payment_method_id: paymentMethodId,
                discount,
                tax,
                paid_amount: paidAmount,
                note,
                items: cartItems.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    discount: i.discount,
                })),
            };

            const response = await axios.post(
                route("backend.pos.sales.store"),
                payload,
            );
            const customer = customers.find((c) => c.id === customerId);
            const method = paymentMethods.find((m) => m.id === paymentMethodId);

            setReceiptSale({
                id: response.data?.id ?? 0,
                reference_no: response.data?.reference_no ?? "",
                sale_date: payload.sale_date,
                customer_name: customer?.name ?? null,
                payment_method: method?.name ?? null,
                subtotal,
                discount,
                tax,
                grand_total: grandTotal,
                paid_amount: paidAmount,
                due_amount: dueAmount,
                payment_status: paymentStatus,
                items: cartItems,
                note: note || null,
            });

            toast.success("Sale completed successfully!");
        } catch (error: any) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                const first = Object.values(errors)[0] as string[];
                toast.error(first[0] ?? "Validation error.");
            } else {
                toast.error("Failed to complete sale. Please try again.");
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleNewSale = () => {
        setReceiptSale(null);
        setCartItems([]);
        setCustomerId(null);
        setPaymentMethodId(null);
        setDiscount(0);
        setTax(0);
        setPaidAmount(0);
        setNote("");
        router.reload({ only: ["products"] });
    };

    return (
        <AuthenticatedLayout>
            <Head title="POS Terminal" />
            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                <div className="flex flex-1 flex-col overflow-hidden border-r border-gray-200 bg-gray-50">
                    <div className="border-b border-gray-200 bg-white px-5 py-4">
                        <h1 className="text-2xl font-bold text-gray-800">
                            POS Terminal
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {filteredProducts.length} products available
                        </p>
                    </div>
                    <div className="border-b border-gray-200 bg-white px-5 py-3">
                        <ProductSearch
                            search={search}
                            onSearchChange={setSearch}
                            selectedCategory={selectedCategory}
                            onCategoryChange={setSelectedCategory}
                            categories={categories}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <ProductGrid
                            products={filteredProducts}
                            onAddToCart={handleAddToCart}
                        />
                    </div>
                </div>

                <div className="flex w-72 flex-col border-r border-gray-200 bg-white xl:w-80">
                    <CartSidebar
                        items={cartItems}
                        onUpdateItem={handleUpdateItem}
                        onRemoveItem={handleRemoveItem}
                        onClearCart={handleClearCart}
                        subtotal={subtotal}
                    />
                </div>

                <div className="flex w-72 flex-col border-l border-gray-200 bg-white xl:w-80">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <h2 className="font-semibold text-gray-800">
                            Checkout
                        </h2>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <CheckoutPanel
                            customers={customers}
                            paymentMethods={paymentMethods}
                            customerId={customerId}
                            paymentMethodId={paymentMethodId}
                            discount={discount}
                            tax={tax}
                            paidAmount={paidAmount}
                            note={note}
                            subtotal={subtotal}
                            grandTotal={grandTotal}
                            dueAmount={dueAmount}
                            paymentStatus={paymentStatus}
                            processing={processing}
                            cartEmpty={cartItems.length === 0}
                            onCustomerChange={setCustomerId}
                            onPaymentMethodChange={setPaymentMethodId}
                            onDiscountChange={setDiscount}
                            onTaxChange={setTax}
                            onPaidAmountChange={setPaidAmount}
                            onNoteChange={setNote}
                            onCheckout={handleCheckout}
                        />
                    </div>
                </div>
            </div>

            {receiptSale && (
                <ReceiptModal
                    sale={receiptSale}
                    businessName="Master POS"
                    onClose={() => setReceiptSale(null)}
                    onNewSale={handleNewSale}
                />
            )}
        </AuthenticatedLayout>
    );
}
