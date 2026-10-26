import PublicLayout from "@/Layouts/PublicLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    CheckCircle2,
    Eye,
    EyeOff,
    Lock,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Sparkles,
    User,
    UserPlus,
} from "lucide-react";
import React, { useState } from "react";

interface RegisterProps {
    settings: {
        business_name: string;
        currency_symbol: string;
    };
}

export default function Register({ settings }: RegisterProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "Dhaka",
        password: "",
        password_confirmation: "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("customer.register.submit"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <PublicLayout settings={settings as any}>
            <Head title={`Create Account | ${settings.business_name}`} />

            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-lg">
                    {/* Header Card */}
                    <div className="text-center mb-8">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 mb-4 ring-1 ring-indigo-600/20">
                            <UserPlus className="h-7 w-7" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                            Create Your Account
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Save delivery addresses, track packages in real-time, and reorder favourite items in 1 click!
                        </p>
                    </div>

                    {/* Main Form Card */}
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl shadow-gray-100/60">
                        {/* Order History Auto-Linking Notification */}
                        <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-100 p-4 flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-indigo-950 leading-relaxed">
                                <span className="font-bold text-indigo-900">Automatic Order Sync:</span> If you previously purchased from our store using your phone number, registering here will immediately link your order history!
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                >
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative rounded-xl shadow-xs">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        placeholder="e.g. Tanvir Ahmed"
                                        className={`block w-full rounded-xl border bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all ${
                                            errors.name
                                                ? "border-red-300 focus:border-red-500"
                                                : "border-gray-200 focus:border-indigo-600"
                                        }`}
                                        required
                                        autoFocus
                                    />
                                </div>
                                {errors.name && (
                                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Phone & Email Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                    >
                                        Mobile Phone <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative rounded-xl shadow-xs">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={data.phone}
                                            onChange={(e) => setData("phone", e.target.value)}
                                            placeholder="01XXXXXXXXX"
                                            className={`block w-full rounded-xl border bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all ${
                                                errors.phone
                                                    ? "border-red-300 focus:border-red-500"
                                                    : "border-gray-200 focus:border-indigo-600"
                                            }`}
                                            required
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                    >
                                        Email Address <span className="text-gray-400 font-normal lowercase">(optional)</span>
                                    </label>
                                    <div className="relative rounded-xl shadow-xs">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData("email", e.target.value)}
                                            placeholder="you@domain.com"
                                            className={`block w-full rounded-xl border bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all ${
                                                errors.email
                                                    ? "border-red-300 focus:border-red-500"
                                                    : "border-gray-200 focus:border-indigo-600"
                                            }`}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Delivery Address & City */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="address"
                                        className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                    >
                                        Delivery Address <span className="text-gray-400 font-normal lowercase">(optional)</span>
                                    </label>
                                    <div className="relative rounded-xl shadow-xs">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <input
                                            id="address"
                                            type="text"
                                            value={data.address}
                                            onChange={(e) => setData("address", e.target.value)}
                                            placeholder="House, Road, Area"
                                            className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
                                        />
                                    </div>
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
                                        placeholder="Dhaka"
                                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-3 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password & Confirm Password Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                    >
                                        Password (Min 6 chars) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative rounded-xl shadow-xs">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={data.password}
                                            onChange={(e) => setData("password", e.target.value)}
                                            placeholder="••••••••"
                                            className={`block w-full rounded-xl border bg-gray-50/50 py-3 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all ${
                                                errors.password
                                                    ? "border-red-300 focus:border-red-500"
                                                    : "border-gray-200 focus:border-indigo-600"
                                            }`}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="password_confirmation"
                                        className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                    >
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative rounded-xl shadow-xs">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <input
                                            id="password_confirmation"
                                            type={showPassword ? "text" : "password"}
                                            value={data.password_confirmation}
                                            onChange={(e) =>
                                                setData("password_confirmation", e.target.value)
                                            }
                                            placeholder="••••••••"
                                            className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Terms check / Privacy note */}
                            <div className="pt-2 text-xs text-gray-500 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span>Your personal information and order history are kept strictly confidential.</span>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
                            >
                                {processing ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4" />
                                        <span>Complete Registration</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Already have account */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            Already registered?{" "}
                            <Link
                                href={route("customer.login")}
                                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                                Sign In here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
