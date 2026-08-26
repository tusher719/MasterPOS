// resources/js/Components/ThemeProvider.tsx

import type { UserPreferences, UserTheme, UserUi } from "@/types";
import { usePage } from "@inertiajs/react";
import { PropsWithChildren, useEffect } from "react";

// ─── Font map ────────────────────────────────────────────────────────────────
const FONT_MAP: Record<string, string> = {
    inter: "'Inter', sans-serif",
    roboto: "'Roboto', sans-serif",
    poppins: "'Poppins', sans-serif",
    nunito: "'Nunito', sans-serif",
    dm_sans: "'DM Sans', sans-serif",
    plus_jakarta: "'Plus Jakarta Sans', sans-serif",
    outfit: "'Outfit', sans-serif",
    lato: "'Lato', sans-serif",
    open_sans: "'Open Sans', sans-serif",
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// ─── Font size map ───────────────────────────────────────────────────────────
const FONT_SIZE_MAP: Record<string, string> = {
    small: "13px",
    medium: "14px",
    large: "15px",
    xl: "16px",
};

// ─── Border radius map ───────────────────────────────────────────────────────
const BORDER_RADIUS_MAP: Record<string, string> = {
    none: "0px",
    small: "4px",
    medium: "8px",
    large: "12px",
};

// ─── Sidebar width map ───────────────────────────────────────────────────────
const SIDEBAR_WIDTH_MAP: Record<string, string> = {
    compact: "220px",
    normal: "260px",
    wide: "300px",
};

// ─── Density map ─────────────────────────────────────────────────────────────
const DENSITY_MAP: Record<string, { padding: string; rowHeight: string }> = {
    compact: { padding: "8px", rowHeight: "40px" },
    comfortable: { padding: "12px", rowHeight: "48px" },
    spacious: { padding: "16px", rowHeight: "56px" },
};

// ─── Darken color helper ─────────────────────────────────────────────────────
function darkenHex(hex: string, amount = 20): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    const r = Math.max(0, parseInt(result[1], 16) - amount);
    const g = Math.max(0, parseInt(result[2], 16) - amount);
    const b = Math.max(0, parseInt(result[3], 16) - amount);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ─── Determine if color is light or dark ─────────────────────────────────────
// Used to set foreground text color on primary background
function isLightColor(hex: string): boolean {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return false;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    // Perceived luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

// ─── Load Google Fonts ───────────────────────────────────────────────────────
function loadGoogleFont(fontFamily: string): void {
    if (fontFamily === "system" || fontFamily === "inter") return;

    const fontNameMap: Record<string, string> = {
        roboto: "Roboto:wght@400;500;600;700",
        poppins: "Poppins:wght@400;500;600;700",
        nunito: "Nunito:wght@400;500;600;700",
        dm_sans: "DM+Sans:wght@400;500;600;700",
        plus_jakarta: "Plus+Jakarta+Sans:wght@400;500;600;700",
        outfit: "Outfit:wght@400;500;600;700",
        lato: "Lato:wght@400;700",
        open_sans: "Open+Sans:wght@400;500;600;700",
    };

    const fontParam = fontNameMap[fontFamily];
    if (!fontParam) return;

    const linkId = `google-font-${fontFamily}`;
    if (document.getElementById(linkId)) return; // Already loaded

    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontParam}&display=swap`;
    document.head.appendChild(link);
}

// resources/js/Components/ThemeProvider.tsx
// applyTheme function টা replace করো — বাকি সব same থাকবে

export function applyTheme(theme: UserTheme, ui: UserUi): void {
    const root = document.documentElement;

    // ── Dark mode toggle ─────────────────────────────────────────────────────
    let isDark = false;
    if (theme.mode === "dark") {
        isDark = true;
    } else if (theme.mode === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
        // Explicitly light — force remove dark class
        isDark = false;
    }

    // Force synchronous class update
    root.classList.remove("dark");
    if (isDark) {
        root.classList.add("dark");
    }

    // ── Border radius — Tailwind reads --radius ───────────────────────────────
    const radiusMap: Record<string, string> = {
        none: "0rem",
        small: "0.25rem",
        medium: "0.5rem",
        large: "0.75rem",
    };
    root.style.setProperty(
        "--radius",
        radiusMap[theme.border_radius] || "0.5rem",
    );

    // ── Primary color — convert hex to oklch for shadcn compatibility ─────────
    // shadcn variables use oklch() format
    // ── Primary color — RGB format for Tailwind CSS variable system ───────────
    const primary = theme.primary_color || "#4F46E5";
    const [pr, pg, pb] = hexToRgbValues(primary);

    // Tailwind reads: rgb(var(--primary) / alpha)
    // So --primary must be "R G B" space-separated values
    root.style.setProperty("--primary", `${pr} ${pg} ${pb}`);
    root.style.setProperty(
        "--primary-foreground",
        isLightColor(primary) ? "17 24 39" : "255 255 255",
    );
    root.style.setProperty("--ring", `${pr} ${pg} ${pb}`);

    // Hex vars for sidebar/navbar (our custom components — not Tailwind)
    root.style.setProperty("--theme-primary", primary);
    root.style.setProperty("--theme-primary-hover", darkenHex(primary, 20));
    root.style.setProperty(
        "--theme-primary-fg",
        isLightColor(primary) ? "#111827" : "#FFFFFF",
    );

    // ── Sidebar — our custom component vars ──────────────────────────────────
    const sidebarBg = theme.sidebar_color || "#111827";
    const sidebarLight = isLightColor(sidebarBg);

    root.style.setProperty("--theme-sidebar-bg", sidebarBg);
    root.style.setProperty(
        "--theme-sidebar-text",
        sidebarLight ? "#374151" : "#D1D5DB",
    );
    root.style.setProperty(
        "--theme-sidebar-active",
        sidebarLight ? primary : "#FFFFFF",
    );
    root.style.setProperty(
        "--theme-sidebar-hover",
        sidebarLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)",
    );
    root.style.setProperty(
        "--theme-sidebar-border",
        sidebarLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
    );
    root.style.setProperty(
        "--theme-sidebar-width",
        ui.sidebar_width === "compact"
            ? "220px"
            : ui.sidebar_width === "wide"
              ? "300px"
              : "260px",
    );

    // ── Typography ───────────────────────────────────────────────────────────
    loadGoogleFont(theme.font_family);
    const fontValue = FONT_MAP[theme.font_family] || FONT_MAP.inter;
    const fontSize = FONT_SIZE_MAP[theme.font_size] || "14px";

    // Set CSS variables
    root.style.setProperty("--font-sans", fontValue);
    root.style.setProperty("--font-size-base", fontSize);

    // Override Tailwind static font-sans class directly
    root.style.fontFamily = fontValue;
    document.body.style.fontFamily = fontValue;
    document.body.style.fontSize = fontSize;

    // ── Density ──────────────────────────────────────────────────────────────
    const densityMap = {
        compact: { padding: "8px", rowHeight: "40px" },
        comfortable: { padding: "12px", rowHeight: "48px" },
        spacious: { padding: "16px", rowHeight: "56px" },
    };
    const density = densityMap[ui.density] || densityMap.comfortable;
    root.style.setProperty("--density-padding", density.padding);
    root.style.setProperty("--density-row-height", density.rowHeight);

    // ── Card style ───────────────────────────────────────────────────────────
    root.style.setProperty(
        "--card-shadow",
        ui.card_style === "elevated"
            ? "0 4px 6px -1px rgb(0 0 0 / 0.1)"
            : "none",
    );

    // ── Reduce motion ────────────────────────────────────────────────────────
    root.style.setProperty(
        "--transition-duration",
        ui.reduce_motion ? "0ms" : "200ms",
    );
}

// ── Helper: hex to RGB values ────────────────────────────────────────────────
function hexToRgbValues(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [79, 70, 229];
    return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
    ];
}

// ─── ThemeProvider component ─────────────────────────────────────────────────
export default function ThemeProvider({ children }: PropsWithChildren) {
    const props = usePage().props as any;
    const userPreferences = props.userPreferences as UserPreferences;

    const theme = userPreferences?.theme;
    const ui = userPreferences?.ui;

    // Apply theme on mount and whenever preferences change
    useEffect(() => {
        if (!theme || !ui) return;
        applyTheme(theme, ui);
    }, [theme, ui]);

    // Listen for system dark mode changes when mode = 'system'
    useEffect(() => {
        if (theme?.mode !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
            if (theme && ui) applyTheme(theme, ui);
        };

        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, [theme, ui]);

    return <>{children}</>;
}
