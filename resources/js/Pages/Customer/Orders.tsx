import { formatPrice } from "@/Components/Public/ProductCard";
import { useCart } from "@/hooks/useCart";
import PublicLayout from "@/Layouts/PublicLayout";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    Eye,
    HelpCircle,
    LogOut,
    Package,
    RefreshCw,
    RotateCcw,
    Search,
    ShoppingBag,
    Truck,
    User,
    XCircle,
} from "lucide-react";
import React, { useState } from "react";

interface OrderItem {
    id: number;
    uuid: string;
    reference_no: string;
    sale_date: string;
    items_count: number;
    subtotal: number;
    discount: number;
    coupon_code?: string | null;
    coupon_discount: number;
    delivery_charge: number;
    grand_total: number;
    payment_status: "paid" | "partial" | "due";
    order_status: "pending" | "processing" | "completed" | "cancelled" | "hold";
    delivery_status?: string | null;
    courier_name?: string | null;
    tracking_id?: string | null;
    created_at?: string;
}

interface OrdersProps {
    customer: {
        id: number;
        name: string;
        phone: string;
        email?: string | null;
    };
    orders: {
        data: OrderItem[];
        current_page: number;
        last_page: number;
        next_page_url?: string | null;
        prev_page_url?: string | null;
        total: number;
    };
    stats: {
        total_orders: number;
        total_spent: number;
        in_progress: number;
        completed: number;
    };
    settings: {
        business_name: string;
        currency_symbol: string;
    };
}

export default function Orders({
    customer,
    orders,
    stats,
    settings,
}: OrdersProps) {
    const currency = settings.currency_symbol ?? "৳";
    const { addItems } = useCart();

    const [reorderingId, setReorderingId] = useState<string | null>(null);
    const [reorderMessage, setReorderMessage] = useState<{
        type: "success" | "warning";
        text: string;
    } | null>(null);

    // 1-Click Reorder Action
    const handleReorder = async (referenceNo: string) => {
        setReorderingId(referenceNo);
        setReorderMessage(null);
        try {
            const res = await axios.post(
                route("customer.orders.reorder", referenceNo),
            );
            if (res.data.success && res.data.items?.length > 0) {
                addItems(res.data.items);
                // Dispatch cart drawer open event
                window.dispatchEvent(new CustomEvent("masterpos:open-cart"));

                if (res.data.out_of_stock_items?.length > 0) {
                    setReorderMessage({
                        type: "warning",
                        text: `Added available items to your cart. Note: ${res.data.out_of_stock_items.join(", ")} is currently out of stock.`,
                    });
                } else {
                    setReorderMessage({
                        type: "success",
                        text: `Order #${referenceNo} items successfully added to your cart!`,
                    });
                }
            } else if (res.data.out_of_stock_items?.length > 0) {
                setReorderMessage({
                    type: "warning",
                    text: `All items in order #${referenceNo} are currently out of stock.`,
                });
            }
        } catch (error) {
            console.error("Reorder failed", error);
            setReorderMessage({
                type: "warning",
                text: "Failed to reorder items. Please try again.",
            });
        } finally {
            setReorderingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                        <CheckCircle2 className="h-3 w-3" /> Completed
                    </span>
                );
            case "processing":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
                        <Clock className="h-3 w-3 animate-pulse" /> Processing
                    </span>
                );
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
                        <Clock className="h-3 w-3" /> Pending
                    </span>
                );
            case "cancelled":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-600/20">
                        <XCircle className="h-3 w-3" /> Cancelled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-600/20">
                        {status}
                    </span>
                );
        }
    };

    const getPaymentBadge = (status: string) => {
        switch (status) {
            case "paid":
                return (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        PAID
                    </span>
                );
            case "partial":
                return (
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        PARTIAL
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                        DUE / COD
                    </span>
                );
        }
    };

    return (
        <PublicLayout settings={settings as any}>
            <Head title={`My Orders & Account | ${settings.business_name}`} />

            <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
                {/* User Greeting & Navigation Strip */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold backdrop-blur-md ring-1 ring-white/20">
                            {customer.name?.charAt(0)?.toUpperCase() ?? "C"}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                                    Hello, {customer.name}!
                                </h1>
                                <span className="rounded-full bg-indigo-500/40 px-2.5 py-0.5 text-xs font-medium backdrop-blur-xs">
                                    Customer
                                </span>
                            </div>
                            <p className="text-xs text-indigo-200 mt-0.5">
                                Phone: {customer.phone} {customer.email && `• ${customer.email}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route("customer.profile")}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-xs hover:bg-white/20 transition-all"
                        >
                            <User className="h-3.5 w-3.5" />
                            Profile Settings
                        </Link>
                        <button
                            type="button"
                            onClick={() => router.post(route("customer.logout"))}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 px-3.5 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 transition-all cursor-pointer"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* KPI Summary Grid */}
                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between text-gray-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Total Orders
                            </span>
                            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                <ShoppingBag className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-gray-900">
                            {stats.total_orders}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between text-gray-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Total Spent
                            </span>
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                <CreditCard className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-emerald-600">
                            {formatPrice(currency, stats.total_spent)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between text-gray-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                In Progress
                            </span>
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-amber-600">
                            {stats.in_progress}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between text-gray-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Delivered
                            </span>
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-blue-600">
                            {stats.completed}
                        </p>
                    </div>
                </div>

                {/* Re-order Flash Notification */}
                {reorderMessage && (
                    <div
                        className={`mb-6 rounded-2xl border p-4 flex items-center justify-between ${
                            reorderMessage.type === "success"
                                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                                : "bg-amber-50/80 border-amber-200 text-amber-900"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {reorderMessage.type === "success" ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                            )}
                            <p className="text-sm font-medium">{reorderMessage.text}</p>
                        </div>
                        <Link
                            href={route("public.checkout.index")}
                            className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-xs"
                        >
                            Proceed to Checkout <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                )}

                {/* Orders Content Area */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
                    <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Order History
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Showing all orders placed online or at our retail counter
                            </p>
                        </div>
                        <Link
                            href={route("public.products.index")}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                            <ShoppingBag className="h-3.5 w-3.5" /> Browse Products
                        </Link>
                    </div>

                    {orders.data.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-4">
                                <Package className="h-8 w-8" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">
                                No orders found yet
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                                You haven't placed any orders yet. Start exploring our catalog to get started!
                            </p>
                            <div className="mt-6">
                                <Link
                                    href={route("public.products.index")}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 transition-all"
                                >
                                    <ShoppingBag className="h-4 w-4" /> Start Shopping
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50/70 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                                    <tr>
                                        <th className="py-3.5 pl-6 pr-3">Order Ref</th>
                                        <th className="px-3 py-3.5">Date</th>
                                        <th className="px-3 py-3.5">Items</th>
                                        <th className="px-3 py-3.5">Amount</th>
                                        <th className="px-3 py-3.5">Payment</th>
                                        <th className="px-3 py-3.5">Status</th>
                                        <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {orders.data.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-gray-50/60 transition-colors"
                                        >
                                            <td className="py-4 pl-6 pr-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-indigo-600">
                                                        #{order.reference_no}
                                                    </span>
                                                    {order.coupon_code && (
                                                        <span className="text-[10px] text-emerald-600 font-semibold">
                                                            Promo: {order.coupon_code}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-xs text-gray-500 whitespace-nowrap">
                                                {order.sale_date}
                                                <span className="block text-[10px] text-gray-400">
                                                    {order.created_at}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-xs whitespace-nowrap">
                                                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-semibold">
                                                    {order.items_count} {order.items_count === 1 ? "item" : "items"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                <span className="font-bold text-gray-900">
                                                    {formatPrice(currency, order.grand_total)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                {getPaymentBadge(order.payment_status)}
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                {getStatusBadge(order.order_status)}
                                            </td>
                                            <td className="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* View Detail */}
                                                    <Link
                                                        href={route("customer.orders.show", order.reference_no)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-indigo-300 transition-all shadow-2xs"
                                                    >
                                                        <Eye className="h-3.5 w-3.5 text-gray-500" />
                                                        Details
                                                    </Link>

                                                    {/* 1-Click Reorder */}
                                                    <button
                                                        type="button"
                                                        disabled={reorderingId === order.reference_no}
                                                        onClick={() => handleReorder(order.reference_no)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200/60 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                                        title="Add items from this order to current cart"
                                                    >
                                                        <RotateCcw
                                                            className={`h-3.5 w-3.5 ${
                                                                reorderingId === order.reference_no
                                                                    ? "animate-spin text-indigo-600"
                                                                    : ""
                                                            }`}
                                                        />
                                                        Reorder
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {orders.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/40">
                            <p className="text-xs text-gray-500">
                                Page <span className="font-bold">{orders.current_page}</span> of{" "}
                                <span className="font-bold">{orders.last_page}</span> ({orders.total} total orders)
                            </p>
                            <div className="flex items-center gap-2">
                                {orders.prev_page_url && (
                                    <Link
                                        href={orders.prev_page_url}
                                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Previous
                                    </Link>
                                )}
                                {orders.next_page_url && (
                                    <Link
                                        href={orders.next_page_url}
                                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
