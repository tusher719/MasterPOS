import ThemeProvider from "@/Components/ThemeProvider";
import { Link, usePage } from "@inertiajs/react";
import { PropsWithChildren } from "react";

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

function GuestLogo() {
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
                            className="font-bold text-2xl tracking-tight"
                        >
                            {seg.text}
                        </span>
                    ))}
                </span>
            );
        }
        return (
            <span className="font-bold text-2xl tracking-tight text-primary">
                {businessName}
            </span>
        );
    };

    return (
        <Link href="/" className="flex items-center justify-center gap-2">
            {hasImage && logoImagePath && (
                <img
                    src={`/storage/${logoImagePath}`}
                    alt={businessName}
                    className="h-9 w-auto object-contain"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                    }}
                />
            )}
            {(hasText || (!hasImage && !hasText)) && renderText()}
        </Link>
    );
}

export default function GuestLayout({ children }: PropsWithChildren) {
    const { props } = usePage<{ settings?: Record<string, string> }>();
    const businessName = props.settings?.business_name ?? "Master POS";

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center mb-8">
                    <GuestLogo />
                </div>

                {/* Card */}
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-card border border-border shadow-sm rounded-xl px-6 py-8 sm:px-8">
                        {children}
                    </div>

                    {/* Footer */}
                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} {businessName}. All
                        rights reserved.
                    </p>
                </div>
            </div>
        </ThemeProvider>
    );
}
