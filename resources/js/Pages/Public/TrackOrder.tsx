// resources/js/Pages/Public/TrackOrder.tsx

import { formatPrice } from "@/Components/Public/ProductCard";
import PublicLayout from "@/Layouts/PublicLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    HelpCircle,
    MapPin,
    Package,
    Phone,
    Search,
    ShieldAlert,
    Truck,
    XCircle,
} from "lucide-react";
import { useState } from "react";

interface TimelineStep {
    title: string;
    description: string;
    completed: boolean;
    current: boolean;
    date?: string | null;
}

interface TrackedOrderItem {
    id: number;
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    variant_label?: string | null;
}

interface TrackedOrder {
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
    courier_provider?: string | null;
    courier_tracking_id?: string | null;
    courier_status?: string | null;
    timeline: TimelineStep[];
    is_cancelled: boolean;
    is_returned: boolean;
    customer_name: string;
    items: TrackedOrderItem[];
}

interface TrackOrderProps {
    initialQuery: string;
    searched: boolean;
    orders: TrackedOrder[];
    settings: {
        business_name: string;
        currency_symbol: string;
        contact_phone?: string | null;
        contact_email?: string | null;
    };
}

export default function TrackOrder({
    initialQuery,
    searched,
    orders,
    settings,
}: TrackOrderProps) {
    const currency = settings.currency_symbol ?? "৳";
    const [query, setQuery] = useState(initialQuery);
    const [searching, setSearching] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        router.get(
            route("public.track-order"),
            { q: query.trim() },
            {
                preserveScroll: true,
                onFinish: () => setSearching(false),
            },
        );
    };

    return (
        <PublicLayout>
            <Head title="Track Order - Live Order Status" />

            <div className="mx-auto max-w-screen-lg px-4 py-10 sm:px-6 lg:px-8">
                {/* ── Header ── */}
                <div className="text-center max-w-xl mx-auto mb-10">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <Truck size={28} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Track Your Order
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Enter your Order Reference Number (e.g. SL-20261026-0001) or
                        your Contact Phone Number to view live order progress.
                    </p>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="mt-6 flex gap-2">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                required
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Order Reference (SL-...) or Phone (017...)"
                                className="w-full rounded-2xl border border-gray-200 pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none shadow-xs"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={searching}
                            className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50 shrink-0"
                        >
                            {searching ? "Searching..." : "Track"}
                        </button>
                    </form>
                </div>

                {/* ── Search Results ── */}
                {searched && orders.length === 0 && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-xs max-w-lg mx-auto">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                            <AlertCircle size={28} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                            No Orders Found
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            We couldn't find any orders matching "{query}". Please double-check your
                            order reference number or phone number.
                        </p>
                        {settings.contact_phone && (
                            <p className="text-xs text-gray-500">
                                Need help? Call our support team at{" "}
                                <strong className="text-indigo-600">
                                    {settings.contact_phone}
                                </strong>
                            </p>
                        )}
                    </div>
                )}

                {/* ── Orders Found ── */}
                {orders.length > 0 && (
                    <div className="space-y-8">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden"
                            >
                                {/* Top bar */}
                                <div className="border-b border-gray-100 bg-gray-50/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <span className="text-xs text-gray-400 block">
                                            Order Reference
                                        </span>
                                        <span className="font-mono text-base font-bold text-indigo-600">
                                            {order.reference_no}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">
                                            Ordered: <strong>{order.sale_date}</strong>
                                        </span>
                                        <span
                                            className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold ${
                                                order.order_status === "delivered"
                                                    ? "bg-green-100 text-green-800"
                                                    : order.order_status === "cancelled"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-indigo-100 text-indigo-800"
                                            }`}
                                        >
                                            {order.order_status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Cancelled Alert */}
                                    {order.is_cancelled && (
                                        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-100">
                                            <XCircle size={18} />
                                            <span>
                                                This order has been cancelled. Please contact customer
                                                support if you have any questions.
                                            </span>
                                        </div>
                                    )}

                                    {/* Timeline progress steps */}
                                    {!order.is_cancelled && (
                                        <div className="py-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-5">
                                                Order Progress
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                                                {order.timeline.map((step, idx) => (
                                                    <div
                                                        key={step.title}
                                                        className={`relative flex flex-col p-3 rounded-xl border transition ${
                                                            step.current
                                                                ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600"
                                                                : step.completed
                                                                ? "border-green-200 bg-green-50/20"
                                                                : "border-gray-100 bg-gray-50/40 opacity-60"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            {step.completed ? (
                                                                <CheckCircle2
                                                                    size={16}
                                                                    className="text-green-600 shrink-0"
                                                                />
                                                            ) : step.current ? (
                                                                <Clock
                                                                    size={16}
                                                                    className="text-indigo-600 shrink-0 animate-spin"
                                                                />
                                                            ) : (
                                                                <span className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />
                                                            )}
                                                            <span
                                                                className={`text-xs font-bold ${
                                                                    step.current
                                                                        ? "text-indigo-700"
                                                                        : step.completed
                                                                        ? "text-green-700"
                                                                        : "text-gray-500"
                                                                }`}
                                                            >
                                                                {step.title}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 leading-relaxed">
                                                            {step.description}
                                                        </p>
                                                        {step.date && (
                                                            <span className="text-[10px] text-gray-400 mt-2">
                                                                {step.date}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Courier details banner */}
                                    {order.courier_provider && (
                                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                                                    <Truck size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">
                                                        Courier Service:{" "}
                                                        <strong className="text-gray-900">
                                                            {order.courier_provider}
                                                        </strong>
                                                    </p>
                                                    {order.courier_tracking_id && (
                                                        <p className="text-xs font-mono font-bold text-indigo-700">
                                                            Tracking ID: {order.courier_tracking_id}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Order items and summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
                                        {/* Items list */}
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                                                <Package size={14} />
                                                Items in this shipment
                                            </h4>
                                            <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                                                {order.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="py-2.5 flex justify-between items-center text-xs"
                                                    >
                                                        <div>
                                                            <p className="font-semibold text-gray-900">
                                                                {item.name}
                                                            </p>
                                                            {item.variant_label && (
                                                                <p className="text-gray-400">
                                                                    {item.variant_label}
                                                                </p>
                                                            )}
                                                            <span className="text-gray-500">
                                                                Qty: {item.quantity} ×{" "}
                                                                {formatPrice(
                                                                    currency,
                                                                    item.unit_price,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <span className="font-bold text-gray-900">
                                                            {formatPrice(
                                                                currency,
                                                                item.subtotal,
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Delivery & Payment info */}
                                        <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl text-xs">
                                            <div className="flex items-start gap-2">
                                                <MapPin
                                                    size={14}
                                                    className="text-gray-400 mt-0.5 shrink-0"
                                                />
                                                <div>
                                                    <span className="font-bold text-gray-800">
                                                        {order.customer_name}
                                                    </span>{" "}
                                                    ({order.delivery_contact_phone})
                                                    {order.delivery_address && (
                                                        <p className="text-gray-500 mt-0.5">
                                                            {order.delivery_address}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                                <CreditCard
                                                    size={14}
                                                    className="text-gray-400 shrink-0"
                                                />
                                                <span className="text-gray-600">
                                                    Payment:{" "}
                                                    <strong className="text-gray-800">
                                                        {order.payment_type === "cash_on_delivery"
                                                            ? "Cash on Delivery"
                                                            : "Online Payment"}
                                                    </strong>{" "}
                                                    ({order.payment_status.toUpperCase()})
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-sm font-bold text-gray-900">
                                                <span>Total Payable:</span>
                                                <span className="text-indigo-600 text-base">
                                                    {formatPrice(
                                                        currency,
                                                        order.grand_total,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
