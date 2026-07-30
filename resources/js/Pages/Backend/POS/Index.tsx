import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CartItemRow } from "./_components/CartItem";
import CartSidebar from "./_components/CartSidebar";
import CheckoutPanel from "./_components/CheckoutPanel";
import HoldOrdersDrawer, { HoldOrder } from "./_components/HoldOrdersDrawer";
import ProductGrid, { Product } from "./_components/ProductGrid";
import ProductSearch from "./_components/ProductSearch";
import ReceiptModal from "./_components/ReceiptModal";
import VariantPickerModal from "./_components/VariantPickerModal";

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
    const { settings } = usePage().props as any;

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

    // ── Cart ─────────────────────────────────────────────────────────
    const [cartItems, setCartItems] = useState<CartItemRow[]>([]);

    const handleAddToCart = (product: Product) => {
        // If product has variants → open picker modal first
        if (
            product.has_variants &&
            product.variants &&
            product.variants.length > 0
        ) {
            setVariantPickerProduct(product);
            return;
        }
        addToCartDirect(
            product,
            null,
            null,
            product.sale_price,
            product.stock_qty,
        );
    };

    const addToCartDirect = (
        product: Product,
        variantId: number | null,
        variantLabel: string | null,
        unitPrice: number,
        stockQty: number,
    ) => {
        setCartItems((prev) => {
            const existing = prev.find(
                (i) =>
                    i.product_id === product.id && i.variant_id === variantId,
            );
            if (existing) {
                if (existing.quantity >= stockQty) {
                    toast.warning("Maximum stock reached for " + product.name);
                    return prev;
                }
                return prev.map((i) =>
                    i.product_id === product.id && i.variant_id === variantId
                        ? {
                              ...i,
                              quantity: i.quantity + 1,
                              subtotal:
                                  unitPrice * (i.quantity + 1) - i.discount,
                          }
                        : i,
                );
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    variant_id: variantId,
                    variant_label: variantLabel,
                    name: product.name,
                    unit_price: unitPrice,
                    quantity: 1,
                    discount: 0,
                    stock_qty: stockQty,
                    unit: product.unit,
                    subtotal: unitPrice,
                },
            ];
        });
        toast.success(
            product.name +
                (variantLabel ? ` (${variantLabel})` : "") +
                " added to cart",
        );
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

    const subtotal = useMemo(
        () => cartItems.reduce((sum, i) => sum + i.subtotal, 0),
        [cartItems],
    );

    // ── Checkout state ───────────────────────────────────────────────
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

    // ── Hold Orders state ────────────────────────────────────────────
    const [showHoldDrawer, setShowHoldDrawer] = useState(false);
    const [resumedHoldOrderId, setResumedHoldOrderId] = useState<number | null>(
        null,
    );
    const [holdCount, setHoldCount] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const [variantPickerProduct, setVariantPickerProduct] =
        useState<Product | null>(null);

    useEffect(() => {
        fetchHoldCount();
    }, []);

    const fetchHoldCount = async () => {
        try {
            const res = await axios.get(
                route("backend.pos.hold-orders.index"),
                { params: { per_page: 1 } },
            );
            setHoldCount(res.data.total ?? 0);
        } catch {
            // silent fail — not critical
        }
    };

    const handleReleaseHoldOrder = async () => {
        if (!resumedHoldOrderId) return;
        try {
            await axios.post(
                route("backend.pos.hold-orders.release", resumedHoldOrderId),
            );
        } catch {
            // silent — best effort
        } finally {
            setResumedHoldOrderId(null);
        }
    };

    // Clear cart manually — release the resumed hold order first, if any
    const handleClearCart = async () => {
        if (resumedHoldOrderId) {
            await handleReleaseHoldOrder();
        }
        setCartItems([]);
        setCustomerId(null);
        setDiscount(0);
        setTax(0);
    };

    const handleHoldOrder = async () => {
        if (cartItems.length === 0) return;

        setIsHolding(true);
        try {
            const payload = {
                customer_id: customerId,
                note: note || "",
                subtotal,
                discount,
                tax,
                grand_total: grandTotal,
                items: cartItems.map((i) => ({
                    product_id: i.product_id,
                    variant_id: i.variant_id ?? null,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    discount: i.discount,
                })),
            };

            await axios.post(route("backend.pos.hold-orders.store"), payload);

            toast.success("Order held successfully.");
            fetchHoldCount();

            // Fresh hold (not a resumed one) — just clear the working cart
            setCartItems([]);
            setCustomerId(null);
            setDiscount(0);
            setTax(0);
            setNote("");
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? "Failed to hold order.";
            toast.error(msg);
        } finally {
            setIsHolding(false);
        }
    };

    const handleResumeHoldOrder = (holdOrder: HoldOrder) => {
        // Restore cart from the hold order.
        // NOTE: holdOrder.items comes from the API with Laravel decimal-cast
        // fields (unit_price, discount, subtotal) serialized as STRINGS.
        // These must be normalized to Number() here — otherwise the later
        // `cartItems.reduce((sum, i) => sum + i.subtotal, 0)` in this
        // component does string concatenation instead of addition, which
        // breaks subtotal/grandTotal/dueAmount everywhere downstream.
        setCartItems(
            holdOrder.items.map((item) => {
                // Defensive: if the backend ever sends the raw `unit`
                // relation object instead of its name string, unwrap it
                // here so the UI never renders "[object Object]".
                const rawUnit: any = item.unit;
                const unitName =
                    rawUnit && typeof rawUnit === "object"
                        ? (rawUnit.name ?? null)
                        : rawUnit;

                return {
                    product_id: item.product_id,
                    name: item.name,
                    unit_price: Number(item.unit_price),
                    quantity: Number(item.quantity),
                    discount: Number(item.discount),
                    subtotal: Number(item.subtotal),
                    stock_qty: item.stock_qty,
                    unit: unitName,
                };
            }),
        );

        setCustomerId(holdOrder.customer?.id ?? null);
        setDiscount(Number(holdOrder.discount));
        setTax(Number(holdOrder.tax));
        setNote(holdOrder.note ?? "");
        setResumedHoldOrderId(holdOrder.id);

        setShowHoldDrawer(false);
        toast.success("Hold order resumed. Complete checkout to convert.");
    };

    // ── Checkout submit ──────────────────────────────────────────────
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

            // After a successful sale — delete the resumed hold order, if any
            if (resumedHoldOrderId) {
                try {
                    await axios.delete(
                        route(
                            "backend.pos.hold-orders.destroy",
                            resumedHoldOrderId,
                        ),
                    );
                    setResumedHoldOrderId(null);
                    fetchHoldCount();
                } catch {
                    // silent — hold order cleanup is non-critical
                }
            }
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
        setResumedHoldOrderId(null);
        router.reload({ only: ["products"] });
    };

    return (
        <AuthenticatedLayout>
            <Head title="POS Terminal" />
            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                <div className="flex flex-1 flex-col overflow-hidden border-r border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                POS Terminal
                            </h1>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {filteredProducts.length} products available
                            </p>
                        </div>

                        {/* Hold Orders Drawer Trigger */}
                        <button
                            onClick={() => setShowHoldDrawer(true)}
                            className="relative flex items-center gap-1.5 rounded-lg border border-gray-200
                                       bg-white px-3 py-1.5 text-sm font-medium text-gray-600
                                       hover:bg-gray-50 transition-colors"
                        >
                            <span>Held Orders</span>
                            {holdCount > 0 && (
                                <span
                                    className="flex h-5 min-w-5 items-center justify-center rounded-full
                                                 bg-amber-500 px-1 text-xs font-bold text-white"
                                >
                                    {holdCount}
                                </span>
                            )}
                        </button>
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
                        onHoldOrder={handleHoldOrder}
                        isHolding={isHolding}
                        cartHasItems={cartItems.length > 0}
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

            {/* Variant Picker Modal */}
            {variantPickerProduct && (
                <VariantPickerModal
                    productName={variantPickerProduct.name}
                    variants={variantPickerProduct.variants ?? []}
                    onSelect={(variant) => {
                        addToCartDirect(
                            variantPickerProduct,
                            variant.id,
                            variant.label,
                            Number(
                                variant.price_override ??
                                    variantPickerProduct.sale_price,
                            ),
                            variant.stock_qty,
                        );
                        setVariantPickerProduct(null);
                    }}
                    onClose={() => setVariantPickerProduct(null)}
                />
            )}

            {receiptSale && (
                <ReceiptModal
                    sale={receiptSale}
                    businessName={settings?.business_name ?? "Master POS"}
                    onClose={() => setReceiptSale(null)}
                    onNewSale={handleNewSale}
                />
            )}

            {/* Hold Orders Drawer */}
            <HoldOrdersDrawer
                open={showHoldDrawer}
                onClose={() => setShowHoldDrawer(false)}
                onResume={handleResumeHoldOrder}
                onCountChange={setHoldCount}
                resumedHoldOrderId={resumedHoldOrderId}
            />
        </AuthenticatedLayout>
    );
}
