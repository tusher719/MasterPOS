import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CartItemRow } from "./_components/CartItem";
import CartSidebar from "./_components/CartSidebar";
import CheckoutPanel from "./_components/CheckoutPanel";
import HoldOrdersDrawer, { HoldOrder } from "./_components/HoldOrdersDrawer";
import OrderBlockedModal from "./_components/OrderBlockedModal";
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

export interface PaymentMethodBank {
    id: number;
    bank_name: string;
    account_number: string | null;
    account_name: string | null;
    charge_type: "percent" | "fixed" | null;
    charge_value: number;
    charge_enabled: boolean;
    charge_label: string | null;
    is_active: boolean;
}

export interface PaymentMethod {
    id: number;
    name: string;
    type: string | null; // 'cash' | 'mobile_banking' | 'bank_transfer' | etc.
    charge_enabled: boolean;
    online_charge_type: "percent" | "fixed" | null;
    online_charge_value: number;
    charge_label: string | null;
    banks: PaymentMethodBank[];
}

export type PaymentType = "full_paid" | "half_paid" | "cash_on_delivery";

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

// ── Charge helpers ────────────────────────────────────────────────────────────

/**
 * Calculate charge for a payment method (non-bank-transfer).
 * Mirrors PaymentMethod::calculateCharge() on the backend.
 */
export function calcMethodCharge(
    method: PaymentMethod,
    subtotal: number,
): number {
    if (!method.charge_enabled) return 0;
    if (method.online_charge_type === "percent") {
        return parseFloat(
            ((subtotal * method.online_charge_value) / 100).toFixed(2),
        );
    }
    if (method.online_charge_type === "fixed") {
        return Number(method.online_charge_value);
    }
    return 0;
}

/**
 * Calculate charge for a specific bank under bank_transfer.
 * Mirrors PaymentMethodBank::calculateCharge() on the backend.
 */
export function calcBankCharge(
    bank: PaymentMethodBank,
    subtotal: number,
): number {
    if (!bank.charge_enabled) return 0;
    if (bank.charge_type === "percent") {
        return parseFloat(((subtotal * bank.charge_value) / 100).toFixed(2));
    }
    if (bank.charge_type === "fixed") {
        return Number(bank.charge_value);
    }
    return 0;
}

// ─────────────────────────────────────────────────────────────────────────────

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

    // ── Cart ──────────────────────────────────────────────────────────────────
    const [cartItems, setCartItems] = useState<CartItemRow[]>([]);

    const handleAddToCart = (product: Product) => {
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
        const minQty = Math.max(1, Number(product.min_sale_qty) || 1);

        setCartItems((prev) => {
            const existing = prev.find(
                (i) =>
                    i.product_id === product.id && i.variant_id === variantId,
            );

            if (existing) {
                const newQty = existing.quantity + minQty;
                if (newQty > stockQty) {
                    toast.warning("Maximum stock reached for " + product.name);
                    return prev;
                }
                return prev.map((i) =>
                    i.product_id === product.id && i.variant_id === variantId
                        ? {
                              ...i,
                              quantity: newQty,
                              subtotal: unitPrice * newQty - i.discount,
                          }
                        : i,
                );
            }

            if (minQty > stockQty) {
                toast.warning(
                    `Minimum order quantity (${minQty}) exceeds available stock (${stockQty}) for ${product.name}`,
                );
                return prev;
            }

            return [
                ...prev,
                {
                    product_id: product.id,
                    variant_id: variantId,
                    variant_label: variantLabel,
                    name: product.name,
                    unit_price: unitPrice,
                    quantity: minQty,
                    min_sale_qty: minQty,
                    discount: 0,
                    stock_qty: stockQty,
                    unit: product.unit,
                    subtotal: unitPrice * minQty,
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

    // ── Checkout state ────────────────────────────────────────────────────────
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
    const [paymentMethodBankId, setPaymentMethodBankId] = useState<
        number | null
    >(null);
    const [paymentType, setPaymentType] = useState<PaymentType | null>(null);
    const [paymentCharge, setPaymentCharge] = useState(0);
    const [transactionId, setTransactionId] = useState("");
    const [paymentReference, setPaymentReference] = useState("");
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [note, setNote] = useState("");
    const [processing, setProcessing] = useState(false);
    const [sendEmailConfirmation, setSendEmailConfirmation] = useState(false);

    // Layer 1 validation errors returned from backend (422 layer1_errors).
    // Cleared on every new checkout attempt and on cart reset.
    const [layer1Errors, setLayer1Errors] = useState<Record<string, string>>(
        {},
    );

    // Layer 2/3 fraud block — backend returns layer2_blocked বা layer3_blocked
    // এই state true হলে OrderBlockedModal দেখায়
    const [orderBlocked, setOrderBlocked] = useState(false);

    // grandTotal includes paymentCharge
    const grandTotal = useMemo(
        () => Math.max(0, subtotal - discount + tax + paymentCharge),
        [subtotal, discount, tax, paymentCharge],
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

    // ── Auto-recalculate charge when method / bank changes ────────────────────
    const handlePaymentMethodChange = (id: number | null) => {
        setPaymentMethodId(id);
        setPaymentMethodBankId(null); // reset bank on method change
        setTransactionId("");
        setPaymentReference("");

        if (!id) {
            setPaymentCharge(0);
            return;
        }
        const method = paymentMethods.find((m) => m.id === id);
        if (!method) {
            setPaymentCharge(0);
            return;
        }
        // bank_transfer charge is applied at bank level — reset here, set on bank select
        if (method.type === "bank_transfer") {
            setPaymentCharge(0);
        } else {
            const base = Math.max(0, subtotal - discount + tax);
            setPaymentCharge(calcMethodCharge(method, base));
        }
    };

    const handleBankChange = (bankId: number | null) => {
        setPaymentMethodBankId(bankId);
        if (!bankId || !paymentMethodId) {
            setPaymentCharge(0);
            return;
        }
        const method = paymentMethods.find((m) => m.id === paymentMethodId);
        const bank = method?.banks.find((b) => b.id === bankId);
        if (!bank) {
            setPaymentCharge(0);
            return;
        }
        const base = Math.max(0, subtotal - discount + tax);
        setPaymentCharge(calcBankCharge(bank, base));
    };

    // Re-calc charge whenever subtotal / discount / tax change
    useEffect(() => {
        if (!paymentMethodId) return;
        const method = paymentMethods.find((m) => m.id === paymentMethodId);
        if (!method) return;
        const base = Math.max(0, subtotal - discount + tax);

        if (method.type === "bank_transfer" && paymentMethodBankId) {
            const bank = method.banks.find((b) => b.id === paymentMethodBankId);
            if (bank) setPaymentCharge(calcBankCharge(bank, base));
        } else if (method.type !== "bank_transfer") {
            setPaymentCharge(calcMethodCharge(method, base));
        }
    }, [subtotal, discount, tax]);

    // ── Payment type selection ─────────────────────────────────────────────────
    const handlePaymentTypeChange = (type: PaymentType) => {
        setPaymentType(type);
        if (type === "cash_on_delivery") {
            setPaidAmount(0);
            setPaymentMethodId(null);
            setPaymentMethodBankId(null);
            setPaymentCharge(0);
            setTransactionId("");
            setPaymentReference("");
        } else if (type === "full_paid") {
            setPaidAmount(grandTotal);
        } else if (type === "half_paid") {
            setPaidAmount(parseFloat((grandTotal / 2).toFixed(2)));
        }
    };

    // Keep full_paid amount in sync if grandTotal changes after selection
    useEffect(() => {
        if (paymentType === "full_paid") {
            setPaidAmount(grandTotal);
        }
    }, [grandTotal, paymentType]);

    const [receiptSale, setReceiptSale] = useState<any>(null);

    // ── Hold Orders state ─────────────────────────────────────────────────────
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
            // silent fail
        }
    };

    const handleReleaseHoldOrder = async () => {
        if (!resumedHoldOrderId) return;
        try {
            await axios.post(
                route("backend.pos.hold-orders.release", resumedHoldOrderId),
            );
        } catch {
            // silent
        } finally {
            setResumedHoldOrderId(null);
        }
    };

    const resetCheckoutState = () => {
        setCartItems([]);
        setCustomerId(null);
        setPaymentMethodId(null);
        setPaymentMethodBankId(null);
        setPaymentType(null);
        setPaymentCharge(0);
        setTransactionId("");
        setPaymentReference("");
        setDiscount(0);
        setTax(0);
        setPaidAmount(0);
        setNote("");
        setSendEmailConfirmation(false);
        // Clear any Layer 1 errors from the previous attempt
        setLayer1Errors({});
        setOrderBlocked(false);
    };

    const handleClearCart = async () => {
        if (resumedHoldOrderId) {
            await handleReleaseHoldOrder();
        }
        resetCheckoutState();
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
            resetCheckoutState();
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? "Failed to hold order.";
            toast.error(msg);
        } finally {
            setIsHolding(false);
        }
    };

    const handleResumeHoldOrder = (holdOrder: HoldOrder) => {
        setCartItems(
            holdOrder.items.map((item) => {
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
                    min_sale_qty: 1,
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
        // Reset payment selections — staff chooses fresh on checkout
        setPaymentType(null);
        setPaymentMethodId(null);
        setPaymentMethodBankId(null);
        setPaymentCharge(0);
        setPaidAmount(0);
        setTransactionId("");
        setPaymentReference("");
        // Clear any stale Layer 1 errors from the previous cart session
        setLayer1Errors({});

        setShowHoldDrawer(false);
        toast.success("Hold order resumed. Complete checkout to convert.");
    };

    // ── Checkout submit ───────────────────────────────────────────────────────
    const handleCheckout = async () => {
        if (!can.create) {
            toast.error("You do not have permission to create sales.");
            return;
        }
        if (cartItems.length === 0) {
            toast.error("Cart is empty.");
            return;
        }
        if (!paymentType) {
            toast.error("Please select a payment type (Full / Half / COD).");
            return;
        }
        if (paymentType !== "cash_on_delivery" && !paymentMethodId) {
            toast.error("Please select a payment method.");
            return;
        }

        // Clear previous Layer 1 errors before each new attempt
        setLayer1Errors({});
        setProcessing(true);

        try {
            const isCOD = paymentType === "cash_on_delivery";
            const selectedMethod = paymentMethods.find(
                (m) => m.id === paymentMethodId,
            );
            const selectedCustomer = customers.find((c) => c.id === customerId);

            const payload = {
                customer_id: customerId,
                // Pass the registered customer's phone so Layer1ValidationService
                // can validate it on the backend (walk-in phone not collected in POS UI)
                customer_phone: selectedCustomer?.phone ?? null,
                sale_date: new Date().toISOString().split("T")[0],
                payment_type: paymentType,
                payment_method_id: isCOD ? null : paymentMethodId,
                payment_method_bank_id: isCOD
                    ? null
                    : (paymentMethodBankId ?? null),
                payment_charge: isCOD ? 0 : paymentCharge,
                payment_reference: isCOD ? null : paymentReference || null,
                transaction_id: isCOD ? null : transactionId || null,
                discount,
                tax,
                paid_amount: isCOD ? 0 : paidAmount,
                note,
                send_email_confirmation: sendEmailConfirmation,
                items: cartItems.map((i) => ({
                    product_id: i.product_id,
                    variant_id: i.variant_id ?? null,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    discount: i.discount,
                })),
            };

            const response = await axios.post(
                route("backend.pos.sales.store"),
                payload,
            );

            setReceiptSale({
                id: response.data?.id ?? 0,
                reference_no: response.data?.reference_no ?? "",
                sale_date: payload.sale_date,
                customer_name: selectedCustomer?.name ?? null,
                payment_method: isCOD
                    ? "Cash on Delivery"
                    : (selectedMethod?.name ?? null),
                payment_type: paymentType,
                subtotal,
                discount,
                tax,
                payment_charge: isCOD ? 0 : paymentCharge,
                grand_total: grandTotal,
                paid_amount: isCOD ? 0 : paidAmount,
                due_amount: dueAmount,
                payment_status: paymentStatus,
                items: cartItems,
                note: note || null,
            });

            toast.success("Sale completed successfully!");

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
                    // silent
                }
            }
        } catch (error: any) {
            if (error.response?.status === 422) {
                const data = error.response.data;

                // Layer 1 fraud validation failure — backend returns
                // {layer1_errors: {phone: '...', customer_name: '...', delivery_address: '...'}}
                // Display errors in CheckoutPanel's error block.
                if (data.layer1_errors) {
                    setLayer1Errors(data.layer1_errors);
                    const count = Object.keys(data.layer1_errors).length;
                    toast.error(
                        `Order blocked: ${count} validation issue${count > 1 ? "s" : ""} found. See checkout panel.`,
                        { duration: 5000 },
                    );
                    return;
                }

                // Layer 2 (IP limit exceeded) বা Layer 3 (low success ratio) block
                // Backend response: {layer2_blocked: true} বা {layer3_blocked: true}
                if (data.layer2_blocked || data.layer3_blocked) {
                    setOrderBlocked(true);
                    return;
                }

                // Standard Laravel validation error (non-Layer-1)
                const errors = data.errors ?? {};
                const first = Object.values(errors)[0] as string[];
                toast.error(first?.[0] ?? "Validation error.");
            } else {
                toast.error("Failed to complete sale. Please try again.");
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleNewSale = () => {
        setReceiptSale(null);
        resetCheckoutState();
        setResumedHoldOrderId(null);
        router.reload({ only: ["products"] });
    };

    return (
        <AuthenticatedLayout>
            <Head title="POS Terminal" />
            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                {/* ── Left: Product browser ── */}
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

                {/* ── Middle: Cart ── */}
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

                {/* ── Right: Checkout ── */}
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
                            paymentMethodBankId={paymentMethodBankId}
                            paymentType={paymentType}
                            paymentCharge={paymentCharge}
                            transactionId={transactionId}
                            paymentReference={paymentReference}
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
                            onPaymentMethodChange={handlePaymentMethodChange}
                            onPaymentMethodBankChange={handleBankChange}
                            onPaymentTypeChange={handlePaymentTypeChange}
                            onTransactionIdChange={setTransactionId}
                            onPaymentReferenceChange={setPaymentReference}
                            onDiscountChange={setDiscount}
                            onTaxChange={setTax}
                            onPaidAmountChange={setPaidAmount}
                            onNoteChange={setNote}
                            sendEmailConfirmation={sendEmailConfirmation}
                            onSendEmailConfirmationChange={
                                setSendEmailConfirmation
                            }
                            selectedCustomerEmail={
                                customers.find((c) => c.id === customerId)
                                    ?.email ?? null
                            }
                            onCheckout={handleCheckout}
                            layer1Errors={layer1Errors}
                        />
                    </div>
                </div>
            </div>

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

            <HoldOrdersDrawer
                open={showHoldDrawer}
                onClose={() => setShowHoldDrawer(false)}
                onResume={handleResumeHoldOrder}
                onCountChange={setHoldCount}
                resumedHoldOrderId={resumedHoldOrderId}
            />

            {/* Order blocked popup — Layer 2 বা Layer 3 fraud block এ trigger হয় */}
            <OrderBlockedModal
                isOpen={orderBlocked}
                onClose={() => setOrderBlocked(false)}
            />
        </AuthenticatedLayout>
    );
}
