// resources/js/Pages/Backend/QuickLinks/Index.tsx

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import {
    BarChart3,
    Bell,
    Boxes,
    Calculator,
    ClipboardList,
    ExternalLink,
    FileText,
    Grid2x2,
    Landmark,
    Package,
    PieChart,
    Plus,
    Receipt,
    ScrollText,
    Search,
    Settings2,
    ShieldAlert,
    ShoppingBag,
    ShoppingCart,
    TrendingUp,
    Truck,
    Users,
    Wallet,
} from "lucide-react";
import { ElementType, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickLink {
    id: number;
    label: string;
    icon: string;
    route_name: string;
    sort_order: number;
    is_active: boolean;
    visible_to_roles: string[] | null;
}

interface Can {
    create: boolean;
    edit: boolean;
}

interface Props {
    links: QuickLink[];
    search: string;
    can: Can;
}

// ─── Icon registry ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, ElementType> = {
    BarChart3,
    Bell,
    Boxes,
    Calculator,
    ClipboardList,
    ExternalLink,
    FileText,
    Grid2x2,
    Landmark,
    Package,
    PieChart,
    Receipt,
    ScrollText,
    Settings2,
    ShieldAlert,
    ShoppingBag,
    ShoppingCart,
    TrendingUp,
    Truck,
    Users,
    Wallet,
};

function resolveIcon(name: string): ElementType {
    return ICON_MAP[name] ?? Grid2x2;
}

// ─── Link card ────────────────────────────────────────────────────────────────

function LinkCard({ link }: { link: QuickLink }) {
    const Icon = resolveIcon(link.icon);

    const handleClick = () => {
        try {
            router.visit(route(link.route_name as string));
        } catch {
            // Route not registered — skip
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`flex flex-col items-center gap-3 rounded-xl border bg-card p-5
                        text-center transition-all duration-150 hover:shadow-md active:scale-95
                        ${
                            link.is_active
                                ? "border-border hover:border-primary/40 hover:bg-primary/5"
                                : "cursor-not-allowed border-dashed border-border opacity-50"
                        }`}
            disabled={!link.is_active}
            title={!link.is_active ? "This link is inactive" : link.route_name}
        >
            <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl
                            ${link.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
            >
                <Icon size={24} />
            </div>
            <span className="text-sm font-medium leading-tight text-foreground">
                {link.label}
            </span>
            {!link.is_active && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    Inactive
                </span>
            )}
            {link.visible_to_roles && link.visible_to_roles.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                    {link.visible_to_roles.join(", ")}
                </span>
            )}
        </button>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuickLinksIndex({
    links,
    search: initialSearch,
    can,
}: Props) {
    const [search, setSearch] = useState(initialSearch ?? "");

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            route("backend.quick-links.index"),
            { search: value },
            { preserveState: true, replace: true },
        );
    };

    const activeLinks = links.filter((l) => l.is_active);
    const inactiveLinks = links.filter((l) => !l.is_active);

    return (
        <AuthenticatedLayout>
            <Head title="Quick Links" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Quick Links
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            All available module shortcuts —{" "}
                            {activeLinks.length} active
                        </p>
                    </div>
                    {can.edit && (
                        <button
                            onClick={() =>
                                router.visit(
                                    route("backend.settings.index") +
                                        "?tab=quick-links",
                                )
                            }
                            className="flex items-center gap-2 rounded-lg border border-border
                                       bg-card px-4 py-2 text-sm font-medium text-foreground
                                       transition hover:bg-muted"
                        >
                            <Settings2 size={15} />
                            Manage in Settings
                        </button>
                    )}
                </div>

                {/* Search bar */}
                <div className="relative max-w-sm">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search modules..."
                        className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4
                                   text-sm text-foreground placeholder:text-muted-foreground
                                   focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                </div>

                {/* Active links grid */}
                {activeLinks.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Active ({activeLinks.length})
                        </h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {activeLinks.map((link) => (
                                <LinkCard key={link.id} link={link} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Inactive links — shown only to editors */}
                {can.edit && inactiveLinks.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Inactive ({inactiveLinks.length})
                        </h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {inactiveLinks.map((link) => (
                                <LinkCard key={link.id} link={link} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {links.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
                        <Grid2x2
                            size={40}
                            className="mb-3 text-muted-foreground/40"
                        />
                        <p className="text-sm font-medium text-foreground">
                            No quick links found
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {search
                                ? "Try a different search term"
                                : "Add links from Settings → Quick Links"}
                        </p>
                        {can.create && !search && (
                            <button
                                onClick={() =>
                                    router.visit(
                                        route("backend.settings.index") +
                                            "?tab=quick-links",
                                    )
                                }
                                className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                                           text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                <Plus size={15} />
                                Add Quick Links
                            </button>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
