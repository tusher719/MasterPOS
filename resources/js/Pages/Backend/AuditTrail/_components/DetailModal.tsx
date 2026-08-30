import { router } from "@inertiajs/react";
import {
    ArrowUpRight,
    Clock,
    Code2,
    FileText,
    Tag,
    User,
    X,
} from "lucide-react";
import { useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityLogUser {
    id: number;
    name: string;
    email: string;
}

interface ActivityLog {
    id: number;
    user_id: number | null;
    module: string;
    action: string;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    properties: Record<string, unknown> | null;
    created_at: string;
    user: ActivityLogUser | null;
}

interface Props {
    log: ActivityLog;
    onClose: () => void;
}

// ─── Subject → route navigation map ──────────────────────────────────────────
// subject_type is the full Laravel model class string e.g. App\Models\Product
// We extract the model name and map to the correct named route

const SUBJECT_ROUTE_MAP: Record<string, { route: string; param: string }> = {
    Product: { route: "backend.products.edit", param: "product" },
    Customer: { route: "backend.customers.show", param: "customer" },
    Supplier: { route: "backend.suppliers.index", param: "" },
    Sale: { route: "backend.pos.sales.show", param: "sale" },
    Purchase: { route: "backend.purchases.show", param: "purchase" },
    Investment: { route: "backend.investments.show", param: "investment" },
    Partner: { route: "backend.partners.show", param: "partner" },
    Expense: { route: "backend.expenses.show", param: "expense" },
    ProfitDistribution: {
        route: "backend.profit-distributions.show",
        param: "profit_distribution",
    },
    User: { route: "backend.users.index", param: "" },
    ProductCategory: { route: "backend.product-categories.index", param: "" },
    FraudFlag: { route: "backend.fraud-flags.index", param: "" },
    OrderTask: { route: "backend.order-tasks.index", param: "" },
    PreOrder: { route: "backend.pre-orders.index", param: "" },
};

// Resolve navigate URL from subject_type + subject_id
function resolveSubjectUrl(
    subjectType: string | null,
    subjectId: number | null,
): string | null {
    if (!subjectType || !subjectId) return null;

    // Extract model name from full class string — e.g. "App\Models\Product" → "Product"
    const modelName = subjectType.split("\\").pop() ?? "";
    const mapping = SUBJECT_ROUTE_MAP[modelName];

    if (!mapping) return null;

    try {
        // Routes with a param get the subject_id
        if (mapping.param) {
            return route(mapping.route, { [mapping.param]: subjectId });
        }
        // Index-only routes (no param)
        return route(mapping.route);
    } catch {
        return null;
    }
}

// ─── Format datetime (full) ───────────────────────────────────────────────────

function formatFull(dt: string): string {
    return new Date(dt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
}

// ─── Action badge color ───────────────────────────────────────────────────────

function getActionColor(action: string): string {
    switch (action.toLowerCase()) {
        case "create":
            return "bg-green-100 text-green-700";
        case "update":
            return "bg-blue-100 text-blue-700";
        case "delete":
            return "bg-red-100 text-red-700";
        case "restore":
            return "bg-amber-100 text-amber-700";
        case "approve":
            return "bg-indigo-100 text-indigo-700";
        default:
            return "bg-gray-100 text-gray-600";
    }
}

// ─── Properties renderer ──────────────────────────────────────────────────────
// Recursively renders the properties JSON in a readable diff-style format

function PropertiesBlock({
    properties,
}: {
    properties: Record<string, unknown> | null;
}) {
    if (!properties || Object.keys(properties).length === 0) {
        return (
            <p className="text-xs text-muted-foreground italic">
                No additional properties recorded.
            </p>
        );
    }

    // Check if it has before/after structure (update actions)
    const hasOld = "old" in properties;
    const hasNew = "attributes" in properties || "new" in properties;

    if (hasOld || hasNew) {
        const oldData = (properties.old ?? {}) as Record<string, unknown>;
        const newData = (properties.attributes ??
            properties.new ??
            {}) as Record<string, unknown>;

        // Merge all keys from both old and new
        const allKeys = Array.from(
            new Set([...Object.keys(oldData), ...Object.keys(newData)]),
        );

        return (
            <div className="space-y-1">
                {/* Header row */}
                <div className="grid grid-cols-3 gap-2 border-b border-border pb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Field
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">
                        Before
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600">
                        After
                    </p>
                </div>

                {allKeys.map((key) => {
                    const before = oldData[key];
                    const after = newData[key];
                    const changed =
                        JSON.stringify(before) !== JSON.stringify(after);

                    return (
                        <div
                            key={key}
                            className={`grid grid-cols-3 gap-2 rounded px-1 py-0.5 text-xs ${
                                changed ? "bg-amber-50/60" : ""
                            }`}
                        >
                            <p className="font-mono text-muted-foreground truncate">
                                {key}
                            </p>
                            <p
                                className={`truncate font-mono ${changed ? "text-red-600" : "text-muted-foreground"}`}
                            >
                                {before !== undefined ? (
                                    String(before)
                                ) : (
                                    <span className="opacity-30">—</span>
                                )}
                            </p>
                            <p
                                className={`truncate font-mono ${changed ? "text-green-700 font-semibold" : "text-muted-foreground"}`}
                            >
                                {after !== undefined ? (
                                    String(after)
                                ) : (
                                    <span className="opacity-30">—</span>
                                )}
                            </p>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Flat key-value display for non-diff properties
    return (
        <div className="space-y-1">
            {Object.entries(properties).map(([key, value]) => (
                <div
                    key={key}
                    className="grid grid-cols-2 gap-2 rounded px-1 py-0.5 text-xs"
                >
                    <p className="font-mono text-muted-foreground truncate">
                        {key}
                    </p>
                    <p className="font-mono text-foreground truncate">
                        {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value ?? "—")}
                    </p>
                </div>
            ))}
        </div>
    );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

export default function DetailModal({ log, onClose }: Props) {
    // Escape key closes modal
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const subjectUrl = resolveSubjectUrl(log.subject_type, log.subject_id);
    const modelName = log.subject_type?.split("\\").pop() ?? null;

    const handleNavigate = () => {
        if (!subjectUrl) return;
        onClose();
        router.visit(subjectUrl);
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                <FileText size={16} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">
                                    Activity Detail
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Log entry #{log.id}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="space-y-4 p-5 max-h-[70vh] overflow-y-auto">
                        {/* Meta grid */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {/* Timestamp */}
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    <Clock size={10} />
                                    Timestamp
                                </div>
                                <p className="text-xs font-medium text-foreground">
                                    {formatFull(log.created_at)}
                                </p>
                            </div>

                            {/* User */}
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    <User size={10} />
                                    User
                                </div>
                                {log.user ? (
                                    <div>
                                        <p className="text-xs font-medium text-foreground">
                                            {log.user.name}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground truncate">
                                            {log.user.email}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        System
                                    </p>
                                )}
                            </div>

                            {/* Module */}
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    <Tag size={10} />
                                    Module
                                </div>
                                <p className="text-xs font-medium text-foreground">
                                    {log.module}
                                </p>
                            </div>

                            {/* Action */}
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    <Code2 size={10} />
                                    Action
                                </div>
                                <span
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${getActionColor(log.action)}`}
                                >
                                    {log.action}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Description
                            </p>
                            <p className="text-sm text-foreground">
                                {log.description}
                            </p>
                        </div>

                        {/* Subject */}
                        {modelName && (
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Subject
                                </p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-foreground">
                                            {modelName}
                                        </p>
                                        {log.subject_id && (
                                            <p className="font-mono text-[10px] text-muted-foreground">
                                                ID: {log.subject_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Navigate button — shown only when route mapping exists */}
                                    {subjectUrl && (
                                        <button
                                            onClick={handleNavigate}
                                            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                                        >
                                            View {modelName}
                                            <ArrowUpRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Properties */}
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Properties
                            </p>
                            <PropertiesBlock properties={log.properties} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end border-t border-border px-5 py-4">
                        <button
                            onClick={onClose}
                            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
