import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { AlertTriangle, ArrowLeft, ShoppingCart } from "lucide-react";

interface Props {
    surface: "backend" | "pos";
}

export default function NotFound({ surface }: Props) {
    const isPos = surface === "pos";

    // POS surface → go back to POS terminal
    // Backend surface → go back to dashboard
    const homeRoute = isPos
        ? route("backend.pos.index")
        : route("backend.dashboard.index");

    const homeLabel = isPos ? "Back to POS Terminal" : "Back to Dashboard";

    const subtitle = isPos
        ? "This page doesn't exist in the POS terminal."
        : "The page you're looking for doesn't exist or has been moved.";

    return (
        <AuthenticatedLayout>
            <Head title="404 — Page Not Found" />

            <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
                <div className="w-full max-w-md text-center">
                    {/* Icon */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
                        <AlertTriangle size={36} className="text-amber-500" />
                    </div>

                    {/* Error code */}
                    <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                        Error 404
                    </p>

                    {/* Heading */}
                    <h1 className="text-3xl font-bold text-foreground mb-3">
                        Page Not Found
                    </h1>

                    {/* Bengali subtitle */}
                    <p className="text-sm text-muted-foreground mb-1">
                        এই পাতাটি খুঁজে পাওয়া যায়নি
                    </p>

                    {/* English subtitle */}
                    <p className="text-sm text-muted-foreground mb-8">
                        {subtitle}
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        {/* Back to home */}
                        <Link
                            href={homeRoute}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                        >
                            {isPos ? (
                                <ShoppingCart size={16} />
                            ) : (
                                <ArrowLeft size={16} />
                            )}
                            {homeLabel}
                        </Link>

                        {/* Go back (browser history) — only for backend, not POS */}
                        {!isPos && (
                            <button
                                onClick={() => window.history.back()}
                                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                            >
                                Go Back
                            </button>
                        )}
                    </div>

                    {/* Surface badge — subtle indicator */}
                    <p className="mt-10 text-xs text-muted-foreground/50">
                        {isPos ? "POS Terminal" : "Admin Panel"} · Master
                        Business Suite
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
