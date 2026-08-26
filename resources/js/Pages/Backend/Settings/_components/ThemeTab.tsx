// resources/js/Pages/Backend/Settings/_components/ThemeTab.tsx

import { FONT_OPTIONS, THEME_PRESETS, useTheme } from "@/hooks/useTheme";
import {
    Check,
    Monitor,
    Moon,
    Palette,
    RotateCcw,
    Save,
    Sun,
} from "lucide-react";
import { useState } from "react";

// ─── Font style map ───────────────────────────────────────────────────────────
const FONT_STYLE_MAP: Record<string, string> = {
    inter: "'Inter Variable', sans-serif",
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

type BorderRadius = "none" | "small" | "medium" | "large";
type FontSize = "small" | "medium" | "large" | "xl";
type Density = "compact" | "comfortable" | "spacious";
type CardStyle = "flat" | "bordered" | "elevated";
type SidebarWidth = "compact" | "normal" | "wide";

// ─── Section wrapper ──────────────────────────────────────────────────────────
function S({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/40 px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {title}
                </p>
            </div>
            <div className="divide-y divide-border">{children}</div>
        </div>
    );
}

// ─── Row ─────────────────────────────────────────────────────────────────────
function Row({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-6 px-5 py-3.5">
            <div className="w-28 shrink-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                {hint && (
                    <p className="text-[11px] text-muted-foreground">{hint}</p>
                )}
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                {children}
            </div>
        </div>
    );
}

// ─── Segment button ───────────────────────────────────────────────────────────
function Seg({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                active
                    ? "border-primary bg-primary/15 text-primary dark:bg-primary/25"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
            {children}
        </button>
    );
}

// ─── Color dot ────────────────────────────────────────────────────────────────
function Dot({
    color,
    active,
    onClick,
}: {
    color: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={color}
            className={`relative h-6 w-6 rounded-full border-2 transition-all hover:scale-110 ${
                active
                    ? "border-primary ring-2 ring-primary/30 scale-110"
                    : "border-transparent"
            }`}
            style={{ backgroundColor: color }}
        >
            {active && (
                <Check
                    size={11}
                    className="absolute inset-0 m-auto text-white drop-shadow-sm"
                />
            )}
        </button>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ThemeTab() {
    const {
        theme,
        ui,
        isDirty,
        isSaving,
        updateTheme,
        updateUi,
        applyPreset,
        saveAll,
        resetTheme,
    } = useTheme();

    const [showReset, setShowReset] = useState(false);

    return (
        <div className="space-y-4">
            {/* ── Unsaved banner ── */}
            {isDirty && (
                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-950/40">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        You have unsaved theme changes
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowReset(true)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
                        >
                            Discard
                        </button>
                        <button
                            onClick={saveAll}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                        >
                            <Save size={12} />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Reset confirm ── */}
            {showReset && (
                <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
                    <p className="text-sm text-red-700">
                        Reset to default theme? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowReset(false)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                setShowReset(false);
                                await resetTheme();
                            }}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            )}

            {/* ── 1. Appearance ── */}
            <S title="Appearance">
                <Row label="Mode">
                    <Seg
                        active={theme.mode === "light"}
                        onClick={() => updateTheme({ mode: "light" })}
                    >
                        <Sun size={13} /> Light
                    </Seg>
                    <Seg
                        active={theme.mode === "dark"}
                        onClick={() => updateTheme({ mode: "dark" })}
                    >
                        <Moon size={13} /> Dark
                    </Seg>
                    <Seg
                        active={theme.mode === "system"}
                        onClick={() => updateTheme({ mode: "system" })}
                    >
                        <Monitor size={13} /> System
                    </Seg>
                </Row>

                <Row label="Preset">
                    <div className="flex flex-wrap gap-1.5">
                        {THEME_PRESETS.map((p) => (
                            <button
                                key={p.name}
                                onClick={() => applyPreset(p.name)}
                                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                                    theme.preset === p.name
                                        ? "border-primary bg-primary/15 text-primary dark:bg-primary/25"
                                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                <span className="flex gap-0.5">
                                    <span
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: p.primary }}
                                    />
                                    <span
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: p.sidebar }}
                                    />
                                </span>
                                {p.label}
                                {theme.preset === p.name && <Check size={11} />}
                            </button>
                        ))}
                    </div>
                </Row>
            </S>

            {/* ── 2. Colors ── */}
            <S title="Colors">
                <Row label="Primary" hint="Buttons & links">
                    <div className="flex gap-1.5">
                        {[
                            "#4F46E5",
                            "#2563EB",
                            "#059669",
                            "#E11D48",
                            "#EA580C",
                            "#7C3AED",
                            "#0D9488",
                            "#0891B2",
                        ].map((c) => (
                            <Dot
                                key={c}
                                color={c}
                                active={theme.primary_color === c}
                                onClick={() =>
                                    updateTheme({
                                        primary_color: c,
                                        preset: "custom",
                                    })
                                }
                            />
                        ))}
                    </div>
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2 py-1 hover:bg-muted">
                        <div
                            className="h-4 w-4 rounded-md border border-border/50"
                            style={{ backgroundColor: theme.primary_color }}
                        />
                        <span className="font-mono text-[11px] text-muted-foreground">
                            {theme.primary_color}
                        </span>
                        <input
                            type="color"
                            value={theme.primary_color}
                            onChange={(e) =>
                                updateTheme({
                                    primary_color: e.target.value,
                                    preset: "custom",
                                })
                            }
                            className="sr-only"
                        />
                        <Palette size={11} className="text-muted-foreground" />
                    </label>
                </Row>

                <Row label="Sidebar" hint="Navigation bg">
                    <div className="flex gap-1.5">
                        {[
                            "#111827",
                            "#1E3A5F",
                            "#064E3B",
                            "#881337",
                            "#431407",
                            "#2E1065",
                            "#134E4A",
                            "#0F172A",
                        ].map((c) => (
                            <Dot
                                key={c}
                                color={c}
                                active={theme.sidebar_color === c}
                                onClick={() =>
                                    updateTheme({
                                        sidebar_color: c,
                                        preset: "custom",
                                    })
                                }
                            />
                        ))}
                    </div>
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2 py-1 hover:bg-muted">
                        <div
                            className="h-4 w-4 rounded-md border border-border/50"
                            style={{ backgroundColor: theme.sidebar_color }}
                        />
                        <span className="font-mono text-[11px] text-muted-foreground">
                            {theme.sidebar_color}
                        </span>
                        <input
                            type="color"
                            value={theme.sidebar_color}
                            onChange={(e) =>
                                updateTheme({
                                    sidebar_color: e.target.value,
                                    preset: "custom",
                                })
                            }
                            className="sr-only"
                        />
                        <Palette size={11} className="text-muted-foreground" />
                    </label>
                </Row>
            </S>

            {/* ── 3. Typography ── */}
            <S title="Typography">
                <Row label="Font Family">
                    <div className="flex flex-wrap justify-end gap-1.5">
                        {FONT_OPTIONS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() =>
                                    updateTheme({ font_family: f.value })
                                }
                                style={{ fontFamily: FONT_STYLE_MAP[f.value] }}
                                className={`rounded-lg border px-2.5 py-1 text-xs transition-all ${
                                    theme.font_family === f.value
                                        ? "border-primary bg-primary/15 text-primary font-semibold dark:bg-primary/25"
                                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </Row>

                <Row label="Font Size">
                    {[
                        {
                            v: "small" as FontSize,
                            label: "Small",
                            size: "11px",
                        },
                        {
                            v: "medium" as FontSize,
                            label: "Medium",
                            size: "13px",
                        },
                        {
                            v: "large" as FontSize,
                            label: "Large",
                            size: "14px",
                        },
                        { v: "xl" as FontSize, label: "XL", size: "15px" },
                    ].map((s) => (
                        <Seg
                            key={s.v}
                            active={theme.font_size === s.v}
                            onClick={() => updateTheme({ font_size: s.v })}
                        >
                            <span
                                style={{ fontSize: s.size }}
                                className="font-semibold leading-none"
                            >
                                A
                            </span>
                            {s.label}
                        </Seg>
                    ))}
                </Row>
            </S>

            {/* ── 4. Interface ── */}
            <S title="Interface">
                <Row label="Border Radius">
                    {[
                        { v: "none" as BorderRadius, px: "0px", label: "None" },
                        {
                            v: "small" as BorderRadius,
                            px: "4px",
                            label: "Small",
                        },
                        {
                            v: "medium" as BorderRadius,
                            px: "8px",
                            label: "Medium",
                        },
                        {
                            v: "large" as BorderRadius,
                            px: "12px",
                            label: "Large",
                        },
                    ].map((r) => (
                        <button
                            key={r.v}
                            onClick={() => updateTheme({ border_radius: r.v })}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                theme.border_radius === r.v
                                    ? "border-primary bg-primary/15 text-primary dark:bg-primary/25"
                                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            {/* Live shape preview */}
                            <div
                                className={`h-4 w-6 border-2 ${
                                    theme.border_radius === r.v
                                        ? "border-primary bg-primary/20"
                                        : "border-muted-foreground/40 bg-muted"
                                }`}
                                style={{ borderRadius: r.px }}
                            />
                            {r.label}
                        </button>
                    ))}
                </Row>

                <Row label="UI Density" hint="Spacing & padding">
                    {[
                        { v: "compact" as Density, label: "Compact" },
                        { v: "comfortable" as Density, label: "Comfortable" },
                        { v: "spacious" as Density, label: "Spacious" },
                    ].map((d) => (
                        <Seg
                            key={d.v}
                            active={ui.density === d.v}
                            onClick={() => updateUi({ density: d.v })}
                        >
                            {d.label}
                        </Seg>
                    ))}
                </Row>

                <Row label="Card Style">
                    {[
                        { v: "flat" as CardStyle, label: "Flat" },
                        { v: "bordered" as CardStyle, label: "Bordered" },
                        { v: "elevated" as CardStyle, label: "Elevated" },
                    ].map((s) => (
                        <Seg
                            key={s.v}
                            active={ui.card_style === s.v}
                            onClick={() => updateUi({ card_style: s.v })}
                        >
                            {s.label}
                        </Seg>
                    ))}
                </Row>
            </S>

            {/* ── 5. Sidebar ── */}
            <S title="Sidebar">
                <Row label="Width">
                    {[
                        {
                            v: "compact" as SidebarWidth,
                            label: "Compact",
                            sub: "220px",
                        },
                        {
                            v: "normal" as SidebarWidth,
                            label: "Normal",
                            sub: "260px",
                        },
                        {
                            v: "wide" as SidebarWidth,
                            label: "Wide",
                            sub: "300px",
                        },
                    ].map((w) => (
                        <button
                            key={w.v}
                            onClick={() => updateUi({ sidebar_width: w.v })}
                            className={`flex flex-col items-center rounded-lg border px-4 py-2 text-xs font-medium transition-all ${
                                ui.sidebar_width === w.v
                                    ? "border-primary bg-primary/15 text-primary dark:bg-primary/25"
                                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            {/* Mini sidebar preview */}
                            <div className="mb-1 flex gap-0.5">
                                <div
                                    className={`h-5 rounded-sm ${ui.sidebar_width === w.v ? "bg-primary/50" : "bg-muted-foreground/30"}`}
                                    style={{
                                        width:
                                            w.v === "compact"
                                                ? "8px"
                                                : w.v === "normal"
                                                  ? "12px"
                                                  : "16px",
                                    }}
                                />
                                <div
                                    className={`h-5 w-5 rounded-sm ${ui.sidebar_width === w.v ? "bg-primary/20" : "bg-muted"}`}
                                />
                            </div>
                            {w.label}
                            <span className="text-[10px] opacity-60">
                                {w.sub}
                            </span>
                        </button>
                    ))}
                </Row>

                <Row label="Behavior">
                    {[
                        { v: "fixed", label: "Fixed", hint: "Always visible" },
                        {
                            v: "collapsible",
                            label: "Collapsible",
                            hint: "Toggle button",
                        },
                        { v: "hover", label: "Hover", hint: "Expand on hover" },
                    ].map((b) => (
                        <button
                            key={b.v}
                            onClick={() =>
                                updateUi({ sidebar_behavior: b.v as any })
                            }
                            className={`flex flex-col items-center rounded-lg border px-4 py-2 text-xs font-medium transition-all ${
                                ui.sidebar_behavior === b.v
                                    ? "border-primary bg-primary/15 text-primary dark:bg-primary/25"
                                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            {b.label}
                            <span className="text-[10px] opacity-60">
                                {b.hint}
                            </span>
                        </button>
                    ))}
                </Row>
            </S>

            {/* ── 6. Accessibility ── */}
            <S title="Accessibility">
                <Row label="Reduce Motion" hint="Disables all animations">
                    <button
                        type="button"
                        onClick={() =>
                            updateUi({ reduce_motion: !ui.reduce_motion })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            ui.reduce_motion
                                ? "bg-primary"
                                : "bg-muted-foreground/30"
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                ui.reduce_motion
                                    ? "translate-x-6"
                                    : "translate-x-1"
                            }`}
                        />
                    </button>
                </Row>
            </S>

            {/* ── Bottom action bar ── */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3.5">
                <button
                    onClick={() => setShowReset(true)}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                    <RotateCcw size={13} />
                    Reset to Default
                </button>
                <button
                    onClick={saveAll}
                    disabled={isSaving || !isDirty}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
                >
                    <Save size={13} />
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
