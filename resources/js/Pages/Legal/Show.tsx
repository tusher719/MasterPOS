import { Head } from "@inertiajs/react";
import { Calendar, FileText, ShieldCheck } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LegalPageData {
    type: "privacy_policy" | "terms_conditions";
    type_label: string;
    title: string;
    content: string | null;
    updated_at: string | null;
}

interface Props {
    page: LegalPageData;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LegalShow({ page }: Props) {
    const Icon = page.type === "privacy_policy" ? ShieldCheck : FileText;

    return (
        <>
            <Head title={page.title} />

            {/* Minimal public layout — no AuthenticatedLayout, no auth required */}
            <div className="min-h-screen bg-gray-50">
                {/* Navbar strip */}
                <header className="border-b border-gray-200 bg-white">
                    <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
                        <a
                            href="/"
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                            ← Back to Home
                        </a>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Icon className="h-4 w-4" />
                            <span>{page.type_label}</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="mx-auto max-w-4xl px-6 py-12">
                    {/* Page header */}
                    <div className="mb-10">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                                <Icon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                                {page.type_label}
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900">
                            {page.title}
                        </h1>

                        {page.updated_at && (
                            <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Last updated: {page.updated_at}</span>
                            </div>
                        )}
                    </div>

                    {/* Rich text content */}
                    <div className="rounded-xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
                        {page.content ? (
                            <div
                                className="prose prose-gray max-w-none
                                    prose-headings:font-semibold
                                    prose-headings:text-gray-900
                                    prose-h1:text-2xl
                                    prose-h2:text-xl
                                    prose-h3:text-lg
                                    prose-p:text-gray-600
                                    prose-p:leading-relaxed
                                    prose-a:text-indigo-600
                                    prose-a:no-underline
                                    hover:prose-a:underline
                                    prose-strong:text-gray-800
                                    prose-ul:text-gray-600
                                    prose-ol:text-gray-600
                                    prose-li:my-1
                                    prose-blockquote:border-indigo-300
                                    prose-blockquote:text-gray-500"
                                dangerouslySetInnerHTML={{
                                    __html: page.content,
                                }}
                            />
                        ) : (
                            <div className="py-12 text-center text-gray-400">
                                <Icon className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                <p className="text-sm">
                                    No content available yet.
                                </p>
                            </div>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-16 border-t border-gray-200 bg-white">
                    <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6 text-sm text-gray-400">
                        <span>
                            © {new Date().getFullYear()} All rights reserved.
                        </span>

                        <div className="flex items-center gap-4">
                            <a
                                href={route("legal.privacy-policy")}
                                className="hover:text-gray-600"
                            >
                                Privacy Policy
                            </a>
                            <a
                                href={route("legal.terms-conditions")}
                                className="hover:text-gray-600"
                            >
                                Terms &amp; Conditions
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
