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
    Flag,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ── Badge components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: FraudFlag["status"] }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${FRAUD_FLAG_STATUS_COLORS[status]}`}
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
                            ? "Fraud flag confirmed."
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-800">
                        Review Fraud Flag
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-5 py-4">
                    {/* Flag summary */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                        <p className="font-medium text-gray-800">
                            {flag.full_name_snapshot}
                        </p>
                        <p className="text-gray-500">
                            {flag.phone}
                            {flag.email ? ` · ${flag.email}` : ""}
                        </p>
                        <p className="mt-1 text-gray-600">
                            <span className="font-medium">Reason:</span>{" "}
                            {FRAUD_FLAG_REASON_LABELS[flag.reason]}
                        </p>
                        <p className="mt-0.5 text-gray-600">
                            <span className="font-medium">Note:</span>{" "}
                            {flag.reason_note}
                        </p>
                    </div>

                    {/* Action selector */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Action
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setForm((f) => ({
                                        ...f,
                                        action: "confirm",
                                    }))
                                }
                                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                                    form.action === "confirm"
                                        ? "border-red-500 bg-red-50 text-red-700"
                                        : "border-gray-200 text-gray-600 hover:border-gray-300"
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
                                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                                    form.action === "clear"
                                        ? "border-green-500 bg-green-50 text-green-700"
                                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                                }`}
                            >
                                <ShieldCheck size={16} />
                                Clear Flag
                            </button>
                        </div>
                        {errors.action && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.action}
                            </p>
                        )}
                    </div>

                    {/* Review note */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Review Note <span className="text-red-500">*</span>
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
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.review_note && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.review_note}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
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
                        className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                            form.action === "confirm"
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                        } ${!form.action ? "bg-gray-400" : ""}`}
                    >
                        {submitting
                            ? "Saving..."
                            : form.action === "confirm"
                              ? "Confirm Fraud"
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
                    toast.success("Fraud flag created.");
                    onClose();
                },
                onError: (errs) => setErrors(errs as Record<string, string>),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-800">
                        Create Fraud Flag
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-5 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Full Name{" "}
                                <span className="text-red-500">*</span>
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
                                className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.full_name_snapshot && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.full_name_snapshot}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Phone <span className="text-red-500">*</span>
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
                                className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
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
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Address
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
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Reason <span className="text-red-500">*</span>
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
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Select a reason...</option>
                            {FRAUD_FLAG_REASON_OPTIONS.slice(1).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {errors.reason && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.reason}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Note <span className="text-red-500">*</span>
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
                            placeholder="Describe the issue in detail (min 10 characters)..."
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.reason_note && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.reason_note}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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

    return (
        <AuthenticatedLayout>
            <div className="space-y-6 p-6">
                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Fraud Flags
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Review and manage flagged customers and orders.
                        </p>
                    </div>
                    {can.flag && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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
                            color: "text-gray-600",
                            bg: "bg-gray-50",
                        },
                        {
                            label: "Pending Review",
                            value: stats.pending_review,
                            icon: ShieldAlert,
                            color: "text-amber-600",
                            bg: "bg-amber-50",
                        },
                        {
                            label: "Confirmed Fraud",
                            value: stats.confirmed_fraud,
                            icon: ShieldOff,
                            color: "text-red-600",
                            bg: "bg-red-50",
                        },
                        {
                            label: "Cleared",
                            value: stats.cleared,
                            icon: ShieldCheck,
                            color: "text-green-600",
                            bg: "bg-green-50",
                        },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <div
                            key={label}
                            className="rounded-lg border border-gray-200 bg-white p-4"
                        >
                            <div
                                className={`mb-2 inline-flex rounded-lg p-2 ${bg}`}
                            >
                                <Icon size={18} className={color} />
                            </div>
                            <p className="text-2xl font-bold text-gray-800">
                                {value}
                            </p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap gap-3">
                        {/* Search */}
                        <div className="relative min-w-[200px] flex-1">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && applyFilters()
                                }
                                placeholder="Search name, phone, email..."
                                className="w-full rounded-md border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                            className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                setTriggerType(e.target.value);
                                applyFilters({ trigger_type: e.target.value });
                            }}
                            className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                setReason(e.target.value);
                                applyFilters({ reason: e.target.value });
                            }}
                            className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Search
                        </button>

                        {/* Reset */}
                        {hasFilters && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                            >
                                <X size={14} />
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Customer
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Reason
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Trigger
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Flagged At
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Flagged By
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(flags.data ?? []).length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-10 text-center text-sm text-gray-400"
                                        >
                                            No fraud flags found.
                                        </td>
                                    </tr>
                                ) : (
                                    (flags.data ?? []).map((flag) => (
                                        <tr
                                            key={flag.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-800">
                                                    {flag.full_name_snapshot}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {flag.phone}
                                                </p>
                                                {flag.email && (
                                                    <p className="text-xs text-gray-400">
                                                        {flag.email}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-700">
                                                    {
                                                        FRAUD_FLAG_REASON_LABELS[
                                                            flag.reason
                                                        ]
                                                    }
                                                </p>
                                                <p className="mt-0.5 line-clamp-2 max-w-xs text-xs text-gray-500">
                                                    {flag.reason_note}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <TriggerBadge
                                                    type={flag.trigger_type}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    status={flag.status}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {formatDate(flag.flagged_at)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {flag.flaggedBy?.name ?? (
                                                    <span className="italic text-gray-400">
                                                        System
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {flag.is_pending &&
                                                    can.review && (
                                                        <button
                                                            onClick={() =>
                                                                setReviewFlag(
                                                                    flag,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                                                        >
                                                            <CheckCircle
                                                                size={13}
                                                            />
                                                            Review
                                                        </button>
                                                    )}
                                                {!flag.is_pending && (
                                                    <span className="text-xs text-gray-400 italic">
                                                        Reviewed
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {(flags.meta?.last_page ?? 1) > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                            <p className="text-xs text-gray-500">
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
                                        className={`rounded px-2.5 py-1 text-xs ${
                                            link.active
                                                ? "bg-indigo-600 text-white"
                                                : "text-gray-500 hover:bg-gray-100 disabled:opacity-40"
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
        </AuthenticatedLayout>
    );
}
