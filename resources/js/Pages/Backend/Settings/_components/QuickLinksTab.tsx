// resources/js/Pages/Backend/Settings/_components/QuickLinksTab.tsx

import { router, usePage } from "@inertiajs/react";
import {
    BarChart3,
    Bell,
    Boxes,
    Calculator,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    ExternalLink,
    FileText,
    Grid2x2,
    Landmark,
    Package,
    Pencil,
    PieChart,
    Plus,
    Receipt,
    Save,
    ScrollText,
    Settings2,
    ShieldAlert,
    ShoppingBag,
    ShoppingCart,
    Trash2,
    TrendingUp,
    Truck,
    Users,
    Wallet,
    X,
} from "lucide-react";
import { ElementType, useState } from "react";
import { toast } from "sonner";

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

interface LinkFormData {
    label: string;
    icon: string;
    route_name: string;
    sort_order: number | string;
    is_active: boolean;
    visible_to_roles: string[];
}

// ─── Icon registry ────────────────────────────────────────────────────────────

const ICON_OPTIONS: { name: string; component: ElementType }[] = [
    { name: "Package", component: Package },
    { name: "Users", component: Users },
    { name: "ShoppingBag", component: ShoppingBag },
    { name: "ShoppingCart", component: ShoppingCart },
    { name: "TrendingUp", component: TrendingUp },
    { name: "BarChart3", component: BarChart3 },
    { name: "Bell", component: Bell },
    { name: "Receipt", component: Receipt },
    { name: "FileText", component: FileText },
    { name: "Wallet", component: Wallet },
    { name: "Landmark", component: Landmark },
    { name: "PieChart", component: PieChart },
    { name: "ClipboardList", component: ClipboardList },
    { name: "Boxes", component: Boxes },
    { name: "ScrollText", component: ScrollText },
    { name: "ShieldAlert", component: ShieldAlert },
    { name: "Truck", component: Truck },
    { name: "Settings2", component: Settings2 },
    { name: "Calculator", component: Calculator },
    { name: "ExternalLink", component: ExternalLink },
    { name: "Grid2x2", component: Grid2x2 },
];

function resolveIcon(name: string): ElementType {
    return ICON_OPTIONS.find((o) => o.name === name)?.component ?? Grid2x2;
}

// ─── Default empty form ───────────────────────────────────────────────────────

const EMPTY_FORM: LinkFormData = {
    label: "",
    icon: "Package",
    route_name: "",
    sort_order: "",
    is_active: true,
    visible_to_roles: [],
};

// ─── Icon picker ──────────────────────────────────────────────────────────────

function IconPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (name: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const SelectedIcon = resolveIcon(value);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-md border border-border bg-input
                           px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
                <SelectedIcon size={16} />
                <span>{value}</span>
                <ChevronDown size={13} className="ml-1 opacity-60" />
            </button>

            {open && (
                <div
                    className="absolute left-0 top-full z-50 mt-1 grid w-64 grid-cols-5
                                gap-1 rounded-lg border border-border bg-card p-2 shadow-lg"
                >
                    {ICON_OPTIONS.map((opt) => {
                        const Icon = opt.component;
                        return (
                            <button
                                key={opt.name}
                                type="button"
                                title={opt.name}
                                onClick={() => {
                                    onChange(opt.name);
                                    setOpen(false);
                                }}
                                className={`flex items-center justify-center rounded-md p-2 transition
                                            hover:bg-muted ${value === opt.name ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                            >
                                <Icon size={18} />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Add / Edit form ──────────────────────────────────────────────────────────

function LinkForm({
    initial,
    onSubmit,
    onCancel,
    processing,
}: {
    initial: LinkFormData;
    onSubmit: (data: LinkFormData) => void;
    onCancel: () => void;
    processing: boolean;
}) {
    const [form, setForm] = useState<LinkFormData>(initial);

    const set = (key: keyof LinkFormData, value: unknown) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = () => {
        if (!form.label.trim()) {
            toast.error("Label is required.");
            return;
        }
        if (!form.route_name.trim()) {
            toast.error("Route name is required.");
            return;
        }
        if (!form.icon) {
            toast.error("Please select an icon.");
            return;
        }
        onSubmit(form);
    };

    return (
        <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
            {/* Label + Icon row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                        Label <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.label}
                        onChange={(e) => set("label", e.target.value)}
                        placeholder="e.g. Products"
                        maxLength={50}
                        className="w-full rounded-md border border-border bg-input px-3 py-2
                                   text-sm text-foreground focus:border-primary/50 focus:outline-none
                                   focus:ring-1 focus:ring-primary/30"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                        Icon <span className="text-red-500">*</span>
                    </label>
                    <IconPicker
                        value={form.icon}
                        onChange={(v) => set("icon", v)}
                    />
                </div>
            </div>

            {/* Route name */}
            <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                    Route Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={form.route_name}
                    onChange={(e) => set("route_name", e.target.value)}
                    placeholder="e.g. backend.products.index"
                    maxLength={100}
                    className="w-full rounded-md border border-border bg-input px-3 py-2
                               text-sm text-foreground focus:border-primary/50 focus:outline-none
                               focus:ring-1 focus:ring-primary/30"
                />
                <p className="text-[11px] text-muted-foreground">
                    Use the Laravel named route — e.g. backend.customers.index
                </p>
            </div>

            {/* Sort order + Active toggle */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                        Sort Order
                    </label>
                    <input
                        type="number"
                        min={0}
                        max={9999}
                        value={form.sort_order}
                        onChange={(e) => set("sort_order", e.target.value)}
                        placeholder="Auto"
                        className="w-full rounded-md border border-border bg-input px-3 py-2
                                   text-sm text-foreground focus:border-primary/50 focus:outline-none
                                   focus:ring-1 focus:ring-primary/30"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                        Status
                    </label>
                    <button
                        type="button"
                        onClick={() => set("is_active", !form.is_active)}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2
                                    text-sm transition ${
                                        form.is_active
                                            ? "border-green-200 bg-green-50 text-green-700"
                                            : "border-border bg-input text-muted-foreground"
                                    }`}
                    >
                        <span>{form.is_active ? "Active" : "Inactive"}</span>
                        <div
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                form.is_active ? "bg-green-500" : "bg-gray-300"
                            }`}
                        >
                            <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow
                                            transition-transform ${form.is_active ? "translate-x-4.5" : "translate-x-0.5"}`}
                            />
                        </div>
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-card
                               px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                >
                    <X size={13} /> Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={processing}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5
                               text-sm font-medium text-primary-foreground hover:bg-primary/90
                               disabled:opacity-60"
                >
                    <Save size={13} />
                    {processing ? "Saving..." : "Save Link"}
                </button>
            </div>
        </div>
    );
}

// ─── Single row ───────────────────────────────────────────────────────────────

function LinkRow({
    link,
    index,
    total,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
}: {
    link: QuickLink;
    index: number;
    total: number;
    onEdit: (link: QuickLink) => void;
    onDelete: (link: QuickLink) => void;
    onMoveUp: (link: QuickLink) => void;
    onMoveDown: (link: QuickLink) => void;
}) {
    const Icon = resolveIcon(link.icon);

    return (
        <div
            className={`flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition
                        ${link.is_active ? "border-border" : "border-dashed border-border opacity-60"}`}
        >
            {/* Icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon size={18} />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                    {link.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {link.route_name}
                </p>
            </div>

            {/* Badges */}
            <div className="flex shrink-0 items-center gap-2">
                <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        link.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground"
                    }`}
                >
                    {link.is_active ? "Active" : "Inactive"}
                </span>
                {link.visible_to_roles && link.visible_to_roles.length > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                        {link.visible_to_roles.join(", ")}
                    </span>
                )}
            </div>

            {/* Reorder buttons */}
            <div className="flex shrink-0 flex-col">
                <button
                    onClick={() => onMoveUp(link)}
                    disabled={index === 0}
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    title="Move up"
                >
                    <ChevronUp size={14} />
                </button>
                <button
                    onClick={() => onMoveDown(link)}
                    disabled={index === total - 1}
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    title="Move down"
                >
                    <ChevronDown size={14} />
                </button>
            </div>

            {/* Edit / Delete */}
            <div className="flex shrink-0 items-center gap-1">
                <button
                    onClick={() => onEdit(link)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Edit"
                >
                    <Pencil size={14} />
                </button>
                <button
                    onClick={() => onDelete(link)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                    title="Delete"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function QuickLinksTab() {
    const props = usePage().props as any;

    // Quick links injected globally via HandleInertiaRequests (all links, not filtered)
    const allLinks: QuickLink[] = props.allQuickLinks ?? [];

    const [links, setLinks] = useState<QuickLink[]>(allLinks);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
    const [processing, setProcessing] = useState(false);

    // ── Add ───────────────────────────────────────────────────────────────────

    const handleAdd = (data: LinkFormData) => {
        setProcessing(true);
        router.post(route("backend.quick-links.store"), data as any, {
            preserveScroll: true,
            onSuccess: () => {
                setShowAddForm(false);
                toast.success("Quick link created.");
            },
            onError: () => toast.error("Failed to create link."),
            onFinish: () => setProcessing(false),
        });
    };

    // ── Edit ──────────────────────────────────────────────────────────────────

    const handleEdit = (data: LinkFormData) => {
        if (!editingLink) return;
        setProcessing(true);
        router.put(
            route("backend.quick-links.update", editingLink.id),
            data as any,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingLink(null);
                    toast.success("Quick link updated.");
                },
                onError: () => toast.error("Failed to update link."),
                onFinish: () => setProcessing(false),
            },
        );
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = (link: QuickLink) => {
        if (!confirm(`Delete "${link.label}"?`)) return;
        router.delete(route("backend.quick-links.destroy", link.id), {
            preserveScroll: true,
            onSuccess: () => toast.success("Quick link deleted."),
            onError: () => toast.error("Failed to delete link."),
        });
    };

    // ── Reorder (optimistic local + backend sync) ──────────────────────────────

    const move = (link: QuickLink, direction: "up" | "down") => {
        const idx = links.findIndex((l) => l.id === link.id);
        if (direction === "up" && idx === 0) return;
        if (direction === "down" && idx === links.length - 1) return;

        const next = [...links];
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];

        // Update sort_order values
        const updated = next.map((l, i) => ({ ...l, sort_order: i + 1 }));
        setLinks(updated);

        // Persist to backend
        window.axios
            .post(route("backend.quick-links.reorder"), {
                items: updated.map((l) => ({
                    id: l.id,
                    sort_order: l.sort_order,
                })),
            })
            .catch(() => toast.error("Failed to save order."));
    };

    return (
        <div className="space-y-5">
            {/* Header card */}
            <div className="rounded-lg border border-border bg-card p-5">
                <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">
                            Quick Links
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Manage the shortcuts that appear in the navbar App
                            Launcher popup.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setShowAddForm((v) => !v);
                            setEditingLink(null);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2
                                   text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus size={15} />
                        Add Link
                    </button>
                </div>

                {/* Add form */}
                {showAddForm && (
                    <div className="mb-4">
                        <LinkForm
                            initial={EMPTY_FORM}
                            onSubmit={handleAdd}
                            onCancel={() => setShowAddForm(false)}
                            processing={processing}
                        />
                    </div>
                )}

                {/* Links list */}
                {links.length === 0 ? (
                    <div className="flex flex-col items-center py-10">
                        <Grid2x2
                            size={36}
                            className="mb-3 text-muted-foreground/30"
                        />
                        <p className="text-sm text-muted-foreground">
                            No quick links yet. Add one above.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {links.map((link, idx) => (
                            <div key={link.id}>
                                <LinkRow
                                    link={link}
                                    index={idx}
                                    total={links.length}
                                    onEdit={(l) => {
                                        setEditingLink(l);
                                        setShowAddForm(false);
                                    }}
                                    onDelete={handleDelete}
                                    onMoveUp={(l) => move(l, "up")}
                                    onMoveDown={(l) => move(l, "down")}
                                />
                                {/* Inline edit form */}
                                {editingLink?.id === link.id && (
                                    <div className="mt-2">
                                        <LinkForm
                                            initial={{
                                                label: editingLink.label,
                                                icon: editingLink.icon,
                                                route_name:
                                                    editingLink.route_name,
                                                sort_order:
                                                    editingLink.sort_order,
                                                is_active:
                                                    editingLink.is_active,
                                                visible_to_roles:
                                                    editingLink.visible_to_roles ??
                                                    [],
                                            }}
                                            onSubmit={handleEdit}
                                            onCancel={() =>
                                                setEditingLink(null)
                                            }
                                            processing={processing}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* View All link */}
                {links.length > 0 && (
                    <div className="mt-4 border-t border-border pt-4">
                        <button
                            onClick={() =>
                                router.visit(route("backend.quick-links.index"))
                            }
                            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                            <ExternalLink size={13} />
                            View full module directory
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
