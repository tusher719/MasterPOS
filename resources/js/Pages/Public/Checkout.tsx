// resources/js/Pages/Public/Checkout.tsx

import { formatPrice } from "@/Components/Public/ProductCard";
import { useCart } from "@/hooks/useCart";
import PublicLayout from "@/Layouts/PublicLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Home,
    MapPin,
    Package,
    Phone,
    ShieldCheck,
    ShoppingBag,
    Truck,
    User,
} from "lucide-react";
import { useState } from "react";

interface PaymentMethodOption {
    id: number;
    name: string;
    code: string;
    type: string;
}

interface CheckoutProps {
    paymentMethods: PaymentMethodOption[];
    deliveryCharges: {
        inside_dhaka: number;
        outside_dhaka: number;
        store_pickup: number;
    };
    settings: {
        business_name: string;
        currency_symbol: string;
    };
}

export default function Checkout({
    paymentMethods,
    deliveryCharges,
    settings,
}: CheckoutProps) {
    const currency = settings.currency_symbol ?? "৳";
    const { items, subtotal, cartCount, clearCart } = useCart();

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [deliveryType, setDeliveryType] = useState<
        "inside_dhaka" | "outside_dhaka" | "store_pickup"
    >("inside_dhaka");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [paymentType, setPaymentType] = useState<
        "cash_on_delivery" | "full_paid"
    >("cash_on_delivery");
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(
        paymentMethods[0]?.id ?? null,
    );
    const [note, setNote] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const currentDeliveryCharge = deliveryCharges[deliveryType] ?? 0;
    const grandTotal = subtotal + currentDeliveryCharge;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return;

        setSubmitting(true);
        setErrors({});

        router.post(
            route("public.checkout.store"),
            {
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail || null,
                delivery_type: deliveryType,
                delivery_address:
                    deliveryType === "store_pickup" ? null : deliveryAddress,
                payment_type: paymentType,
                payment_method_id:
                    paymentType === "cash_on_delivery" ? null : paymentMethodId,
                note: note || null,
                items: items.map((i) => ({
                    id: i.id,
                    qty: i.qty,
                    variantId: i.variantId ?? null,
                })),
            },
            {
                onSuccess: () => {
                    clearCart();
                },
                onError: (errs) => {
                    setErrors(errs);
                    setSubmitting(false);
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            },
        );
    };

    if (items.length === 0) {
        return (
            <PublicLayout>
                <Head title="Checkout" />
                <div className="mx-auto max-w-screen-md px-4 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <ShoppingBag size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Your Cart is Empty
                    </h2>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">
                        You need to add at least one product to your cart before you can proceed to checkout.
                    </p>
                    <Link
                        href={route("public.products.index")}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                    >
                        <ArrowLeft size={16} />
                        Explore Products
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <Head title="Checkout" />

            <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                    <Link
                        href={route("public.home")}
                        className="hover:text-indigo-600 transition"
                    >
                        Home
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-gray-800">Checkout</span>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                    {/* Left: Customer & Delivery Details */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* 1. Customer Info */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
                            <div className="flex items-center gap-2.5 mb-5 border-b border-gray-50 pb-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                    <User size={18} />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">
                                    1. Customer Information
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={customerName}
                                        onChange={(e) =>
                                            setCustomerName(e.target.value)
                                        }
                                        placeholder="e.g. Mohammad Rahman"
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    {errors.customer_name && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.customer_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone
                                            size={16}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                        />
                                        <input
                                            type="tel"
                                            required
                                            value={customerPhone}
                                            onChange={(e) =>
                                                setCustomerPhone(e.target.value)
                                            }
                                            placeholder="017xxxxxxxx"
                                            className="w-full rounded-xl border border-gray-200 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    {errors.customer_phone && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.customer_phone}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Email Address (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) =>
                                            setCustomerEmail(e.target.value)
                                        }
                                        placeholder="customer@example.com"
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    {errors.customer_email && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.customer_email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. Delivery Options */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
                            <div className="flex items-center gap-2.5 mb-5 border-b border-gray-50 pb-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                    <Truck size={18} />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">
                                    2. Delivery Method & Address
                                </h3>
                            </div>

                            {/* Radio cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                <label
                                    className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition ${
                                        deliveryType === "inside_dhaka"
                                            ? "border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="delivery_type"
                                        value="inside_dhaka"
                                        checked={deliveryType === "inside_dhaka"}
                                        onChange={() =>
                                            setDeliveryType("inside_dhaka")
                                        }
                                        className="sr-only"
                                    />
                                    <span className="text-xs font-bold text-gray-900">
                                        Inside Dhaka
                                    </span>
                                    <span className="text-sm font-extrabold text-indigo-600 mt-1">
                                        {formatPrice(
                                            currency,
                                            deliveryCharges.inside_dhaka,
                                        )}
                                    </span>
                                    <span className="text-[11px] text-gray-500 mt-1">
                                        24-48 Hours Delivery
                                    </span>
                                </label>

                                <label
                                    className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition ${
                                        deliveryType === "outside_dhaka"
                                            ? "border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="delivery_type"
                                        value="outside_dhaka"
                                        checked={deliveryType === "outside_dhaka"}
                                        onChange={() =>
                                            setDeliveryType("outside_dhaka")
                                        }
                                        className="sr-only"
                                    />
                                    <span className="text-xs font-bold text-gray-900">
                                        Outside Dhaka
                                    </span>
                                    <span className="text-sm font-extrabold text-indigo-600 mt-1">
                                        {formatPrice(
                                            currency,
                                            deliveryCharges.outside_dhaka,
                                        )}
                                    </span>
                                    <span className="text-[11px] text-gray-500 mt-1">
                                        2-4 Days Delivery
                                    </span>
                                </label>

                                <label
                                    className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition ${
                                        deliveryType === "store_pickup"
                                            ? "border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="delivery_type"
                                        value="store_pickup"
                                        checked={deliveryType === "store_pickup"}
                                        onChange={() =>
                                            setDeliveryType("store_pickup")
                                        }
                                        className="sr-only"
                                    />
                                    <span className="text-xs font-bold text-gray-900">
                                        Store Pickup
                                    </span>
                                    <span className="text-sm font-extrabold text-green-600 mt-1">
                                        Free
                                    </span>
                                    <span className="text-[11px] text-gray-500 mt-1">
                                        Collect from Outlet
                                    </span>
                                </label>
                            </div>

                            {/* Delivery Address */}
                            {deliveryType !== "store_pickup" && (
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Full Delivery Address{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={deliveryAddress}
                                        onChange={(e) =>
                                            setDeliveryAddress(e.target.value)
                                        }
                                        placeholder="House / Flat #, Road, Area, Thana, District"
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                                    />
                                    {errors.delivery_address && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.delivery_address}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Optional note */}
                            <div className="mt-3">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Special Delivery Instructions (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="e.g. Call before delivery, deliver after 3 PM"
                                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* 3. Payment Method */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
                            <div className="flex items-center gap-2.5 mb-5 border-b border-gray-50 pb-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                    <CreditCard size={18} />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">
                                    3. Payment Method
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <label
                                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                                        paymentType === "cash_on_delivery"
                                            ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment_type"
                                        value="cash_on_delivery"
                                        checked={paymentType === "cash_on_delivery"}
                                        onChange={() =>
                                            setPaymentType("cash_on_delivery")
                                        }
                                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <span className="block text-sm font-bold text-gray-900">
                                            Cash on Delivery (COD)
                                        </span>
                                        <span className="block text-xs text-gray-500 mt-0.5">
                                            Pay in cash when you receive the order at your doorstep.
                                        </span>
                                    </div>
                                </label>

                                {paymentMethods.length > 0 && (
                                    <label
                                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                                            paymentType === "full_paid"
                                                ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment_type"
                                            value="full_paid"
                                            checked={paymentType === "full_paid"}
                                            onChange={() =>
                                                setPaymentType("full_paid")
                                            }
                                            className="mt-1 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div className="flex-1">
                                            <span className="block text-sm font-bold text-gray-900">
                                                Digital / Mobile Banking
                                            </span>
                                            <span className="block text-xs text-gray-500 mt-0.5">
                                                Pay securely via bKash, Nagad, Rocket, or Bank transfer.
                                            </span>

                                            {paymentType === "full_paid" && (
                                                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {paymentMethods.map((pm) => (
                                                        <button
                                                            key={pm.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setPaymentMethodId(
                                                                    pm.id,
                                                                )
                                                            }
                                                            className={`rounded-lg p-2.5 text-xs font-semibold border text-center transition ${
                                                                paymentMethodId ===
                                                                pm.id
                                                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            {pm.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Order Summary Sticky Card */}
                    <div className="lg:col-span-5 sticky top-24">
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
                            <h3 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100 flex items-center justify-between">
                                <span>Order Summary</span>
                                <span className="text-xs font-normal text-gray-500">
                                    {cartCount} {cartCount === 1 ? "item" : "items"}
                                </span>
                            </h3>

                            {/* Item list */}
                            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto py-2">
                                {items.map((item) => (
                                    <div
                                        key={`${item.id}-${item.variantId ?? "def"}`}
                                        className="py-3 flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                                                {item.image ? (
                                                    <img
                                                        src={`/storage/${item.image}`}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <Package
                                                        size={18}
                                                        className="text-gray-300"
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">
                                                    {item.name}
                                                </h4>
                                                {item.variantLabel && (
                                                    <p className="text-[11px] text-gray-400">
                                                        {item.variantLabel}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {item.qty} ×{" "}
                                                    {formatPrice(
                                                        currency,
                                                        item.price,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-gray-900 shrink-0">
                                            {formatPrice(
                                                currency,
                                                item.price * item.qty,
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Subtotals & Grand Total */}
                            <div className="space-y-2 border-t border-gray-100 pt-4 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-gray-900">
                                        {formatPrice(currency, subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Charge</span>
                                    <span className="font-semibold text-gray-900">
                                        {currentDeliveryCharge > 0
                                            ? formatPrice(
                                                  currency,
                                                  currentDeliveryCharge,
                                              )
                                            : "Free"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-100 pt-3 text-base font-extrabold text-gray-900">
                                    <span>Total Payable</span>
                                    <span className="text-xl text-indigo-600">
                                        {formatPrice(currency, grandTotal)}
                                    </span>
                                </div>
                            </div>

                            {/* Error notices */}
                            {errors.items && (
                                <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100">
                                    {errors.items}
                                </div>
                            )}

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <span className="block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing Order...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={18} />
                                        Confirm Order (
                                        {formatPrice(currency, grandTotal)})
                                    </>
                                )}
                            </button>

                            {/* Guarantee trust badges */}
                            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
                                <ShieldCheck size={16} className="text-green-600" />
                                <span>100% Authentic Products & Safe Delivery</span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </PublicLayout>
    );
}
