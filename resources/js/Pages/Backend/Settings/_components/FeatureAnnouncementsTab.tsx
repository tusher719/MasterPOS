// resources/js/Pages/Backend/Settings/_components/FeatureAnnouncementsTab.tsx

import { AppDateInput } from "@/Components/DatePicker";
import { router } from "@inertiajs/react";
import { Edit2, Megaphone, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type BadgeType = "new" | "hot" | "beta" | "custom";

interface Announcement {
    id: number;
    label: string;
    route_name: string;
    badge_type: BadgeType;
    badge_text: string | null;
    badge_label: string;
    show_until: string;
    is_active: boolean;
    is_expired: boolean;
}

interface FormData {
    label: string;
    route_name: string;
    badge_type: BadgeType;
    badge_text: string;
    show_until: string;
    is_active: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_FORM: FormData = {
    label: "",
    route_name: "",
    badge_type: "new",
    badge_text: "",
    show_until: "",
    is_active: true,
};

// Badge color map — static Tailwind strings (purge-safe)
const BADGE_COLORS: Record<BadgeType, string> = {
    new: "bg-indigo-100 text-indigo-700",
    hot: "bg-red-100 text-red-700",
    beta: "bg-amber-100 text-amber-700",
    custom: "bg-indigo-100 text-indigo-700",
};

const BADGE_TYPE_OPTIONS: { value: BadgeType; label: string }[] = [
    { value: "new", label: "New" },
    { value: "hot", label: "Hot" },
    { value: "beta", label: "Beta" },
    { value: "custom", label: "Custom" },
];

// ─── Badge preview pill ───────────────────────────────────────────────────────
function BadgePill({
    badge_label,
    badge_type,
}: {
    badge_label: string;
    badge_type: BadgeType;
}) {
    return (
        <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${BADGE_COLORS[badge_type]}`}
        >
            {badge_label || "Preview"}
        </span>
    );
}

// ─── Announcement form (create + edit) ───────────────────────────────────────
function AnnouncementForm({
    initial,
    onSubmit,
    onCancel,
    submitting,
}: {
    initial: FormData;
    onSubmit: (data: FormData) => void;
    onCancel: () => void;
    submitting: boolean;
}) {
    const [form, setForm] = useState<FormData>(initial);
    const [errors, setErrors] = useState<
        Partial<Record<keyof FormData, string>>
    >({});

    useEffect(() => {
        setForm(initial);
        setErrors({});
    }, [initial]);

    const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = (): boolean => {
        const errs: Partial<Record<keyof FormData, string>> = {};
        if (!form.label.trim()) errs.label = "Label is required.";
        if (!form.route_name.trim())
            errs.route_name = "Route name is required.";
        if (!form.show_until) errs.show_until = "Expiry date is required.";
        if (form.badge_type === "custom" && !form.badge_text.trim()) {
            errs.badge_text = "Badge text is required for Custom type.";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit(form);
    };

    const previewLabel =
        form.badge_type === "custom"
            ? form.badge_text || "Custom"
            : form.badge_type.charAt(0).toUpperCase() +
              form.badge_type.slice(1);

    return (
        // Theme-aware wrapper — bg-muted instead of hardcoded blue tint
        <div className="rounded-lg border border-border bg-muted p-4 space-y-4">
            {/* Label + Route name */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                        Display Label <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.label}
                        onChange={(e) => set("label", e.target.value)}
                        placeholder="e.g. Pre-Orders"
                        maxLength={60}
                        className="w-full rounded-md border-border bg-input text-sm text-foreground focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {errors.label && (
                        <p className="text-xs text-red-500">{errors.label}</p>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                        Route Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.route_name}
                        onChange={(e) => set("route_name", e.target.value)}
                        placeholder="e.g. backend.pre-orders.index"
                        maxLength={120}
                        className="w-full rounded-md border-border bg-input font-mono text-sm text-foreground focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {errors.route_name && (
                        <p className="text-xs text-red-500">
                            {errors.route_name}
                        </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                        Must match the sidebar nav item's route name exactly.
                    </p>
                </div>
            </div>

            {/* Badge type + custom text + expiry */}
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                        Badge Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {BADGE_TYPE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => set("badge_type", opt.value)}
                                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                                    form.badge_type === opt.value
                                        ? "border-indigo-600 bg-indigo-600 text-white"
                                        : "border-border bg-card text-foreground hover:bg-muted"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom text */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                        Custom Text
                        {form.badge_type === "custom" && (
                            <span className="text-red-500"> *</span>
                        )}
                    </label>
                    <input
                        type="text"
                        value={form.badge_text}
                        onChange={(e) => set("badge_text", e.target.value)}
                        placeholder="e.g. Soon"
                        maxLength={20}
                        disabled={form.badge_type !== "custom"}
                        className="w-full rounded-md border-border bg-input text-sm text-foreground focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {errors.badge_text && (
                        <p className="text-xs text-red-500">
                            {errors.badge_text}
                        </p>
                    )}
                </div>

                {/* Expiry date */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                        Show Until <span className="text-red-500">*</span>
                    </label>
                    <AppDateInput
                        value={form.show_until}
                        onChange={(v) => set("show_until", v)}
                        label=""
                        clearable
                    />
                    {errors.show_until && (
                        <p className="text-xs text-red-500">
                            {errors.show_until}
                        </p>
                    )}
                </div>
            </div>

            {/* Active toggle + badge preview */}
            <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                    <button
                        type="button"
                        onClick={() => set("is_active", !form.is_active)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            form.is_active
                                ? "bg-indigo-600"
                                : "bg-muted-foreground/30"
                        }`}
                    >
                        <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                form.is_active
                                    ? "translate-x-4"
                                    : "translate-x-1"
                            }`}
                        />
                    </button>
                    Active
                </label>

                {/* Live preview */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Preview:</span>
                    <span className="text-foreground">
                        {form.label || "Nav Item"}
                    </span>
                    <BadgePill
                        badge_label={previewLabel}
                        badge_type={form.badge_type}
                    />
                </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-2 border-t border-border pt-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                >
                    <X size={13} /> Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {submitting ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}

// ─── Main tab component ───────────────────────────────────────────────────────
export default function FeatureAnnouncementsTab() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formMode, setFormMode] = useState<null | "create" | number>(null);

    useEffect(() => {
        fetch(route("backend.feature-announcements.index"))
            .then((r) => r.json())
            .then((data) => {
                setAnnouncements(data);
                setLoading(false);
            })
            .catch(() => {
                toast.error("Failed to load announcements.");
                setLoading(false);
            });
    }, []);

    const editingAnnouncement =
        typeof formMode === "number"
            ? announcements.find((a) => a.id === formMode)
            : undefined;

    const editInitial: FormData = editingAnnouncement
        ? {
              label: editingAnnouncement.label,
              route_name: editingAnnouncement.route_name,
              badge_type: editingAnnouncement.badge_type,
              badge_text: editingAnnouncement.badge_text ?? "",
              show_until: editingAnnouncement.show_until,
              is_active: editingAnnouncement.is_active,
          }
        : EMPTY_FORM;

    const handleCreate = (data: FormData) => {
        setSubmitting(true);
        router.post(
            route("backend.feature-announcements.store"),
            data as unknown as Record<string, string | boolean>,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Announcement created.");
                    setFormMode(null);
                    fetch(route("backend.feature-announcements.index"))
                        .then((r) => r.json())
                        .then(setAnnouncements);
                },
                onError: (errs) => {
                    toast.error(Object.values(errs)[0] ?? "Failed to create.");
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleUpdate = (data: FormData) => {
        if (typeof formMode !== "number") return;
        setSubmitting(true);
        router.put(
            route("backend.feature-announcements.update", formMode),
            data as unknown as Record<string, string | boolean>,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Announcement updated.");
                    setFormMode(null);
                    fetch(route("backend.feature-announcements.index"))
                        .then((r) => r.json())
                        .then(setAnnouncements);
                },
                onError: (errs) => {
                    toast.error(Object.values(errs)[0] ?? "Failed to update.");
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleDelete = (id: number, label: string) => {
        if (!confirm(`Delete announcement "${label}"?`)) return;
        router.delete(route("backend.feature-announcements.destroy", id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Announcement deleted.");
                setAnnouncements((prev) => prev.filter((a) => a.id !== id));
                if (formMode === id) setFormMode(null);
            },
            onError: () => toast.error("Failed to delete."),
        });
    };

    return (
        <div className="space-y-5">
            {/* Main card */}
            <div className="rounded-lg border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">
                            Navbar Feature Badges
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Show "New", "Hot", or "Beta" badges beside sidebar
                            nav items. Badges auto-expire on the set date.
                        </p>
                    </div>
                    {formMode !== "create" && (
                        <button
                            type="button"
                            onClick={() => setFormMode("create")}
                            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus size={14} />
                            Add Badge
                        </button>
                    )}
                </div>

                {/* Create form */}
                {formMode === "create" && (
                    <div className="mb-4">
                        <AnnouncementForm
                            initial={EMPTY_FORM}
                            onSubmit={handleCreate}
                            onCancel={() => setFormMode(null)}
                            submitting={submitting}
                        />
                    </div>
                )}

                {/* List */}
                {loading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Loading...
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <Megaphone
                            size={32}
                            className="text-muted-foreground/40"
                        />
                        <p className="text-sm text-muted-foreground">
                            No badges configured yet.
                        </p>
                        <button
                            type="button"
                            onClick={() => setFormMode("create")}
                            className="mt-1 text-sm text-indigo-600 hover:text-indigo-400"
                        >
                            + Add your first badge
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {announcements.map((a) => (
                            <div key={a.id}>
                                {/* Row */}
                                <div className="flex items-center gap-3 py-3">
                                    <BadgePill
                                        badge_label={a.badge_label}
                                        badge_type={a.badge_type}
                                    />

                                    <span className="flex-1 text-sm font-medium text-foreground">
                                        {a.label}
                                    </span>

                                    <span className="hidden font-mono text-xs text-muted-foreground md:block">
                                        {a.route_name}
                                    </span>

                                    <span
                                        className={`text-xs ${
                                            a.is_expired
                                                ? "text-red-500"
                                                : "text-muted-foreground"
                                        }`}
                                    >
                                        {a.is_expired
                                            ? "Expired"
                                            : `Until ${a.show_until}`}
                                    </span>

                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            a.is_active && !a.is_expired
                                                ? "bg-green-100 text-green-700"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {a.is_active && !a.is_expired
                                            ? "Active"
                                            : "Inactive"}
                                    </span>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormMode(
                                                    formMode === a.id
                                                        ? null
                                                        : a.id,
                                                )
                                            }
                                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            title="Edit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDelete(a.id, a.label)
                                            }
                                            className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Inline edit form */}
                                {formMode === a.id && (
                                    <div className="mb-3">
                                        <AnnouncementForm
                                            initial={editInitial}
                                            onSubmit={handleUpdate}
                                            onCancel={() => setFormMode(null)}
                                            submitting={submitting}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info card — amber theme-aware */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
                <strong>How it works:</strong> Each badge is matched to a
                sidebar nav item by its exact route name. The badge disappears
                automatically after the "Show Until" date — no manual cleanup
                needed. Live count dots (Order Tasks, Pre-Orders) are always
                shown independently of these badges.
            </div>
        </div>
    );
}
