// resources/js/Components/AppLauncher/AppLauncherModal.tsx

import { router, usePage } from "@inertiajs/react";
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
    Receipt,
    ScrollText,
    ShieldAlert,
    ShoppingBag,
    ShoppingCart,
    TrendingUp,
    Truck,
    Users,
    Wallet,
    X,
} from "lucide-react";
import { ElementType, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickLink {
    id: number;
    label: string;
    icon: string;
    route_name: string;
    sort_order: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// ─── Icon registry ────────────────────────────────────────────────────────────
// Maps lucide-react icon name strings (stored in DB) to actual components.
// Add new icons here when needed.

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

// ─── Single link tile ─────────────────────────────────────────────────────────

function LinkTile({ link, onClose }: { link: QuickLink; onClose: () => void }) {
    const Icon = resolveIcon(link.icon);

    const handleClick = () => {
        // Check if route exists in Ziggy before navigating
        try {
            const url = route(link.route_name as string);
            onClose();
            router.visit(url);
        } catch {
            // Route not registered — silently skip
        }
    };

    return (
        <button
            onClick={handleClick}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4
                       text-center transition-all duration-150 hover:border-primary/40
                       hover:bg-primary/5 hover:shadow-sm active:scale-95"
        >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={22} />
            </div>
            <span className="text-xs font-medium leading-tight text-foreground">
                {link.label}
            </span>
        </button>
    );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function AppLauncherModal({ isOpen, onClose }: Props) {
    const props = usePage().props as any;

    // Quick links come from the globally shared prop (injected by HandleInertiaRequests)
    const quickLinks: QuickLink[] = props.quickLinks ?? [];

    const [search, setSearch] = useState("");
    const searchRef = useRef<HTMLInputElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    // Focus search input when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearch("");
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Escape key closes
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Filter by search
    const filtered = quickLinks.filter((l) =>
        l.label.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        // Backdrop
        <div
            ref={backdropRef}
            className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 pt-24"
            onClick={(e) => {
                if (e.target === backdropRef.current) onClose();
            }}
        >
            {/* Panel */}
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            Quick Links
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Jump to any module
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View All link */}
                        <button
                            onClick={() => {
                                onClose();
                                router.visit(
                                    route("backend.quick-links.index"),
                                );
                            }}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium
                                       text-primary transition hover:bg-primary/10"
                        >
                            View All
                            <ExternalLink size={11} />
                        </button>

                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="border-b border-border px-4 py-3">
                    <input
                        ref={searchRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter links..."
                        className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2
                                   text-sm text-foreground placeholder:text-muted-foreground
                                   focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                </div>

                {/* Grid */}
                <div className="p-4">
                    {filtered.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            No links found
                        </p>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {filtered.map((link) => (
                                <LinkTile
                                    key={link.id}
                                    link={link}
                                    onClose={onClose}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="border-t border-border px-5 py-2.5">
                    <p className="text-center text-[11px] text-muted-foreground">
                        Press{" "}
                        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                            Ctrl
                        </kbd>{" "}
                        +{" "}
                        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                            .
                        </kbd>{" "}
                        to open
                    </p>
                </div>
            </div>
        </div>
    );
}
