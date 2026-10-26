// resources/js/Pages/Public/OrderConfirmed.tsx

import { formatPrice } from "@/Components/Public/ProductCard";
import PublicLayout from "@/Layouts/PublicLayout";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowRight,
    CheckCircle,
    Copy,
    CreditCard,
    Home,
    MapPin,
    Package,
    Phone,
    Printer,
    ShoppingBag,
    Truck,
} from "lucide-react";
import { useState } from "react";

interface OrderItem {
    id: number;
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    variant_label?: string | null;
}

interface SaleData {
    id: number;
    reference_no: string;
    sale_date: string;
    subtotal: number;
    delivery_charge: number;
    grand_total: number;
    payment_status: string;
    order_status: string;
    payment_type: string;
    delivery_type: string;
    delivery_address: string | null;
    delivery_contact_phone: string;
    note: string | null;
    customer: {
        name: string;
        phone: string;
        email?: string | null;
    } | null;
    payment_method: string;
    items: OrderItem[];
}

interface OrderConfirmedProps {
    sale: SaleData;
    settings: {
        business_name: string;
        currency_symbol: string;
    };
}

export default function OrderConfirmed({ sale, settings }: OrderConfirmedProps) {
    const currency = settings.currency_symbol ?? "৳";
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(sale.reference_no);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDeliveryType = (type: string) => {
        switch (type) {
            case "inside_dhaka":
                return "Inside Dhaka (24-48 Hours)";
            case "outside_dhaka":
                return "Outside Dhaka (2-4 Days)";
            case "store_pickup":
                return "Store Pickup";
            default:
                return type;
        }
    };

    return (
        <PublicLayout>
            <Head title={`Order Confirmed - ${sale.reference_no}`} />

            <div className="mx-auto max-w-screen-md px-4 py-12 sm:px-6">
                {/* ── Success banner ── */}
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 shadow-xs">
                        <CheckCircle size={44} />
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800 mb-2">
                        Order Placed Successfully
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Thank you for your order!
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                        We have received your order and are currently processing it.
                        Our customer service team may contact you shortly for verification.
                    </p>

                    {/* Reference pill */}
                    <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800">
                        <span className="text-gray-400 font-normal">Reference:</span>
                        <span className="font-mono text-indigo-600 text-base">
                            {sale.reference_no}
                        </span>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-white transition"
                            title="Copy reference"
                        >
                            <Copy size={15} />
                        </button>
                        {copied && (
                            <span className="text-xs text-green-600 font-bold ml-1">
                                Copied!
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Order Details Card ── */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden mb-6">
                    {/* Header */}
                    <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs text-gray-400">Order Date</p>
                            <p className="text-sm font-bold text-gray-800">
                                {sale.sale_date}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                Status: {sale.order_status.toUpperCase()}
                            </span>
                            <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                Payment: {sale.payment_status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Delivery & Customer Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                                    <MapPin size={14} />
                                    Delivery Address
                                </h3>
                                <p className="text-sm font-semibold text-gray-800">
                                    {sale.customer?.name}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                                    <Phone size={13} className="text-gray-400" />
                                    {sale.delivery_contact_phone}
                                </p>
                                {sale.delivery_address && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {sale.delivery_address}
                                    </p>
                                )}
                            </div>

                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                                    <Truck size={14} />
                                    Shipping & Payment
                                </h3>
                                <p className="text-sm font-semibold text-gray-800">
                                    {formatDeliveryType(sale.delivery_type)}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                                    <CreditCard size={13} className="text-gray-400" />
                                    {sale.payment_method}
                                </p>
                                {sale.note && (
                                    <p className="text-xs text-gray-500 italic mt-2 bg-gray-50 p-2 rounded-lg">
                                        Note: "{sale.note}"
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Items Receipt Table */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                                <Package size={14} />
                                Ordered Items
                            </h3>
                            <div className="divide-y divide-gray-100">
                                {sale.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="py-3 flex items-center justify-between gap-4"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {item.name}
                                            </p>
                                            {item.variant_label && (
                                                <p className="text-xs text-gray-500">
                                                    {item.variant_label}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Qty: {item.quantity} ×{" "}
                                                {formatPrice(
                                                    currency,
                                                    item.unit_price,
                                                )}
                                            </p>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">
                                            {formatPrice(
                                                currency,
                                                item.subtotal,
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-semibold text-gray-900">
                                    {formatPrice(currency, sale.subtotal)}
                                </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Delivery Fee</span>
                                <span className="font-semibold text-gray-900">
                                    {sale.delivery_charge > 0
                                        ? formatPrice(
                                              currency,
                                              sale.delivery_charge,
                                          )
                                        : "Free"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
                                <span>Total Amount</span>
                                <span className="text-xl text-indigo-600 font-extrabold">
                                    {formatPrice(currency, sale.grand_total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition"
                    >
                        <Printer size={16} />
                        Print Order Slip
                    </button>

                    <Link
                        href={route("public.products.index")}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-2xs hover:bg-indigo-700 transition"
                    >
                        Continue Shopping
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}
