/**
 * animations.tsx — Master Business Suite
 *
 * Reusable animation primitives. Import from here, never inline one-off
 * Tailwind animation classes directly in page components.
 *
 * USAGE GUIDE
 * ───────────────────────────────────────────────────────────────────────
 * Skeleton      → loading placeholders (tables, cards, lists, avatars)
 * Spinner       → button loading state, inline fetch indicator
 * PingDot       → live/online status indicator (green dot)
 * FadeIn        → page sections, modals, dropdowns appearing
 * SlideIn       → drawers, side panels, toast-like banners
 * BounceDots    → full-page or section loading state
 * Shimmer       → hero banners, image placeholders
 * PresenceRing  → user online/away/offline avatar ring (Login History)
 *
 * WHEN TO USE WHICH
 * ───────────────────────────────────────────────────────────────────────
 * Table rows loading          → <SkeletonTable rows={5} cols={4} />
 * Card/stat loading           → <SkeletonCard />
 * Avatar loading              → <Skeleton variant="avatar" />
 * Button submitting           → <Spinner size="sm" /> inside button
 * Live user dot               → <PingDot color="green" />
 * Modal/dropdown appear       → <FadeIn> ... </FadeIn>
 * Drawer slide open           → <SlideIn from="right"> ... </SlideIn>
 * Full page loading           → <BounceDots />
 * Image loading               → <Shimmer className="h-40 w-full" />
 * ───────────────────────────────────────────────────────────────────────
 */

import { PropsWithChildren, useEffect, useState } from "react";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
// Pulse animation placeholder. Use while data is being fetched.

interface SkeletonProps {
    variant?: "line" | "avatar" | "circle" | "image" | "button";
    className?: string;
    width?: string;
    height?: string;
}

export function Skeleton({
    variant = "line",
    className = "",
    width,
    height,
}: SkeletonProps) {
    const base = "animate-pulse rounded bg-muted";

    const variantClass: Record<string, string> = {
        line: "h-4 w-full rounded",
        avatar: "h-9 w-9 rounded-lg flex-shrink-0",
        circle: "h-9 w-9 rounded-full flex-shrink-0",
        image: "h-32 w-full rounded-lg",
        button: "h-9 w-24 rounded-lg",
    };

    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;

    return (
        <div
            className={`${base} ${variantClass[variant] ?? variantClass.line} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
}

// ─── SkeletonText ─────────────────────────────────────────────────────────────
// Multiple lines of skeleton text — like a paragraph placeholder.

interface SkeletonTextProps {
    lines?: number;
    className?: string;
    lastLineWidth?: string; // e.g. "60%" — last line usually shorter
}

export function SkeletonText({
    lines = 3,
    className = "",
    lastLineWidth = "60%",
}: SkeletonTextProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="line"
                    width={i === lines - 1 ? lastLineWidth : "100%"}
                />
            ))}
        </div>
    );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────
// Stat card placeholder — used in dashboard / index page stat rows.

interface SkeletonCardProps {
    className?: string;
    showIcon?: boolean;
}

export function SkeletonCard({
    className = "",
    showIcon = true,
}: SkeletonCardProps) {
    return (
        <div
            className={`rounded-lg border border-border bg-card p-4 ${className}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                    <Skeleton variant="line" width="50%" className="h-3" />
                    <Skeleton variant="line" width="70%" className="h-6" />
                    <Skeleton variant="line" width="40%" className="h-3" />
                </div>
                {showIcon && (
                    <Skeleton
                        variant="avatar"
                        className="h-10 w-10 rounded-lg"
                    />
                )}
            </div>
        </div>
    );
}

// ─── SkeletonTable ────────────────────────────────────────────────────────────
// Table rows placeholder — matches the look of DataTable while loading.

interface SkeletonTableProps {
    rows?: number;
    cols?: number;
    showHeader?: boolean;
    className?: string;
}

export function SkeletonTable({
    rows = 5,
    cols = 4,
    showHeader = true,
    className = "",
}: SkeletonTableProps) {
    // Column widths cycle through a few patterns for realistic look
    const colWidths = ["40%", "25%", "20%", "15%", "30%", "20%"];

    return (
        <div
            className={`overflow-hidden rounded-lg border border-border bg-card ${className}`}
        >
            {showHeader && (
                <div className="border-b border-border bg-muted/40 px-4 py-3">
                    <div className="flex gap-4">
                        {Array.from({ length: cols }).map((_, i) => (
                            <Skeleton
                                key={i}
                                variant="line"
                                className="h-3"
                                width={colWidths[i % colWidths.length]}
                            />
                        ))}
                    </div>
                </div>
            )}
            <div className="divide-y divide-border">
                {Array.from({ length: rows }).map((_, row) => (
                    <div
                        key={row}
                        className="flex items-center gap-4 px-4 py-3"
                    >
                        {Array.from({ length: cols }).map((_, col) =>
                            col === 0 ? (
                                // First col often has avatar + text
                                <div
                                    key={col}
                                    className="flex items-center gap-2"
                                    style={{ width: colWidths[0] }}
                                >
                                    <Skeleton
                                        variant="avatar"
                                        className="h-8 w-8"
                                    />
                                    <Skeleton
                                        variant="line"
                                        className="h-3 flex-1"
                                    />
                                </div>
                            ) : (
                                <Skeleton
                                    key={col}
                                    variant="line"
                                    className="h-3"
                                    width={colWidths[col % colWidths.length]}
                                />
                            ),
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── SkeletonSearchResult ─────────────────────────────────────────────────────
// One row placeholder for search result dropdowns (Global Search, Autocomplete).

export function SkeletonSearchResult({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-0">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <Skeleton variant="avatar" className="h-9 w-9 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton variant="line" width="55%" className="h-3" />
                        <Skeleton
                            variant="line"
                            width="35%"
                            className="h-2.5"
                        />
                    </div>
                    <Skeleton variant="line" width="15%" className="h-3" />
                </div>
            ))}
        </div>
    );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
// Spin animation. Use inside buttons or inline next to loading text.

interface SpinnerProps {
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
}

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
    const sizeClass: Record<string, string> = {
        xs: "h-3 w-3 border",
        sm: "h-4 w-4 border-2",
        md: "h-5 w-5 border-2",
        lg: "h-7 w-7 border-2",
    };

    return (
        <span
            className={`inline-block animate-spin rounded-full border-border border-t-indigo-500 ${sizeClass[size]} ${className}`}
            aria-hidden="true"
        />
    );
}

// ─── PingDot ──────────────────────────────────────────────────────────────────
// Ping animation for live status indicators.
// Used in: Login History active dot, notification badge, live feed.

interface PingDotProps {
    color?: "green" | "amber" | "red" | "indigo" | "gray";
    size?: "sm" | "md";
    className?: string;
}

export function PingDot({
    color = "green",
    size = "md",
    className = "",
}: PingDotProps) {
    const colorMap: Record<string, { ping: string; dot: string }> = {
        green: { ping: "bg-green-400", dot: "bg-green-500" },
        amber: { ping: "bg-amber-400", dot: "bg-amber-500" },
        red: { ping: "bg-red-400", dot: "bg-red-500" },
        indigo: { ping: "bg-indigo-400", dot: "bg-indigo-500" },
        gray: { ping: "bg-gray-400", dot: "bg-gray-500" },
    };

    const sizeMap: Record<string, { outer: string; inner: string }> = {
        sm: { outer: "h-2 w-2", inner: "h-2 w-2" },
        md: { outer: "h-2.5 w-2.5", inner: "h-2.5 w-2.5" },
    };

    const c = colorMap[color] ?? colorMap.green;
    const s = sizeMap[size] ?? sizeMap.md;

    return (
        <span className={`relative inline-flex ${s.outer} ${className}`}>
            <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${c.ping}`}
            />
            <span
                className={`relative inline-flex rounded-full ${s.inner} ${c.dot}`}
            />
        </span>
    );
}

// ─── BounceDots ───────────────────────────────────────────────────────────────
// Three bouncing dots — full section or full page loading state.

interface BounceDotsProps {
    color?: string;
    className?: string;
}

export function BounceDots({
    color = "bg-indigo-500",
    className = "",
}: BounceDotsProps) {
    return (
        <div
            className={`flex items-center justify-center gap-1.5 ${className}`}
        >
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className={`h-2 w-2 rounded-full ${color} animate-bounce`}
                    style={{ animationDelay: `${i * 150}ms` }}
                />
            ))}
        </div>
    );
}

// ─── FadeIn ───────────────────────────────────────────────────────────────────
// Wraps children in a fade-in transition on mount.
// Use for: modals appearing, dropdown results, page sections.

interface FadeInProps extends PropsWithChildren {
    duration?: number; // ms
    delay?: number; // ms
    className?: string;
}

export function FadeIn({
    children,
    duration = 200,
    delay = 0,
    className = "",
}: FadeInProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div
            className={className}
            style={{
                transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(6px)",
            }}
        >
            {children}
        </div>
    );
}

// ─── SlideIn ──────────────────────────────────────────────────────────────────
// Wraps children in a slide + fade transition on mount.
// Use for: drawers, side panels, slide-over modals.

interface SlideInProps extends PropsWithChildren {
    from?: "right" | "left" | "bottom" | "top";
    duration?: number;
    delay?: number;
    className?: string;
}

export function SlideIn({
    children,
    from = "right",
    duration = 250,
    delay = 0,
    className = "",
}: SlideInProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    const translateMap: Record<string, string> = {
        right: "translateX(24px)",
        left: "translateX(-24px)",
        bottom: "translateY(24px)",
        top: "translateY(-24px)",
    };

    return (
        <div
            className={className}
            style={{
                transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translate(0,0)" : translateMap[from],
            }}
        >
            {children}
        </div>
    );
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────
// Shimmer sweep effect — for image placeholders, hero banners.

interface ShimmerProps {
    className?: string;
    rounded?: string;
}

export function Shimmer({
    className = "",
    rounded = "rounded-lg",
}: ShimmerProps) {
    return (
        <div
            className={`relative overflow-hidden bg-muted ${rounded} ${className}`}
            aria-hidden="true"
        >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
    );
}

// ─── PresenceRing ─────────────────────────────────────────────────────────────
// Avatar ring color for online/away/offline status.
// Matches the getRingClass() pattern in Login History / Users pages.

type PresenceStatus = "online" | "away" | "offline";

interface PresenceRingProps {
    status: PresenceStatus;
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
    className?: string;
}

const RING_CLASS: Record<PresenceStatus, string> = {
    online: "ring-2 ring-green-400",
    away: "ring-2 ring-amber-400",
    offline: "ring-2 ring-gray-300 dark:ring-gray-600",
};

const RING_SIZE: Record<string, string> = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
};

export function PresenceRing({
    status,
    size = "md",
    children,
    className = "",
}: PresenceRingProps) {
    return (
        <div
            className={`relative inline-flex shrink-0 items-center justify-center
                        rounded-full ${RING_SIZE[size]} ${RING_CLASS[status]} ${className}`}
        >
            {children}
            {status === "online" && (
                <span className="absolute -bottom-0.5 -right-0.5">
                    <PingDot color="green" size="sm" />
                </span>
            )}
        </div>
    );
}

// ─── Shimmer keyframe (add to tailwind config or app.css) ─────────────────────
// If Shimmer component is used, add this to tailwind.config.js:
//
// theme: { extend: { keyframes: {
//   shimmer: { '100%': { transform: 'translateX(100%)' } }
// }, animation: {
//   shimmer: 'shimmer 1.5s infinite'
// }}}
