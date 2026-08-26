// resources/js/hooks/useTheme.ts

import { applyTheme } from "@/Components/ThemeProvider";
import type { UserPreferences, UserTheme, UserUi } from "@/types";
import { usePage } from "@inertiajs/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

// ─── Default values (mirrors PHP DEFAULT_THEME / DEFAULT_UI) ─────────────────
export const DEFAULT_THEME: UserTheme = {
    primary_color: "#4F46E5",
    sidebar_color: "#111827",
    font_size: "medium",
    font_family: "inter",
    mode: "system",
    border_radius: "medium",
    preset: "indigo",
};

export const DEFAULT_UI: UserUi = {
    sidebar_collapsed: false,
    sidebar_width: "normal",
    density: "comfortable",
    card_style: "flat",
    sidebar_behavior: "fixed",
    reduce_motion: false,
};

// ─── Theme presets ────────────────────────────────────────────────────────────
export const THEME_PRESETS = [
    { name: "indigo", label: "Indigo", primary: "#4F46E5", sidebar: "#111827" },
    { name: "blue", label: "Blue", primary: "#2563EB", sidebar: "#1E3A5F" },
    {
        name: "emerald",
        label: "Emerald",
        primary: "#059669",
        sidebar: "#064E3B",
    },
    { name: "rose", label: "Rose", primary: "#E11D48", sidebar: "#881337" },
    { name: "orange", label: "Orange", primary: "#EA580C", sidebar: "#431407" },
    { name: "purple", label: "Purple", primary: "#7C3AED", sidebar: "#2E1065" },
    { name: "teal", label: "Teal", primary: "#0D9488", sidebar: "#134E4A" },
    { name: "cyan", label: "Cyan", primary: "#0891B2", sidebar: "#164E63" },
    { name: "slate", label: "Slate", primary: "#475569", sidebar: "#0F172A" },
];

// ─── Font options ─────────────────────────────────────────────────────────────
export const FONT_OPTIONS = [
    { value: "inter", label: "Inter" },
    { value: "roboto", label: "Roboto" },
    { value: "poppins", label: "Poppins" },
    { value: "nunito", label: "Nunito" },
    { value: "dm_sans", label: "DM Sans" },
    { value: "plus_jakarta", label: "Plus Jakarta Sans" },
    { value: "outfit", label: "Outfit" },
    { value: "lato", label: "Lato" },
    { value: "open_sans", label: "Open Sans" },
    { value: "system", label: "System Default" },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTheme() {
    const props = usePage().props as any;
    const userPreferences = props.userPreferences as UserPreferences;

    // Local state — tracks unsaved changes
    const [theme, setThemeState] = useState<UserTheme>(
        userPreferences?.theme ?? DEFAULT_THEME,
    );
    const [ui, setUiState] = useState<UserUi>(
        userPreferences?.ui ?? DEFAULT_UI,
    );

    // Tracks whether user has unsaved changes
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // ── Update theme key — instant preview ───────────────────────────────────
    const updateTheme = useCallback(
        (partial: Partial<UserTheme>) => {
            setThemeState((prev) => {
                const next = { ...prev, ...partial };

                // Apply dark/light class IMMEDIATELY — before requestAnimationFrame
                // This prevents the flash of wrong mode
                if ("mode" in partial) {
                    const root = document.documentElement;
                    root.classList.remove("dark");
                    if (partial.mode === "dark") {
                        root.classList.add("dark");
                    } else if (partial.mode === "system") {
                        if (
                            window.matchMedia("(prefers-color-scheme: dark)")
                                .matches
                        ) {
                            root.classList.add("dark");
                        }
                    }
                }

                requestAnimationFrame(() => applyTheme(next, ui));
                return next;
            });
            setIsDirty(true);
        },
        [ui],
    );

    // ── Update UI key — instant preview ──────────────────────────────────────
    const updateUi = useCallback(
        (partial: Partial<UserUi>) => {
            setUiState((prev) => {
                const next = { ...prev, ...partial };
                requestAnimationFrame(() => applyTheme(theme, next));
                return next;
            });
            setIsDirty(true);
        },
        [theme],
    );

    // ── Apply preset ──────────────────────────────────────────────────────────
    const applyPreset = useCallback(
        (presetName: string) => {
            const preset = THEME_PRESETS.find((p) => p.name === presetName);
            if (!preset) return;

            setThemeState((prev) => {
                const next = {
                    ...prev,
                    primary_color: preset.primary,
                    sidebar_color: preset.sidebar,
                    preset: preset.name,
                };
                requestAnimationFrame(() => applyTheme(next, ui));
                return next;
            });
            setIsDirty(true);
        },
        [ui],
    );

    // ── Save theme to DB ──────────────────────────────────────────────────────
    const saveTheme = useCallback(async () => {
        setIsSaving(true);
        try {
            await window.axios.put(
                route("backend.user.preferences.theme.update"),
                theme,
            );
            toast.success("Theme preferences saved successfully.");
            setIsDirty(false);
        } catch {
            toast.error("Failed to save theme preferences.");
        } finally {
            setIsSaving(false);
        }
    }, [theme]);

    // ── Save UI to DB ─────────────────────────────────────────────────────────
    const saveUi = useCallback(async () => {
        setIsSaving(true);
        try {
            await window.axios.put(
                route("backend.user.preferences.ui.update"),
                ui,
            );
            toast.success("UI preferences saved successfully.");
            setIsDirty(false);
        } catch {
            toast.error("Failed to save UI preferences.");
        } finally {
            setIsSaving(false);
        }
    }, [ui]);

    // ── Save both at once ─────────────────────────────────────────────────────
    const saveAll = useCallback(async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                window.axios.put(
                    route("backend.user.preferences.theme.update"),
                    theme,
                ),
                window.axios.put(
                    route("backend.user.preferences.ui.update"),
                    ui,
                ),
            ]);
            toast.success("Theme preferences saved successfully.");
            setIsDirty(false);
        } catch {
            toast.error("Failed to save preferences.");
        } finally {
            setIsSaving(false);
        }
    }, [theme, ui]);

    // ── Reset theme to default ────────────────────────────────────────────────
    const resetTheme = useCallback(async () => {
        setIsSaving(true);
        try {
            const res = await window.axios.post(
                route("backend.user.preferences.theme.reset"),
            );
            const resetted = res.data.theme as UserTheme;
            setThemeState(resetted);
            applyTheme(resetted, ui);
            toast.success("Theme reset to default.");
            setIsDirty(false);
        } catch {
            toast.error("Failed to reset theme.");
        } finally {
            setIsSaving(false);
        }
    }, [ui]);

    // ── Sidebar collapse — saves immediately (no Save button needed) ──────────
    const toggleSidebarCollapsed = useCallback(async (collapsed: boolean) => {
        setUiState((prev) => ({ ...prev, sidebar_collapsed: collapsed }));
        try {
            await window.axios.put(
                route("backend.user.preferences.ui.update"),
                { sidebar_collapsed: collapsed },
            );
        } catch {
            // Silent fail — not critical
        }
    }, []);

    return {
        // State
        theme,
        ui,
        isDirty,
        isSaving,

        // Actions
        updateTheme,
        updateUi,
        applyPreset,
        saveAll,
        saveTheme,
        saveUi,
        resetTheme,
        toggleSidebarCollapsed,

        // Constants
        THEME_PRESETS,
        FONT_OPTIONS,
        DEFAULT_THEME,
        DEFAULT_UI,
    };
}
