import PublicLayout from "@/Layouts/PublicLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    LogOut,
    Mail,
    MapPin,
    Package,
    Phone,
    Save,
    Shield,
    ShoppingBag,
    Truck,
    User,
} from "lucide-react";
import React, { useState } from "react";

interface ProfileProps {
    customer: {
        id: number;
        name: string;
        phone: string;
        email?: string | null;
        address?: string | null;
        city?: string | null;
        default_delivery_type?: string | null;
    };
    settings: {
        business_name: string;
        currency_symbol: string;
    };
}

export default function Profile({ customer, settings }: ProfileProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, put, processing, errors, recentlySuccessful, reset } =
        useForm({
            name: customer.name ?? "",
            email: customer.email ?? "",
            address: customer.address ?? "",
            city: customer.city ?? "Dhaka",
            default_delivery_type: customer.default_delivery_type ?? "inside_dhaka",
            current_password: "",
            new_password: "",
            new_password_confirmation: "",
        });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("customer.profile.update"), {
            onSuccess: () => {
                reset("current_password", "new_password", "new_password_confirmation");
            },
        });
    };

    return (
        <PublicLayout settings={settings as any}>
            <Head title={`My Profile & Settings | ${settings.business_name}`} />

            <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header & Back link */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href={route("customer.orders")}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to My Orders
                    </Link>

                    <button
                        type="button"
                        onClick={() => router.post(route("customer.logout"))}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                    >
                        <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Sidebar Profile Badge */}
                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xs text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600 text-2xl font-black text-white shadow-lg shadow-indigo-600/20 mb-4">
                                {customer.name?.charAt(0)?.toUpperCase() ?? "C"}
                            </div>
                            <h2 className="text-lg font-black text-gray-900">
                                {customer.name}
                            </h2>
                            <p className="text-xs text-gray-500 mt-1 font-mono">
                                {customer.phone}
                            </p>
                            {customer.email && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {customer.email}
                                </p>
                            )}

                            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center gap-3">
                                <Link
                                    href={route("customer.orders")}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all"
                                >
                                    <ShoppingBag className="h-3.5 w-3.5 text-indigo-600" />
                                    My Orders
                                </Link>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-indigo-50/50 p-6 text-xs text-indigo-900 leading-relaxed">
                            <div className="flex items-center gap-2 font-bold mb-2">
                                <Shield className="h-4 w-4 text-indigo-600" /> Account Security
                            </div>
                            Your mobile number serves as your primary customer ID across our online store and physical retail locations.
                        </div>
                    </div>

                    {/* Main Settings Form (col-span-2) */}
                    <div className="lg:col-span-2">
                        <form
                            onSubmit={submit}
                            className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xs space-y-8"
                        >
                            {/* Success Flash */}
                            {recentlySuccessful && (
                                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-900">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                    <p className="text-sm font-semibold">
                                        Your profile details have been updated successfully!
                                    </p>
                                </div>
                            )}

                            {/* Section 1: Personal Details */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                                    <User className="h-4 w-4 text-indigo-600" /> Personal & Delivery Information
                                </h3>

                                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                        >
                                            Full Name
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData("name", e.target.value)}
                                            className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                        >
                                            Email Address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData("email", e.target.value)}
                                            className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label
                                        htmlFor="phone"
                                        className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                    >
                                        Primary Mobile Phone <span className="text-gray-400 font-normal lowercase">(cannot be changed)</span>
                                    </label>
                                    <input
                                        id="phone"
                                        type="text"
                                        disabled
                                        value={customer.phone}
                                        className="block w-full rounded-xl border border-gray-200 bg-gray-100 py-2.5 px-3.5 text-sm text-gray-500 cursor-not-allowed font-mono"
                                    />
                                </div>

                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="address"
                                            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                        >
                                            Default Delivery Address
                                        </label>
                                        <input
                                            id="address"
                                            type="text"
                                            value={data.address}
                                            onChange={(e) => setData("address", e.target.value)}
                                            placeholder="House, Road, Area, Ward"
                                            className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                                        />
                                        {errors.address && (
                                            <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="city"
                                            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                        >
                                            City
                                        </label>
                                        <input
                                            id="city"
                                            type="text"
                                            value={data.city}
                                            onChange={(e) => setData("city", e.target.value)}
                                            className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label
                                        htmlFor="default_delivery_type"
                                        className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                    >
                                        Preferred Delivery Zone
                                    </label>
                                    <select
                                        id="default_delivery_type"
                                        value={data.default_delivery_type}
                                        onChange={(e) =>
                                            setData("default_delivery_type", e.target.value)
                                        }
                                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 cursor-pointer"
                                    >
                                        <option value="inside_dhaka">Inside Dhaka Home Delivery</option>
                                        <option value="outside_dhaka">Outside Dhaka Courier Delivery</option>
                                        <option value="store_pickup">Store Pickup (In-person)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Section 2: Change Password */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                                    <KeyRound className="h-4 w-4 text-indigo-600" /> Change Password <span className="text-gray-400 font-normal lowercase">(leave blank to keep current)</span>
                                </h3>

                                <div className="mt-5 space-y-4">
                                    <div>
                                        <label
                                            htmlFor="current_password"
                                            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                        >
                                            Current Password
                                        </label>
                                        <div className="relative rounded-xl shadow-2xs">
                                            <input
                                                id="current_password"
                                                type={showPassword ? "text" : "password"}
                                                value={data.current_password}
                                                onChange={(e) =>
                                                    setData("current_password", e.target.value)
                                                }
                                                placeholder="Enter current password"
                                                className={`block w-full rounded-xl border bg-gray-50/50 py-2.5 px-3.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 ${
                                                    errors.current_password
                                                        ? "border-red-300"
                                                        : "border-gray-200"
                                                }`}
                                            />
                                        </div>
                                        {errors.current_password && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.current_password}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label
                                                htmlFor="new_password"
                                                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                            >
                                                New Password (Min 6 chars)
                                            </label>
                                            <input
                                                id="new_password"
                                                type={showPassword ? "text" : "password"}
                                                value={data.new_password}
                                                onChange={(e) =>
                                                    setData("new_password", e.target.value)
                                                }
                                                placeholder="••••••••"
                                                className={`block w-full rounded-xl border bg-gray-50/50 py-2.5 px-3.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 ${
                                                    errors.new_password
                                                        ? "border-red-300"
                                                        : "border-gray-200"
                                                }`}
                                            />
                                            {errors.new_password && (
                                                <p className="mt-1 text-xs text-red-600">
                                                    {errors.new_password}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="new_password_confirmation"
                                                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                            >
                                                Confirm New Password
                                            </label>
                                            <input
                                                id="new_password_confirmation"
                                                type={showPassword ? "text" : "password"}
                                                value={data.new_password_confirmation}
                                                onChange={(e) =>
                                                    setData("new_password_confirmation", e.target.value)
                                                }
                                                placeholder="••••••••"
                                                className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 flex items-center justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                                >
                                    <Save className="h-4 w-4" />
                                    {processing ? "Saving Changes..." : "Save Profile Details"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
