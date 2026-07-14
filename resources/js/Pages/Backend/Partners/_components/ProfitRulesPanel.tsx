import {
    PROFIT_SOURCE_COLORS,
    PROFIT_SOURCE_LABELS,
    RULE_TYPE_COLORS,
    RULE_TYPE_LABELS,
} from "@/types/partner-colors";
import { Partner, PartnerProfitRule, ProfitRuleCan } from "@/types/partner.d";
import { router } from "@inertiajs/react";
import {
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    Edit2,
    History,
    PlusCircle,
    Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import CreateProfitRuleModal from "./CreateProfitRuleModal";
import EditProfitRuleModal from "./EditProfitRuleModal";
import RuleHistoryDrawer from "./RuleHistoryDrawer";

interface Props {
    partner: Partner;
    profitRules: PartnerProfitRule[];
    can: ProfitRuleCan;
}

// -------------------------------------------------------------------------
// Date formatting helper
// -------------------------------------------------------------------------

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function ProfitRulesPanel({ partner, profitRules, can }: Props) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingRule, setEditingRule] = useState<PartnerProfitRule | null>(
        null,
    );
    const [showHistory, setShowHistory] = useState(false);
    const [expandedRule, setExpandedRule] = useState<number | null>(null);

    // -------------------------------------------------------------------------
    // Approve
    // -------------------------------------------------------------------------

    const handleApprove = (rule: PartnerProfitRule) => {
        Swal.fire({
            title: "Approve Profit Rule?",
            html: `
                <div class="text-left text-sm space-y-1">
                    <p><strong>Type:</strong> ${RULE_TYPE_LABELS[rule.rule_type]}</p>
                    <p><strong>Share:</strong> ${Number(rule.share_percent).toFixed(2)}%</p>
                    <p><strong>Effective From:</strong> ${formatDate(rule.effective_from)}</p>
                    <p class="mt-2 text-amber-600">This will deactivate the current active rule for this partner.</p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Approve",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#4f46e5",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route("backend.partners.profit-rules.approve", {
                        partner: partner.id,
                        profitRule: rule.id,
                    }),
                    {},
                    {
                        onSuccess: () =>
                            toast.success("Profit rule approved successfully."),
                        onError: () =>
                            toast.error("Failed to approve profit rule."),
                    },
                );
            }
        });
    };

    // -------------------------------------------------------------------------
    // Delete pending rule
    // -------------------------------------------------------------------------

    const handleDelete = (rule: PartnerProfitRule) => {
        Swal.fire({
            title: "Delete Pending Rule?",
            text: "This pending profit rule will be permanently deleted.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#ef4444",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("backend.partners.profit-rules.destroy", {
                        partner: partner.id,
                        profitRule: rule.id,
                    }),
                    {
                        onSuccess: () => toast.success("Pending rule deleted."),
                        onError: () => toast.error("Failed to delete rule."),
                    },
                );
            }
        });
    };

    // -------------------------------------------------------------------------
    // Derived
    // -------------------------------------------------------------------------

    const activeRule = profitRules.find((r) => r.is_currently_active) ?? null;
    const pendingRules = profitRules.filter((r) => r.is_pending);
    const historicalRules = profitRules.filter(
        (r) => r.is_approved && !r.is_currently_active,
    );

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-medium text-gray-700">
                    Profit Rules
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(true)}
                        className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                    >
                        <History size={14} />
                        History
                    </button>
                    {can.create && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700"
                        >
                            <PlusCircle size={14} />
                            New Rule
                        </button>
                    )}
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {/* Active Rule */}
                {activeRule ? (
                    <ActiveRuleCard rule={activeRule} />
                ) : (
                    <div className="px-5 py-6 text-center text-sm text-gray-400">
                        No active profit rule. Create and approve one to enable
                        profit distribution.
                    </div>
                )}

                {/* Pending Rules */}
                {pendingRules.length > 0 && (
                    <div className="px-5 py-3">
                        <p className="mb-2 text-xs font-medium text-amber-600">
                            Pending Approval ({pendingRules.length})
                        </p>
                        <div className="space-y-2">
                            {pendingRules.map((rule) => (
                                <PendingRuleCard
                                    key={rule.id}
                                    rule={rule}
                                    can={can}
                                    onApprove={() => handleApprove(rule)}
                                    onEdit={() => setEditingRule(rule)}
                                    onDelete={() => handleDelete(rule)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Historical Rules (collapsible) */}
                {historicalRules.length > 0 && (
                    <div className="px-5 py-3">
                        <button
                            onClick={() =>
                                setExpandedRule(expandedRule === -1 ? null : -1)
                            }
                            className="flex w-full items-center justify-between text-xs text-gray-500 hover:text-gray-700"
                        >
                            <span>
                                Previous Rules ({historicalRules.length})
                            </span>
                            {expandedRule === -1 ? (
                                <ChevronUp size={14} />
                            ) : (
                                <ChevronDown size={14} />
                            )}
                        </button>

                        {expandedRule === -1 && (
                            <div className="mt-2 space-y-2">
                                {historicalRules.map((rule) => (
                                    <HistoricalRuleCard
                                        key={rule.id}
                                        rule={rule}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state */}
                {profitRules.length === 0 && (
                    <div className="px-5 py-6 text-center text-sm text-gray-400">
                        No profit rules configured yet.
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateProfitRuleModal
                    partner={partner}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {editingRule && (
                <EditProfitRuleModal
                    partner={partner}
                    rule={editingRule}
                    onClose={() => setEditingRule(null)}
                />
            )}

            {showHistory && (
                <RuleHistoryDrawer
                    partner={partner}
                    profitRules={profitRules}
                    onClose={() => setShowHistory(false)}
                />
            )}
        </div>
    );
}

// -------------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------------

function ActiveRuleCard({ rule }: { rule: PartnerProfitRule }) {
    return (
        <div className="px-5 py-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5" />
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">
                                {Number(rule.share_percent).toFixed(2)}% Share
                            </span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${RULE_TYPE_COLORS[rule.rule_type]}`}
                            >
                                {RULE_TYPE_LABELS[rule.rule_type]}
                            </span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROFIT_SOURCE_COLORS[rule.profit_source]}`}
                            >
                                {PROFIT_SOURCE_LABELS[rule.profit_source]}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Effective from{" "}
                            <span className="font-medium text-gray-700">
                                {formatDate(rule.effective_from)}
                            </span>
                            {rule.effective_to && (
                                <>
                                    {" "}
                                    to{" "}
                                    <span className="font-medium text-gray-700">
                                        {formatDate(rule.effective_to)}
                                    </span>
                                </>
                            )}
                        </p>
                        {rule.reason && (
                            <p className="mt-1 text-xs text-gray-400 italic">
                                {rule.reason}
                            </p>
                        )}
                    </div>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Active
                </span>
            </div>

            {rule.approved_by_user && (
                <p className="mt-2 text-xs text-gray-400">
                    Approved by{" "}
                    <span className="text-gray-600">
                        {rule.approved_by_user.name}
                    </span>
                    {rule.approved_at && (
                        <> on {formatDate(rule.approved_at)}</>
                    )}
                </p>
            )}
        </div>
    );
}

function PendingRuleCard({
    rule,
    can,
    onApprove,
    onEdit,
    onDelete,
}: {
    rule: PartnerProfitRule;
    can: ProfitRuleCan;
    onApprove: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Clock
                        size={14}
                        className="text-amber-500 mt-0.5 shrink-0"
                    />
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-800">
                                {Number(rule.share_percent).toFixed(2)}% Share
                            </span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${RULE_TYPE_COLORS[rule.rule_type]}`}
                            >
                                {RULE_TYPE_LABELS[rule.rule_type]}
                            </span>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                Pending Approval
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Effective from{" "}
                            <span className="font-medium text-gray-700">
                                {formatDate(rule.effective_from)}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {can.approve && (
                        <button
                            onClick={onApprove}
                            className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs text-white hover:bg-indigo-700"
                        >
                            Approve
                        </button>
                    )}
                    {can.edit && (
                        <button
                            onClick={onEdit}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                            title="Edit"
                        >
                            <Edit2 size={13} />
                        </button>
                    )}
                    {can.edit && (
                        <button
                            onClick={onDelete}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                            title="Delete"
                        >
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function HistoricalRuleCard({ rule }: { rule: PartnerProfitRule }) {
    return (
        <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3 opacity-75">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">
                    {Number(rule.share_percent).toFixed(2)}% Share
                </span>
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${RULE_TYPE_COLORS[rule.rule_type]}`}
                >
                    {RULE_TYPE_LABELS[rule.rule_type]}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    Superseded
                </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
                {formatDate(rule.effective_from)} →{" "}
                {rule.effective_to ? formatDate(rule.effective_to) : "—"}
            </p>
        </div>
    );
}
