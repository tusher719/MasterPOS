import ThemeProvider from "@/Components/ThemeProvider";
import { PageProps } from "@/types";
import { Head, Link, usePage } from "@inertiajs/react";

interface Segment {
    text: string;
    color: string;
}

function parseSegments(raw: string | null | undefined): Segment[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function WelcomeLogo() {
    const { props } = usePage<{ settings?: Record<string, string> }>();
    const settings = props.settings ?? {};

    const logoType = settings.logo_type ?? "text";
    const logoImagePath = settings.logo_image_path;
    const businessName = settings.business_name ?? "Master POS";
    const segments = parseSegments(settings.logo_text_segments);

    const hasImage = logoType === "image" || logoType === "both";
    const hasText = logoType === "text" || logoType === "both";

    const renderText = () => {
        if (segments.length > 0) {
            return (
                <span className="flex items-center gap-0.5">
                    {segments.map((seg, i) => (
                        <span
                            key={i}
                            style={{ color: seg.color }}
                            className="font-bold text-xl tracking-tight"
                        >
                            {seg.text}
                        </span>
                    ))}
                </span>
            );
        }
        return (
            <span className="font-bold text-xl tracking-tight text-primary">
                {businessName}
            </span>
        );
    };

    return (
        <div className="flex items-center gap-2.5">
            {hasImage && logoImagePath && (
                <img
                    src={`/storage/${logoImagePath}`}
                    alt={businessName}
                    className="h-8 w-auto object-contain"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                    }}
                />
            )}
            {(hasText || (!hasImage && !hasText)) && renderText()}
        </div>
    );
}

const MODULES = [
    {
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
            </svg>
        ),
        label: "POS Terminal",
        desc: "Fast checkout & cart management",
    },
    {
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
            </svg>
        ),
        label: "Inventory",
        desc: "Stock tracking & purchase orders",
    },
    {
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
            </svg>
        ),
        label: "Customers",
        desc: "Profiles, ledger & order history",
    },
    {
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
            </svg>
        ),
        label: "Analytics",
        desc: "Sales trends & profit reports",
    },
    {
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75"
                />
            </svg>
        ),
        label: "Investments",
        desc: "Capital ledger & profit distribution",
    },
    {
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
            </svg>
        ),
        label: "Fraud Protection",
        desc: "3-layer order validation system",
    },
];

const STATS = [
    { label: "Modules", value: "15+" },
    { label: "Sale Channels", value: "POS & Web" },
    { label: "Reports", value: "7 Types" },
    { label: "Access Roles", value: "Role-based" },
];

export default function Welcome({
    auth,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const { props } = usePage<{ settings?: Record<string, string> }>();
    const businessName = props.settings?.business_name ?? "Master POS";

    return (
        <ThemeProvider>
            <Head title={`${businessName} — Business Suite`} />

            <div className="min-h-screen bg-background flex flex-col">
                {/* ── Navbar ─────────────────────────────────── */}
                <header className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                        <WelcomeLogo />
                        <nav>
                            {auth.user ? (
                                <Link
                                    href={route("dashboard")}
                                    className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
                                >
                                    Go to Dashboard →
                                </Link>
                            ) : (
                                <Link
                                    href={route("login")}
                                    className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
                                >
                                    Sign in
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                {/* ── Hero ───────────────────────────────────── */}
                <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 sm:py-20">
                    {/* Badge */}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Complete Business Management Suite
                    </span>

                    <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight max-w-2xl mb-4">
                        Run your business,{" "}
                        <span className="text-primary">start to finish</span>
                    </h1>

                    <p className="text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed mb-8">
                        From the POS counter to investor reports — sell, track
                        stock, manage customers, distribute profit, and catch
                        fraud, all from one dashboard.
                    </p>

                    {auth.user ? (
                        <Link
                            href={route("dashboard")}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition"
                        >
                            Open Dashboard
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                />
                            </svg>
                        </Link>
                    ) : (
                        <Link
                            href={route("login")}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition"
                        >
                            Sign in to your account
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                />
                            </svg>
                        </Link>
                    )}

                    {/* ── Quick stats ──────────────────────────── */}
                    <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl">
                        {STATS.map((s) => (
                            <div
                                key={s.label}
                                className="rounded-xl border border-border bg-card px-4 py-4 text-center"
                            >
                                <p className="text-xl font-bold text-foreground">
                                    {s.value}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {s.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Module grid ────────────────────────────── */}
                <section className="px-4 pb-16 sm:pb-20">
                    <div className="max-w-5xl mx-auto">
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground text-center mb-6">
                            What's inside
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {MODULES.map((mod) => (
                                <div
                                    key={mod.label}
                                    className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-4 hover:border-primary/40 hover:bg-primary/5 transition"
                                >
                                    <span className="mt-0.5 flex-shrink-0 text-primary">
                                        {mod.icon}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {mod.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {mod.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Footer ─────────────────────────────────── */}
                <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} {businessName}. All rights
                    reserved.
                </footer>
            </div>
        </ThemeProvider>
    );
}
