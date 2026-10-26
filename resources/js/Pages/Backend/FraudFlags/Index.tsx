import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import type {
    FraudFlag,
    FraudFlagIndexProps,
    ReviewFraudFlagFormData,
} from "@/types/fraud-flag";
import {
    FRAUD_FLAG_REASON_LABELS,
    FRAUD_FLAG_REASON_OPTIONS,
    FRAUD_FLAG_STATUS_COLORS,
    FRAUD_FLAG_STATUS_LABELS,
    FRAUD_FLAG_STATUS_OPTIONS,
    FRAUD_FLAG_TRIGGER_COLORS,
    FRAUD_FLAG_TRIGGER_LABELS,
    FRAUD_FLAG_TRIGGER_OPTIONS,
} from "@/types/fraud-flag-colors";
import { router } from "@inertiajs/react";
import {
    CheckCircle,
    Copy,
    Eye,
    Flag,
    RotateCcw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    ShoppingBag,
    X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import TableActionDropdown, { TableActionItem } from "@/Components/Common/TableActionDropdown";
import FraudFlagPreviewModal from "./_components/FraudFlagPreviewModal";

// ── Badge components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: FraudFlag["status"] }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${FRAUD_FLAG_STATUS_COLORS[status]}`}
        >
            {FRAUD_FLAG_STATUS_LABELS[status]}
        </span>
    );
}

function TriggerBadge({ type }: { type: FraudFlag["trigger_type"] }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${FRAUD_FLAG_TRIGGER_COLORS[type]}`}
        >
            {FRAUD_FLAG_TRIGGER_LABELS[type]}
        </span>
    );
}

// ── Review Modal ──────────────────────────────────────────────────────────────

interface ReviewModalProps {
    flag: FraudFlag;
    onClose: () => void;
}

function ReviewModal({ flag, onClose }: ReviewModalProps) {
    const [form, setForm] = useState<ReviewFraudFlagFormData>({
        action: "",
        review_note: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<
        Partial<Record<keyof ReviewFraudFlagFormData, string>>
    >({});

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(
            route("backend.fraud-flags.review", { fraudFlag: flag.id }),
            form as unknown as Record<string, string>,
            {
                onSuccess: () => {
                    toast.success(
                        form.action === "confirm"
                            ? "Fraud flag confirmed and customer blacklisted."
                            : "Fraud flag cleared.",
                    );
                    onClose();
                },
                onError: (errs) => {
                    setErrors(
                        errs as Partial<
                            Record<keyof ReviewFraudFlagFormData, string>
                        >,
                    );
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                Review Fraud Flag
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Resolve flagged customer status
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-6 py-5">
                    {/* Flag summary */}
                    <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-sm space-y-1">
                        <p className="font-semibold text-foreground">
                            {flag.full_name_snapshot}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {flag.phone}
                            {flag.email ? ` · ${flag.email}` : ""}
                        </p>
                        <p className="mt-1.5 text-xs text-foreground">
                            <span className="font-semibold text-muted-foreground">Reason:</span>{" "}
                            {FRAUD_FLAG_REASON_LABELS[flag.reason]}
                        </p>
                        {flag.reason_note && (
                            <p className="text-xs text-muted-foreground">
                                <span className="font-semibold">Note:</span>{" "}
                                {flag.reason_note}
                            </p>
                        )}
                    </div>

                    {/* Action selector */}
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Action Decision <span className="text-destructive">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setForm((f) => ({
                                        ...f,
                                        action: "confirm",
                                    }))
                                }
                                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
                                    form.action === "confirm"
                                        ? "border-destructive bg-destructive/10 text-destructive shadow-sm"
                                        : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/30"
                                }`}
                            >
                                <ShieldAlert size={16} />
                                Confirm Fraud
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setForm((f) => ({ ...f, action: "clear" }))
                                }
                                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
                                    form.action === "clear"
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                        : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/30"
                                }`}
                            >
                                <ShieldCheck size={16} />
                                Clear Flag
                            </button>
                        </div>
                        {errors.action && (
                            <p className="mt-1.5 text-xs text-destructive font-medium">
                                {errors.action}
                            </p>
                        )}
                    </div>

                    {/* Review note */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Review Note <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={form.review_note}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    review_note: e.target.value,
                                }))
                            }
                            placeholder="Explain the reason for this decision (min 10 characters)..."
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
                        />
                        {errors.review_note && (
                            <p className="mt-1.5 text-xs text-destructive font-medium">
                                {errors.review_note}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2.5 border-t border-border px-6 py-4 bg-muted/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={
                            submitting ||
                            !form.action ||
                            form.review_note.length < 10
                        }
                        className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                            form.action === "confirm"
                                ? "bg-destructive hover:bg-destructive/90"
                                : "bg-emerald-600 hover:bg-emerald-700"
                        } ${!form.action ? "bg-muted-foreground" : ""}`}
                    >
                        {submitting
                            ? "Saving..."
                            : form.action === "confirm"
                              ? "Confirm & Blacklist"
                              : form.action === "clear"
                                ? "Clear Flag"
                                : "Submit"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Create Flag Modal ─────────────────────────────────────────────────────────

function CreateFlagModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({
        customer_id: "",
        phone: "",
        email: "",
        full_name_snapshot: "",
        address_snapshot: "",
        reason: "" as FraudFlag["reason"] | "",
        reason_note: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(
            route("backend.fraud-flags.store"),
            form as unknown as Record<string, string>,
            {
                onSuccess: () => {
                    toast.success("Fraud flag created successfully.");
                    onClose();
                },
                onError: (errs) => setErrors(errs as Record<string, string>),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                            <Flag className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                Create Fraud Flag
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Manually flag a customer or phone number
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-6 py-5 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Full Name <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.full_name_snapshot}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        full_name_snapshot: e.target.value,
                                    }))
                                }
                                placeholder="Customer Name"
                                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
                            />
                            {errors.full_name_snapshot && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.full_name_snapshot}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Phone <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        phone: e.target.value,
                                    }))
                                }
                                placeholder="01XXXXXXXXX"
                                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Email
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    email: e.target.value,
                                }))
                            }
                            placeholder="customer@example.com (optional)"
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Address Snapshot
                        </label>
                        <input
                            type="text"
                            value={form.address_snapshot}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    address_snapshot: e.target.value,
                                }))
                            }
                            placeholder="Full delivery address"
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Reason <span className="text-destructive">*</span>
                        </label>
                        <select
                            value={form.reason}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    reason: e.target
                                        .value as FraudFlag["reason"],
                                }))
                            }
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
                        >
                            <option value="">Select a reason...</option>
                            {FRAUD_FLAG_REASON_OPTIONS.slice(1).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {errors.reason && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.reason}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Detailed Note <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={form.reason_note}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    reason_note: e.target.value,
                                }))
                            }
                            placeholder="Describe the suspicious behavior or issue in detail..."
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
                        />
                        {errors.reason_note && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.reason_note}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2.5 border-t border-border px-6 py-4 bg-muted/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
                    >
                        {submitting ? "Saving..." : "Create Flag"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FraudFlagsIndex({
    flags,
    stats,
    filters,
    can,
}: FraudFlagIndexProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState<
        "" | "pending_review" | "confirmed_fraud" | "cleared"
    >(filters.status ?? "");
    const [triggerType, setTriggerType] = useState<
        "" | "manual" | "auto_layer2" | "auto_layer3"
    >(filters.trigger_type ?? "");
    const [reason, setReason] = useState<"" | FraudFlag["reason"]>(
        filters.reason ?? "",
    );
    const [reviewFlag, setReviewFlag] = useState<FraudFlag | null>(null);
    const [previewFlag, setPreviewFlag] = useState<FraudFlag | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            route("backend.fraud-flags.index"),
            { search, status, trigger_type: triggerType, reason, ...overrides },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        setSearch("");
        setStatus("");
        setTriggerType("");
        setReason("");
        router.get(
            route("backend.fraud-flags.index"),
            {},
            { preserveState: false },
        );
    };

    const hasFilters = !!(search || status || triggerType || reason);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getRowActions = (flag: FraudFlag): TableActionItem[] => {
        const items: TableActionItem[] = [
            {
                label: "Quick Preview",
                icon: <Eye className="h-4 w-4 text-blue-500" />,
                onClick: () => setPreviewFlag(flag),
            },
            {
                label: "Copy Phone Number",
                icon: <Copy className="h-4 w-4 text-muted-foreground" />,
                onClick: () => {
                    navigator.clipboard.writeText(flag.phone);
                    toast.success(`Copied phone: ${flag.phone}`);
                },
            },
        ];

        if (flag.customer_id) {
            items.push({
                label: "Customer Sales History",
                icon: <ShoppingBag className="h-4 w-4 text-emerald-500" />,
                onClick: () =>
                    router.get(
                        route("backend.pos.sales.index", {
                            search: flag.phone,
                        }),
                    ),
            });
        }

        if (flag.is_pending && can.review) {
            items.push({
                label: "Review & Resolve",
                icon: <CheckCircle className="h-4 w-4 text-indigo-500" />,
                onClick: () => setReviewFlag(flag),
            });
        }

        return items;
    };

    return (
        <AuthenticatedLayout>
            <div className="space-y-6">
                {/* Page header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Fraud Flags & Blacklist
                            </h1>
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                {stats.total} total
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Multi-layer fraud detection telemetry, customer verification, and blacklist enforcement.
                        </p>
                    </div>
                    {can.flag && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                        >
                            <Flag size={16} />
                            Flag Customer
                        </button>
                    )}
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        {
                            label: "Total Flags",
                            value: stats.total,
                            icon: Shield,
                            color: "text-foreground",
                            bg: "bg-muted/50",
                            border: "border-border",
                        },
                        {
                            label: "Pending Review",
                            value: stats.pending_review,
                            icon: ShieldAlert,
                            color: "text-amber-500",
                            bg: "bg-amber-500/10",
                            border: "border-amber-500/20",
                        },
                        {
                            label: "Confirmed Fraud",
                            value: stats.confirmed_fraud,
                            icon: ShieldOff,
                            color: "text-destructive",
                            bg: "bg-destructive/10",
                            border: "border-destructive/20",
                        },
                        {
                            label: "Cleared / Whitelisted",
                            value: stats.cleared,
                            icon: ShieldCheck,
                            color: "text-emerald-500",
                            bg: "bg-emerald-500/10",
                            border: "border-emerald-500/20",
                        },
                    ].map(({ label, value, icon: Icon, color, bg, border }) => (
                        <div
                            key={label}
                            className={`rounded-2xl border ${border} bg-card p-4 shadow-xs transition-all hover:border-primary/30`}
                        >
                            <div className="flex items-center justify-between">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                                    <Icon size={20} className={color} />
                                </div>
                                <span className="text-2xl font-bold tracking-tight text-foreground">
                                    {value}
                                </span>
                            </div>
                            <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative min-w-[220px] flex-1">
                            <Search
                                size={15}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && applyFilters()
                                }
                                placeholder="Search by name, phone, or email..."
                                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
                            />
                        </div>

                        {/* Status filter */}
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(
                                    e.target.value as
                                        | ""
                                        | "pending_review"
                                        | "confirmed_fraud"
                                        | "cleared",
                                );
                                applyFilters({ status: e.target.value });
                            }}
                            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
                        >
                            {FRAUD_FLAG_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        {/* Trigger filter */}
                        <select
                            value={triggerType}
                            onChange={(e) => {
                                setTriggerType(e.target.value as any);
                                applyFilters({ trigger_type: e.target.value });
                            }}
                            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
                        >
                            {FRAUD_FLAG_TRIGGER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        {/* Reason filter */}
                        <select
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value as any);
                                applyFilters({ reason: e.target.value });
                            }}
                            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
                        >
                            {FRAUD_FLAG_REASON_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        {/* Search button */}
                        <button
                            onClick={() => applyFilters()}
                            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                        >
                            Filter
                        </button>

                        {/* Reset */}
                        {hasFilters && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <RotateCcw size={14} />
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <th className="px-5 py-3.5">Customer Snapshot</th>
                                    <th className="px-5 py-3.5">Fraud Reason</th>
                                    <th className="px-5 py-3.5">Trigger Layer</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Flagged At</th>
                                    <th className="px-5 py-3.5">Flagged By</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {(flags.data ?? []).length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-12 text-center text-sm text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
                                                <p className="font-medium">No fraud flags found.</p>
                                                <p className="text-xs">All transactions and customer profiles are clean.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    (flags.data ?? []).map((flag) => (
                                        <tr
                                            key={flag.id}
                                            className="transition-colors hover:bg-muted/40"
                                        >
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-foreground">
                                                    {flag.full_name_snapshot}
                                                </p>
                                                <p className="text-xs font-mono text-muted-foreground">
                                                    {flag.phone}
                                                </p>
                                                {flag.email && (
                                                    <p className="text-xs text-muted-foreground/80">
                                                        {flag.email}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-foreground">
                                                    {
                                                        FRAUD_FLAG_REASON_LABELS[
                                                            flag.reason
                                                        ]
                                                    }
                                                </p>
                                                {flag.reason_note && (
                                                    <p className="mt-0.5 line-clamp-2 max-w-xs text-xs text-muted-foreground">
                                                        {flag.reason_note}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <TriggerBadge
                                                    type={flag.trigger_type}
                                                />
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <StatusBadge
                                                    status={flag.status}
                                                />
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDate(flag.flagged_at)}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-muted-foreground">
                                                {(flag.flagged_by_user ?? (flag as any).flaggedBy)?.name ?? (
                                                    <span className="italic text-muted-foreground/70">
                                                        System Rule
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {flag.is_pending &&
                                                        can.review && (
                                                            <button
                                                                onClick={() =>
                                                                    setReviewFlag(
                                                                        flag,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                                                            >
                                                                <CheckCircle
                                                                    size={13}
                                                                />
                                                                Review
                                                            </button>
                                                        )}
                                                    <TableActionDropdown
                                                        items={getRowActions(flag)}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {(flags.meta?.last_page ?? 1) > 1 && (
                        <div className="flex items-center justify-between border-t border-border px-5 py-3.5 bg-muted/20">
                            <p className="text-xs text-muted-foreground">
                                Showing {flags.meta?.from ?? 0}–
                                {flags.meta?.to ?? 0} of{" "}
                                {flags.meta?.total ?? 0}
                            </p>
                            <div className="flex gap-1">
                                {(flags.links ?? []).map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.get(link.url)
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                            link.active
                                                ? "bg-primary text-primary-foreground font-semibold"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {reviewFlag && (
                <ReviewModal
                    flag={reviewFlag}
                    onClose={() => setReviewFlag(null)}
                />
            )}
            {showCreateModal && (
                <CreateFlagModal onClose={() => setShowCreateModal(false)} />
            )}
            <FraudFlagPreviewModal
                opened={!!previewFlag}
                onClose={() => setPreviewFlag(null)}
                flag={previewFlag}
                onReview={(f) => {
                    setPreviewFlag(null);
                    setReviewFlag(f);
                }}
            />
        </AuthenticatedLayout>
    );
}
