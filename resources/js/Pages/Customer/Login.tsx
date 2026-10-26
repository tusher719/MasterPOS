import PublicLayout from "@/Layouts/PublicLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Eye, EyeOff, Lock, LogIn, Phone, ShoppingBag, Sparkles, UserPlus } from "lucide-react";
import React, { useState } from "react";

interface LoginProps {
    settings: {
        business_name: string;
        currency_symbol: string;
    };
}

export default function Login({ settings }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        login: "",
        password: "",
        remember: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("customer.login.submit"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <PublicLayout settings={settings as any}>
            <Head title={`Customer Sign In | ${settings.business_name}`} />

            <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md">
                    {/* Header Card */}
                    <div className="text-center mb-8">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 mb-4 ring-1 ring-indigo-600/20">
                            <LogIn className="h-7 w-7" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                            Welcome Back
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Sign in to access your order history, instant 1-click re-ordering, and delivery tracking.
                        </p>
                    </div>

                    {/* Main Form Card */}
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl shadow-gray-100/60">
                        <form onSubmit={submit} className="space-y-5">
                            {/* Phone / Email input */}
                            <div>
                                <label
                                    htmlFor="login"
                                    className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                                >
                                    Phone Number or Email
                                </label>
                                <div className="relative rounded-xl shadow-xs">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <input
                                        id="login"
                                        type="text"
                                        value={data.login}
                                        onChange={(e) => setData("login", e.target.value)}
                                        placeholder="01XXXXXXXXX or email@domain.com"
                                        className={`block w-full rounded-xl border bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all ${
                                            errors.login
                                                ? "border-red-300 focus:border-red-500"
                                                : "border-gray-200 focus:border-indigo-600"
                                        }`}
                                        required
                                        autoFocus
                                    />
                                </div>
                                {errors.login && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.login}</p>
                                )}
                            </div>

                            {/* Password input */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-semibold uppercase tracking-wider text-gray-700"
                                    >
                                        Password
                                    </label>
                                </div>
                                <div className="relative rounded-xl shadow-xs">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={data.password}
                                        onChange={(e) => setData("password", e.target.value)}
                                        placeholder="Enter your password"
                                        className={`block w-full rounded-xl border bg-gray-50/50 py-3 pl-10 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all ${
                                            errors.password
                                                ? "border-red-300 focus:border-red-500"
                                                : "border-gray-200 focus:border-indigo-600"
                                        }`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Remember me & Guest notice */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData("remember", e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs font-medium text-gray-600">
                                        Keep me signed in
                                    </span>
                                </label>
                                <Link
                                    href={route("public.track-order")}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    Track guest order?
                                </Link>
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
                            >
                                {processing ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-4 w-4" />
                                        <span>Sign In to Account</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Guest account linking hint */}
                        <div className="mt-6 rounded-xl bg-amber-50/70 border border-amber-200/60 p-3.5 flex items-start gap-3">
                            <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <span className="font-semibold">Ordered with us before?</span> Sign up with the same mobile number to automatically sync all your previous orders!
                            </p>
                        </div>
                    </div>

                    {/* Don't have account footer */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            Don't have an account yet?{" "}
                            <Link
                                href={route("customer.register")}
                                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
                            >
                                <UserPlus className="h-3.5 w-3.5" />
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
