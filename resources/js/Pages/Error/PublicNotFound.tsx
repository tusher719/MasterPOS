import { Head, Link } from "@inertiajs/react";
import { AlertTriangle, ArrowLeft } from "lucide-react";

// Public 404 — no AuthenticatedLayout, no auth required
// Used for: storefront routes, welcome page, any non-backend URL
export default function PublicNotFound() {
    return (
        <>
            <Head title="404 — Page Not Found" />

            {/* Full-page centered layout — no sidebar, no navbar */}
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
                {/* Card */}
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-8 py-10 text-center shadow-sm">
                    {/* Icon */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
                        <AlertTriangle size={36} className="text-amber-500" />
                    </div>

                    {/* Error code */}
                    <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
                        Error 404
                    </p>

                    {/* Heading */}
                    <h1 className="mb-3 text-3xl font-bold text-gray-800">
                        Page Not Found
                    </h1>

                    {/* Bengali */}
                    <p className="mb-1 text-sm text-gray-500">
                        এই পাতাটি খুঁজে পাওয়া যায়নি
                    </p>

                    {/* English */}
                    <p className="mb-8 text-sm text-gray-500">
                        The page you're looking for doesn't exist or has been
                        moved.
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        {/* Back to home — public welcome page */}
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                        >
                            <ArrowLeft size={16} />
                            Back to Home
                        </Link>

                        {/* Go back */}
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                            Go Back
                        </button>
                    </div>

                    {/* Branding footer */}
                    <p className="mt-10 text-xs text-gray-300">
                        Master Business Suite
                    </p>
                </div>
            </div>
        </>
    );
}
