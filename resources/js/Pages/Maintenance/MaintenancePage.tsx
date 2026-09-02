import { Head, Link } from "@inertiajs/react";
import { AlertTriangle, ArrowLeft, Settings } from "lucide-react";

interface Props {
    message: string;
}

export default function MaintenancePage({ message }: Props) {
    return (
        <>
            <Head title="Under Maintenance" />

            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md text-center">
                    {/* Icon */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                        <Settings
                            size={40}
                            className="animate-spin-slow text-amber-600"
                        />
                    </div>

                    {/* Badge */}
                    <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        <AlertTriangle size={12} />
                        Maintenance Mode
                    </span>

                    {/* Title */}
                    <h1 className="mt-3 text-3xl font-bold text-gray-900">
                        We'll be back soon
                    </h1>
                    <p className="mt-2 text-sm font-medium text-gray-500">
                        আমরা শীঘ্রই ফিরে আসব
                    </p>

                    {/* Message */}
                    <p className="mt-5 text-base text-gray-600">{message}</p>

                    {/* Admin login link */}
                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <p className="text-xs text-gray-400">
                            Are you an administrator?
                        </p>
                        <Link
                            href={route("login")}
                            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            <ArrowLeft size={14} />
                            Go to Admin Login
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-12 text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} Master Business Suite
                </p>
            </div>
        </>
    );
}
