import { formatPrice } from "@/Components/Public/ProductCard";
import { useCart } from "@/hooks/useCart";
import PublicLayout from "@/Layouts/PublicLayout";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    MapPin,
    Package,
    Phone,
    Printer,
    RotateCcw,
    ShieldCheck,
    ShoppingBag,
    Tag,
    Truck,
    User,
    XCircle,
} from "lucide-react";
import React, { useState } from "react";

interface OrderDetailItem {
    id: number;
    product_id: number;
    product_name: string;
    product_slug?: string | null;
    image?: string | null;
    variant_id?: number | null;
    variant_name?: string | null;
    quantity: number;
    unit_price: number;
    discount: number;
    subtotal: number;
    in_stock: boolean;
}

interface OrderPayment {
    id: number;
    amount: number;
    method: string;
    payment_date?: string | null;
}

interface OrderDetailProps {
    sale: {
        id: number;
        uuid: string;
        reference_no: string;
        sale_date: string;
        subtotal: number;
        discount: number;
        coupon_code?: string | null;
        coupon_discount: number;
        delivery_charge: number;
        grand_total: number;
        paid_amount: number;
        due_amount: number;
        payment_status: "paid" | "partial" | "due";
        order_status: "pending" | "processing" | "completed" | "cancelled" | "hold";
        delivery_type: "inside_dhaka" | "outside_dhaka" | "store_pickup";
        delivery_address?: string | null;
        delivery_contact_phone?: string | null;
        delivery_status?: string | null;
        courier_name?: string | null;
        tracking_id?: string | null;
        note?: string | null;
        created_at?: string;
    };
    items: OrderDetailItem[];
    payments: OrderPayment[];
    settings: {
        business_name: string;
        currency_symbol: string;
    };
}

export default function OrderDetail({
    sale,
    items,
    payments,
    settings,
}: OrderDetailProps) {
    const currency = settings.currency_symbol ?? "৳";
    const { addItems } = useCart();

    const [reordering, setReordering] = useState(false);
    const [reorderStatus, setReorderStatus] = useState<string | null>(null);

    const handleReorder = async () => {
        setReordering(true);
        setReorderStatus(null);
        try {
            const res = await axios.post(
                route("customer.orders.reorder", sale.reference_no),
            );
            if (res.data.success && res.data.items?.length > 0) {
                addItems(res.data.items);
                window.dispatchEvent(new CustomEvent("masterpos:open-cart"));
                setReorderStatus(
                    `Added ${res.data.items.length} items to your cart!`,
                );
            }
        } catch (error) {
            console.error("Reorder failed", error);
            setReorderStatus("Could not reorder items. Please try again.");
        } finally {
            setReordering(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </span>
                );
            case "processing":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-600/20">
                        <Clock className="h-3.5 w-3.5 animate-pulse" /> Processing
                    </span>
                );
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-600/20">
                        <Clock className="h-3.5 w-3.5" /> Pending Confirmation
                    </span>
                );
            case "cancelled":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-600/20">
                        <XCircle className="h-3.5 w-3.5" /> Cancelled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs font-bold text-gray-700 ring-1 ring-gray-600/20">
                        {status}
                    </span>
                );
        }
    };

    return (
        <PublicLayout settings={settings as any}>
            <Head
                title={`Order #${sale.reference_no} | ${settings.business_name}`}
            />

            <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Back to Orders Bar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href={route("customer.orders")}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to My Orders
                    </Link>

                    <div className="flex items-center gap-2">
                        {/* Print Invoice button */}
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-2xs print:hidden"
                        >
                            <Printer className="h-3.5 w-3.5 text-gray-500" />
                            Print Invoice
                        </button>

                        {/* 1-Click Reorder CTA */}
                        <button
                            type="button"
                            disabled={reordering}
                            onClick={handleReorder}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50 print:hidden"
                        >
                            <RotateCcw
                                className={`h-3.5 w-3.5 ${
                                    reordering ? "animate-spin" : ""
                                }`}
                            />
                            {reordering ? "Adding..." : "1-Click Reorder"}
                        </button>
                    </div>
                </div>

                {/* Reorder Status Notification */}
                {reorderStatus && (
                    <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between text-emerald-900">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                            <p className="text-sm font-semibold">{reorderStatus}</p>
                        </div>
                        <Link
                            href={route("public.checkout.index")}
                            className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-xs"
                        >
                            View Cart & Checkout →
                        </Link>
                    </div>
                )}

                {/* Order Summary Header Card */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-100">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-black text-gray-900 sm:text-2xl">
                                    Order #{sale.reference_no}
                                </h1>
                                {getStatusBadge(sale.order_status)}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Placed on {sale.created_at ?? sale.sale_date}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-xs uppercase font-semibold text-gray-400">
                                    Grand Total
                                </p>
                                <p className="text-2xl font-black text-indigo-600">
                                    {formatPrice(currency, sale.grand_total)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Meta Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                        <div>
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Payment Status
                            </span>
                            <span
                                className={`inline-block mt-1 text-xs font-bold uppercase rounded-md px-2 py-0.5 ${
                                    sale.payment_status === "paid"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-red-50 text-red-700"
                                }`}
                            >
                                {sale.payment_status}
                            </span>
                        </div>

                        <div>
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Delivery Method
                            </span>
                            <span className="block mt-1 text-xs font-bold text-gray-800 capitalize">
                                {sale.delivery_type?.replace(/_/g, " ")}
                            </span>
                        </div>

                        <div>
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Courier Status
                            </span>
                            <span className="block mt-1 text-xs font-bold text-gray-800">
                                {sale.delivery_status ?? "Preparing Shipment"}
                            </span>
                        </div>

                        <div>
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Package Tracking
                            </span>
                            {sale.tracking_id ? (
                                <Link
                                    href={`${route("public.track-order")}?search=${sale.reference_no}`}
                                    className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                >
                                    <span>#{sale.tracking_id}</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            ) : (
                                <span className="block mt-1 text-xs text-gray-400">
                                    Pending dispatch
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Two Columns: Line Items vs Delivery & Payment Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Items List (col-span-2) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                                    Items In This Order ({items.length})
                                </h2>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-4 p-5 sm:p-6"
                                    >
                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                            {item.image ? (
                                                <img
                                                    src={`/storage/${item.image}`}
                                                    alt={item.product_name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Package className="h-6 w-6 text-gray-300" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 truncate">
                                                {item.product_name}
                                            </h3>
                                            {item.variant_name && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Variant:{" "}
                                                    <span className="font-semibold text-gray-700">
                                                        {item.variant_name}
                                                    </span>
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                Qty: {item.quantity} × {formatPrice(currency, item.unit_price)}
                                            </p>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-gray-900">
                                                {formatPrice(currency, item.subtotal)}
                                            </p>
                                            <span
                                                className={`text-[10px] font-semibold mt-0.5 block ${
                                                    item.in_stock
                                                        ? "text-emerald-600"
                                                        : "text-amber-600"
                                                }`}
                                            >
                                                {item.in_stock ? "In Stock" : "Limited Stock"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Customer Delivery Information */}
                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4 flex items-center gap-2">
                                <Truck className="h-4 w-4 text-indigo-600" /> Delivery Address & Contact
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
                                <div>
                                    <span className="block font-semibold uppercase text-[10px] text-gray-400 mb-1">
                                        Shipping Address
                                    </span>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                                        <p className="font-medium text-gray-800">
                                            {sale.delivery_address ?? "Store Pickup (In-Person Collection)"}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <span className="block font-semibold uppercase text-[10px] text-gray-400 mb-1">
                                        Recipient Phone
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                                        <p className="font-medium text-gray-800">
                                            {sale.delivery_contact_phone ?? "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {sale.note && (
                                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                                    <span className="font-semibold text-gray-700">Order Note:</span> {sale.note}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Breakdown & Payment Summary Sidebar */}
                    <div className="space-y-6">
                        {/* Price Breakdown Card */}
                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 pb-4 border-b border-gray-100">
                                Payment Summary
                            </h2>

                            <div className="space-y-3 py-4 text-xs text-gray-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-gray-900">
                                        {formatPrice(currency, sale.subtotal)}
                                    </span>
                                </div>

                                {sale.coupon_discount > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span className="flex items-center gap-1">
                                            <Tag className="h-3 w-3" /> Coupon ({sale.coupon_code})
                                        </span>
                                        <span className="font-bold">
                                            -{formatPrice(currency, sale.coupon_discount)}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span>Delivery Charge</span>
                                    <span className="font-semibold text-gray-900">
                                        {sale.delivery_charge > 0
                                            ? formatPrice(currency, sale.delivery_charge)
                                            : "Free"}
                                    </span>
                                </div>

                                <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-bold text-gray-900">
                                    <span>Grand Total</span>
                                    <span className="text-indigo-600 text-base">
                                        {formatPrice(currency, sale.grand_total)}
                                    </span>
                                </div>

                                <div className="flex justify-between pt-1">
                                    <span>Paid Amount</span>
                                    <span className="font-semibold text-emerald-600">
                                        {formatPrice(currency, sale.paid_amount)}
                                    </span>
                                </div>

                                {sale.due_amount > 0 && (
                                    <div className="flex justify-between pt-1 text-red-600 font-bold">
                                        <span>Amount Due</span>
                                        <span>{formatPrice(currency, sale.due_amount)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Reorder Button */}
                            <button
                                type="button"
                                disabled={reordering}
                                onClick={handleReorder}
                                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                            >
                                <RotateCcw
                                    className={`h-4 w-4 ${
                                        reordering ? "animate-spin" : ""
                                    }`}
                                />
                                {reordering ? "Adding to Cart..." : "Reorder All Items"}
                            </button>
                        </div>

                        {/* Payment Transactions Log */}
                        {payments.length > 0 && (
                            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-1.5">
                                    <CreditCard className="h-4 w-4 text-gray-500" /> Payment History
                                </h3>
                                <div className="space-y-2 text-xs">
                                    {payments.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {p.method}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {p.payment_date}
                                                </p>
                                            </div>
                                            <p className="font-bold text-emerald-600">
                                                {formatPrice(currency, p.amount)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
