export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export interface PageProps {
    auth: {
        user: User;
    };
    settings: Record<string, string | null>;
    [key: string]: unknown;
}

// ─── User Preferences Types ──────────────────────────────────────────────────
export interface UserTheme {
    primary_color: string;
    sidebar_color: string;
    font_size: "small" | "medium" | "large" | "xl";
    font_family: string;
    mode: "light" | "dark" | "system";
    border_radius: "none" | "small" | "medium" | "large";
    preset: string;
}

export interface UserUi {
    sidebar_collapsed: boolean;
    sidebar_width: "compact" | "normal" | "wide";
    density: "compact" | "comfortable" | "spacious";
    card_style: "flat" | "bordered" | "elevated";
    sidebar_behavior: "fixed" | "collapsible" | "hover";
    reduce_motion: boolean;
}

export interface UserPreferences {
    theme: UserTheme;
    ui: UserUi;
}
