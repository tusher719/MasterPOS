import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { AlertOctagon, Home, RefreshCw } from "lucide-react";

interface Props {
    surface?: "backend" | "pos" | "public";
}

export default function ServerError({ surface = "backend" }: Props) {
    if (surface === "public") {
        return (
            <>
                <Head title="Server Error" />
                <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                        <AlertOctagon size={40} className="text-red-500" />
                    </div>
                    <span className="mb-3 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                        Error 500
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Something went wrong
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        কিছু একটা সমস্যা হয়েছে
                    </p>
                    <p className="mt-4 max-w-sm text-gray-600">
                        An unexpected error occurred. Please try again or
                        contact support if the problem persists.
                    </p>
                    <div className="mt-8 flex gap-3">

                            href="/"
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Home size={16} />
                            Back to Home
                        </a>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>
                    </div>
                    <p className="mt-12 text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} Master Business Suite
                    </p>
                </div>
            </>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Server Error" />
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                    <AlertOctagon size={40} className="text-red-500" />
                </div>
                <span className="mb-3 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                    Error 500
                </span>
                <h1 className="text-3xl font-bold text-foreground">
                    Something went wrong
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    কিছু একটা সমস্যা হয়েছে
                </p>
                <p className="mt-4 max-w-sm text-muted-foreground">
                    An unexpected server error occurred. The team has been
                    notified.
                </p>
                <div className="mt-8 flex gap-3">
                    <Link
                        href={route("backend.dashboard.index")}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <Home size={16} />
                        Back to Dashboard
                    </Link>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                        <RefreshCw size={16} />
                        Try Again
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
