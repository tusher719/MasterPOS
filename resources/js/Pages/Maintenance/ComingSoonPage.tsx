import { Head } from "@inertiajs/react";
import { Clock, Sparkles } from "lucide-react";

interface Props {
    message: string;
}

export default function ComingSoonPage({ message }: Props) {
    return (
        <>
            <Head title="Coming Soon" />

            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
                <div className="w-full max-w-md text-center">
                    {/* Icon */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
                        <Sparkles size={40} className="text-indigo-600" />
                    </div>

                    {/* Badge */}
                    <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        <Clock size={12} />
                        Coming Soon
                    </span>

                    {/* Title */}
                    <h1 className="mt-3 text-3xl font-bold text-gray-900">
                        Something exciting is coming
                    </h1>
                    <p className="mt-2 text-sm font-medium text-gray-500">
                        শীঘ্রই আসছে
                    </p>

                    {/* Message */}
                    <p className="mt-5 text-base text-gray-600">{message}</p>

                    {/* Dots animation */}
                    <div className="mt-10 flex justify-center gap-2">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className="h-2.5 w-2.5 rounded-full bg-indigo-400"
                                style={{
                                    animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-12 text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} Master Business Suite
                </p>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40%           { transform: scale(1);   opacity: 1;   }
                }
            `}</style>
        </>
    );
}
