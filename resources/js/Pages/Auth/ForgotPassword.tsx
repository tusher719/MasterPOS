import InputError from "@/Components/InputError";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Mail } from "lucide-react";
import { FormEventHandler } from "react";

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("password.email"));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            {/* Heading */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-foreground">
                    Reset your password
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Enter your email and we'll send you a reset link.
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
                            autoFocus
                            onChange={(e) => setData("email", e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                            placeholder="you@example.com"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5" />
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
                            Sending…
                        </>
                    ) : (
                        "Send reset link"
                    )}
                </button>

                {/* Back to login */}
                <div className="text-center">
                    <Link
                        href={route("login")}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to sign in
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
