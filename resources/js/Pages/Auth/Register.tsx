import InputError from "@/Components/InputError";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, useForm } from "@inertiajs/react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { FormEventHandler, useState } from "react";

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            {/* Heading */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-foreground">
                    Create account
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Fill in your details to get started
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                {/* Name */}
                <div>
                    <label
                        htmlFor="name"
                        className="block text-sm font-medium text-foreground mb-1.5"
                    >
                        Full name
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            value={data.name}
                            autoComplete="name"
                            autoFocus
                            onChange={(e) => setData("name", e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                            placeholder="John Doe"
                        />
                    </div>
                    <InputError message={errors.name} className="mt-1.5" />
                </div>

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
                            onChange={(e) => setData("email", e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                            placeholder="you@example.com"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                {/* Password */}
                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-foreground mb-1.5"
                    >
                        Password
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={data.password}
                            autoComplete="new-password"
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

                {/* Confirm Password */}
                <div>
                    <label
                        htmlFor="password_confirmation"
                        className="block text-sm font-medium text-foreground mb-1.5"
                    >
                        Confirm password
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <input
                            id="password_confirmation"
                            type={showConfirm ? "text" : "password"}
                            name="password_confirmation"
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData("password_confirmation", e.target.value)
                            }
                            className="block w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition"
                            tabIndex={-1}
                        >
                            {showConfirm ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    <InputError
                        message={errors.password_confirmation}
                        className="mt-1.5"
                    />
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
                            Creating account…
                        </>
                    ) : (
                        "Create account"
                    )}
                </button>
            </form>
        </GuestLayout>
    );
}
