import {
    ELIGIBILITY_STATUS_COLORS,
    ELIGIBILITY_STATUS_LABELS,
} from "@/types/partner-colors";
import type {
    EligibilityCan,
    Partner,
    PartnerEligibility,
} from "@/types/partner.d";
import { router } from "@inertiajs/react";
import {
    Calendar,
    CheckCircle,
    Layers,
    PauseCircle,
    Plus,
    User,
    XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import CreateEligibilityModal from "./CreateEligibilityModal";
import PauseEligibilityModal from "./PauseEligibilityModal";
import ResumeEligibilityModal from "./ResumeEligibilityModal";

interface Props {
    partner: Partner;
    eligibilities: PartnerEligibility[];
    can: EligibilityCan;
}

// ─── Applies-To badge colors ──────────────────────────────────────────────

const APPLIES_TO_COLORS: Record<string, string> = {
    all: "bg-gray-100 text-gray-600",
    capital: "bg-blue-100 text-blue-700",
    working: "bg-purple-100 text-purple-700",
    product: "bg-orange-100 text-orange-700",
};

const APPLIES_TO_LABELS: Record<string, string> = {
    all: "All Streams",
    capital: "Capital",
    working: "Working",
    product: "Product",
};

// -------------------------------------------------------------------------
// Date formatting helper
// -------------------------------------------------------------------------

function formatDate(value?: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// -------------------------------------------------------------------------
// Status icon helper
// -------------------------------------------------------------------------

function StatusIcon({ status }: { status: PartnerEligibility["status"] }) {
    if (status === "active")
        return <CheckCircle size={15} className="text-green-600" />;
    if (status === "paused")
        return <PauseCircle size={15} className="text-amber-500" />;
    return <XCircle size={15} className="text-gray-400" />;
}

// -------------------------------------------------------------------------
// Active Record Card
// -------------------------------------------------------------------------

function ActiveRecordCard({
    eligibility,
    partner,
    can,
    onPause,
    onEnd,
}: {
    eligibility: PartnerEligibility;
    partner: Partner;
    can: EligibilityCan;
    onPause: () => void;
    onEnd: () => void;
}) {
    const handleEnd = () => {
        Swal.fire({
            title: "End Profit Eligibility?",
            text: "This will set the end date to today and mark the record as ended. The partner will no longer be eligible for new distributions from this stream.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, end it",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route("backend.partners.eligibilities.end", {
                        partner: partner.id,
                        eligibility: eligibility.id,
                    }),
                    {},
                    {
                        preserveScroll: true,
                        onSuccess: () =>
                            toast.success("Profit eligibility ended."),
                        onError: () =>
                            toast.error("Failed to end eligibility."),
                    },
                );
                onEnd();
            }
        });
    };

    return (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-800">
                        Active Eligibility
                    </span>
                    {/* Applies-to badge */}
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            APPLIES_TO_COLORS[eligibility.applies_to] ??
                            "bg-gray-100 text-gray-600"
                        }`}
                    >
                        <Layers size={10} />
                        {APPLIES_TO_LABELS[eligibility.applies_to] ??
                            eligibility.applies_to}
                    </span>
                    {eligibility.is_ongoing && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Ongoing
                        </span>
                    )}
                </div>

                {/* Actions */}
                {can.pause && (
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={onPause}
                            className="rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                        >
                            Pause
                        </button>
                        <button
                            onClick={handleEnd}
                            className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                            End
                        </button>
                    </div>
                )}
            </div>

            {/* Dates */}
            <div className="mt-3 flex flex-wrap gap-6 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-400" />
                    <span className="text-gray-500">Start:</span>
                    <span className="font-medium text-gray-800">
                        {formatDate(eligibility.profit_start_date)}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-400" />
                    <span className="text-gray-500">End:</span>
                    <span className="font-medium text-gray-800">
                        {eligibility.profit_end_date
                            ? formatDate(eligibility.profit_end_date)
                            : "No end date"}
                    </span>
                </div>
            </div>

            {/* Created by */}
            {eligibility.creator && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                    <User size={11} />
                    <span>
                        Created by{" "}
                        <span className="font-medium text-gray-700">
                            {eligibility.creator.name}
                        </span>{" "}
                        · {formatDate(eligibility.created_at)}
                    </span>
                </div>
            )}
        </div>
    );
}

// -------------------------------------------------------------------------
// Paused Record Banner
// -------------------------------------------------------------------------

function PausedBanner({
    eligibility,
    can,
    onResume,
}: {
    eligibility: PartnerEligibility;
    can: EligibilityCan;
    onResume: () => void;
}) {
    return (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PauseCircle size={15} className="text-amber-500" />
                    <span className="text-sm font-medium text-amber-800">
                        Eligibility Paused
                    </span>
                    {/* Applies-to badge */}
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            APPLIES_TO_COLORS[eligibility.applies_to] ??
                            "bg-gray-100 text-gray-600"
                        }`}
                    >
                        <Layers size={10} />
                        {APPLIES_TO_LABELS[eligibility.applies_to] ??
                            eligibility.applies_to}
                    </span>
                </div>
                {can.resume && (
                    <button
                        onClick={onResume}
                        className="rounded-md border border-indigo-300 bg-white px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                        Resume
                    </button>
                )}
            </div>
            {eligibility.pause_reason && (
                <p className="mt-2 text-xs text-amber-700">
                    <span className="font-medium">Reason:</span>{" "}
                    {eligibility.pause_reason}
                </p>
            )}
        </div>
    );
}

// -------------------------------------------------------------------------
// History Row
// -------------------------------------------------------------------------

function HistoryRow({ eligibility }: { eligibility: PartnerEligibility }) {
    return (
        <div className="flex items-start gap-3 py-3">
            <div className="mt-0.5">
                <StatusIcon status={eligibility.status} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            ELIGIBILITY_STATUS_COLORS[eligibility.status]
                        }`}
                    >
                        {ELIGIBILITY_STATUS_LABELS[eligibility.status]}
                    </span>
                    {/* Applies-to badge */}
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            APPLIES_TO_COLORS[eligibility.applies_to] ??
                            "bg-gray-100 text-gray-600"
                        }`}
                    >
                        <Layers size={10} />
                        {APPLIES_TO_LABELS[eligibility.applies_to] ??
                            eligibility.applies_to}
                    </span>
                    <span className="text-xs text-gray-500">
                        {formatDate(eligibility.profit_start_date)}
                        {" → "}
                        {eligibility.profit_end_date
                            ? formatDate(eligibility.profit_end_date)
                            : "Ongoing"}
                    </span>
                </div>

                {/* Pause info */}
                {eligibility.status === "paused" &&
                    eligibility.pause_reason && (
                        <p className="mt-1 text-xs text-amber-700">
                            <span className="font-medium">Pause reason:</span>{" "}
                            {eligibility.pause_reason}
                        </p>
                    )}

                {eligibility.paused_by_user && eligibility.paused_at && (
                    <p className="mt-0.5 text-xs text-gray-400">
                        Paused by{" "}
                        <span className="font-medium text-gray-600">
                            {eligibility.paused_by_user.name}
                        </span>{" "}
                        · {formatDate(eligibility.paused_at)}
                    </p>
                )}

                {eligibility.resumed_by_user && eligibility.resumed_at && (
                    <p className="mt-0.5 text-xs text-gray-400">
                        Resumed by{" "}
                        <span className="font-medium text-gray-600">
                            {eligibility.resumed_by_user.name}
                        </span>{" "}
                        · {formatDate(eligibility.resumed_at)}
                    </p>
                )}

                {eligibility.creator && (
                    <p className="mt-0.5 text-xs text-gray-400">
                        Created by{" "}
                        <span className="font-medium text-gray-600">
                            {eligibility.creator.name}
                        </span>{" "}
                        · {formatDate(eligibility.created_at)}
                    </p>
                )}
            </div>
        </div>
    );
}

// -------------------------------------------------------------------------
// Main Panel
// -------------------------------------------------------------------------

export default function EligibilityPanel({
    partner,
    eligibilities,
    can,
}: Props) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [pauseTarget, setPauseTarget] = useState<PartnerEligibility | null>(
        null,
    );
    const [resumeTarget, setResumeTarget] = useState<PartnerEligibility | null>(
        null,
    );

    const activeRecords = eligibilities.filter((e) => e.status === "active");
    const pausedRecords = eligibilities.filter((e) => e.status === "paused");
    const historyRecords = eligibilities.filter((e) => e.status !== "active");

    return (
        <>
            <div className="rounded-lg border border-gray-200 bg-white">
                {/* Panel header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        Profit Eligibility
                        {activeRecords.length > 0 && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                {activeRecords.length} active
                            </span>
                        )}
                    </div>
                    {can.create && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus size={13} />
                            Add Eligibility
                        </button>
                    )}
                </div>

                <div className="p-5 space-y-4">
                    {/* No eligibility at all */}
                    {eligibilities.length === 0 && (
                        <div className="rounded-md border border-dashed border-gray-200 py-8 text-center">
                            <PauseCircle
                                size={28}
                                className="mx-auto mb-2 text-gray-300"
                            />
                            <p className="text-sm font-medium text-gray-500">
                                No eligibility record
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                This partner has no profit eligibility
                                configured.
                                {can.create &&
                                    " Add one to allow profit distributions."}
                            </p>
                        </div>
                    )}

                    {/* Active records — one card per stream */}
                    {activeRecords.length > 0 && (
                        <div className="space-y-3">
                            {activeRecords.map((e) => (
                                <ActiveRecordCard
                                    key={e.id}
                                    eligibility={e}
                                    partner={partner}
                                    can={can}
                                    onPause={() => setPauseTarget(e)}
                                    onEnd={() => {}}
                                />
                            ))}
                        </div>
                    )}

                    {/* Paused records — show resume button per stream */}
                    {pausedRecords.length > 0 && (
                        <div className="space-y-2">
                            {pausedRecords.map((e) => (
                                <PausedBanner
                                    key={e.id}
                                    eligibility={e}
                                    can={can}
                                    onResume={() => setResumeTarget(e)}
                                />
                            ))}
                        </div>
                    )}

                    {/* History */}
                    {historyRecords.length > 0 && (
                        <div>
                            <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                History
                            </p>
                            <div className="divide-y divide-gray-100 rounded-md border border-gray-100">
                                {historyRecords.map((e) => (
                                    <div key={e.id} className="px-3">
                                        <HistoryRow eligibility={e} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateEligibilityModal
                    partner={partner}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
            {pauseTarget && (
                <PauseEligibilityModal
                    partner={partner}
                    eligibility={pauseTarget}
                    onClose={() => setPauseTarget(null)}
                />
            )}
            {resumeTarget && (
                <ResumeEligibilityModal
                    partner={partner}
                    eligibility={resumeTarget}
                    onClose={() => setResumeTarget(null)}
                />
            )}
        </>
    );
}
