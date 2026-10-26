import { Modal } from "@mantine/core";
import { Link } from "@inertiajs/react";
import {
    Calendar,
    Check,
    Clock,
    Copy,
    ExternalLink,
    FileText,
    MapPin,
    Phone,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    User,
    X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { FraudFlag } from "@/types/fraud-flag";
import {
    FRAUD_FLAG_REASON_LABELS,
    FRAUD_FLAG_STATUS_COLORS,
    FRAUD_FLAG_STATUS_LABELS,
    FRAUD_FLAG_TRIGGER_COLORS,
    FRAUD_FLAG_TRIGGER_LABELS,
} from "@/types/fraud-flag-colors";

interface Props {
    opened: boolean;
    onClose: () => void;
    flag: FraudFlag | null;
    onReview?: (flag: FraudFlag) => void;
}

export default function FraudFlagPreviewModal({
    opened,
    onClose,
    flag,
    onReview,
}: Props) {
    const [copied, setCopied] = useState(false);

    if (!flag) return null;

    const copyPhone = () => {
        navigator.clipboard.writeText(flag.phone);
        setCopied(true);
        toast.success(`Copied "${flag.phone}" to clipboard`);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleString("en-BD", {
                dateStyle: "medium",
                timeStyle: "short",
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            withCloseButton={false}
            size="lg"
            padding={0}
            radius="lg"
            centered
        >
            <div className="bg-card text-foreground rounded-2xl overflow-hidden border border-border shadow-xl">
                {/* Header Banner */}
                <div className="relative bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-muted p-6 border-b border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                            <ShieldAlert size={24} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-bold text-foreground truncate">
                                    {flag.full_name_snapshot}
                                </h3>
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${FRAUD_FLAG_STATUS_COLORS[flag.status]}`}
                                >
                                    {FRAUD_FLAG_STATUS_LABELS[flag.status]}
                                </span>
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${FRAUD_FLAG_TRIGGER_COLORS[flag.trigger_type]}`}
                                >
                                    {FRAUD_FLAG_TRIGGER_LABELS[flag.trigger_type]}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                Flag ID #{flag.id} · Flagged on {formatDate(flag.flagged_at)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4">
                    {/* Reason Card */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <div className="flex items-center justify-between border-b border-border pb-2 mb-2.5">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Flag Reason
                            </span>
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                {FRAUD_FLAG_REASON_LABELS[flag.reason]}
                            </span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                            {flag.reason_note || "No detailed note provided."}
                        </p>
                    </div>

                    {/* Snapshot Data Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                        <div className="rounded-xl border border-border p-3 space-y-2">
                            <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                                Contact Snapshot
                            </span>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Phone:</span>
                                <div className="flex items-center gap-1 font-mono font-medium text-foreground">
                                    <span>{flag.phone}</span>
                                    <button
                                        type="button"
                                        onClick={copyPhone}
                                        className="p-1 hover:text-primary transition-colors"
                                        title="Copy"
                                    >
                                        {copied ? (
                                            <Check size={11} className="text-emerald-500" />
                                        ) : (
                                            <Copy size={11} />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="text-foreground truncate max-w-[150px]">
                                    {flag.email || "—"}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border p-3 space-y-2">
                            <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                                Address Snapshot
                            </span>
                            <p className="text-foreground leading-relaxed">
                                {flag.address_snapshot || "No address captured."}
                            </p>
                        </div>
                    </div>

                    {/* Review Information (if reviewed) */}
                    {flag.reviewed_at && (
                        <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span>Reviewed by:</span>
                                <span className="font-semibold text-foreground">
                                    {(flag as any).reviewed_by_user?.name ?? "Administrator"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span>Reviewed at:</span>
                                <span>{formatDate(flag.reviewed_at)}</span>
                            </div>
                            {flag.review_note && (
                                <div className="pt-2 border-t border-border mt-2">
                                    <span className="text-muted-foreground font-medium">Review Note:</span>
                                    <p className="text-foreground mt-0.5 leading-relaxed">
                                        {flag.review_note}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-3.5">
                    <Link
                        href={route("backend.pos.sales.index", { search: flag.phone })}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                        <span>Customer Orders History</span>
                        <ExternalLink size={12} />
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            Close
                        </button>
                        {flag.is_pending && onReview && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onReview(flag);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors shadow-xs"
                            >
                                <ShieldCheck size={14} />
                                <span>Review Flag</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
