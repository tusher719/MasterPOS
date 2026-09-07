import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { FormEventHandler, useState } from "react";

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {/* Heading */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-foreground">
                    Welcome back
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Sign in to your account to continue
                </p>
            </div>

            {/* Status message */}
            {status && (
                <div className="mb-5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                {/* Email */}
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-foreground mb-1.5"
                    >
                        Email address
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            autoComplete="username"
                            autoFocus
                            onChange={(e) => setData("email", e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                            placeholder="you@example.com"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                {/* Password */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-foreground"
                        >
                            Password
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route("password.request")}
                                className="text-xs text-primary hover:text-primary/80 font-medium transition"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={data.password}
                            autoComplete="current-password"
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            className="block w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                {/* Remember me */}
                <div className="flex items-center">
                    <Checkbox
                        id="remember"
                        name="remember"
                        checked={data.remember}
                        onChange={(e) =>
                            setData("remember", e.target.checked as false)
                        }
                    />
                    <label
                        htmlFor="remember"
                        className="ms-2 text-sm text-muted-foreground cursor-pointer select-none"
                    >
                        Keep me signed in
                    </label>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                    {processing ? (
                        <>
                            <svg
                                className="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                />
                            </svg>
                            Signing in…
                        </>
                    ) : (
                        "Sign in"
                    )}
                </button>
            </form>
        </GuestLayout>
    );
}
