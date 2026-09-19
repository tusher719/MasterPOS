// resources/js/Components/Public/Footer.tsx

import { PublicCategory, PublicSettings } from "@/types/public";
import { Link } from "@inertiajs/react";
import { Send } from "lucide-react";
import { useState } from "react";

interface FooterProps {
    settings: PublicSettings;
    categories: PublicCategory[];
}

export default function Footer({ settings, categories }: FooterProps) {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        // Future: POST to newsletter endpoint
        setSubmitted(true);
        setEmail("");
        setTimeout(() => setSubmitted(false), 4000);
    };

    return (
        <footer className="border-t border-gray-100 bg-white">
            <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <p className="text-base font-bold text-gray-900">
                            {settings.business_name}
                        </p>
                        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                            Your trusted online store for quality products at
                            the best prices.
                        </p>
                    </div>

                    {/* Quick links */}
                    <div>
                        <p className="text-sm font-semibold text-gray-800 mb-4">
                            Quick Links
                        </p>
                        <ul className="space-y-2.5">
                            {[
                                { label: "Home", r: "public.home" },
                                {
                                    label: "All Products",
                                    r: "public.products.index",
                                },
                                {
                                    label: "Privacy Policy",
                                    r: "legal.privacy-policy",
                                },
                                {
                                    label: "Terms & Conditions",
                                    r: "legal.terms-conditions",
                                },
                            ].map((item) => (
                                <li key={item.r}>
                                    <Link
                                        href={route(item.r)}
                                        className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Categories */}
                    {categories.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold text-gray-800 mb-4">
                                Categories
                            </p>
                            <ul className="space-y-2.5">
                                {categories.slice(0, 5).map((cat) => (
                                    <li key={cat.id}>
                                        <Link
                                            href={route(
                                                "public.categories.show",
                                                cat.slug,
                                            )}
                                            className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                                        >
                                            {cat.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Newsletter */}
                    <div>
                        <p className="text-sm font-semibold text-gray-800 mb-4">
                            Stay Updated
                        </p>
                        <p className="text-sm text-gray-500 mb-3">
                            Subscribe to get the latest offers and new arrivals.
                        </p>
                        {submitted ? (
                            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                                ✓ Thank you for subscribing!
                            </div>
                        ) : (
                            <form
                                onSubmit={handleSubscribe}
                                className="flex gap-2"
                            >
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Your email"
                                    required
                                    className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                />
                                <button
                                    type="submit"
                                    className="shrink-0 flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 transition-colors"
                                    aria-label="Subscribe"
                                >
                                    <Send size={15} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="mt-10 border-t border-gray-100 pt-6">
                    <p className="text-xs text-gray-400 text-center">
                        © {new Date().getFullYear()} {settings.business_name}.
                        All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
