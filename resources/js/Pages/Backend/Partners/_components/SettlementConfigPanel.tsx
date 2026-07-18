import {
    Partner,
    PartnerSettlementConfig,
    SettlementConfigCan,
} from "@/types/partner";
import {
    PAYMENT_PREFERENCE_COLORS,
    PAYMENT_PREFERENCE_LABELS,
    SETTLEMENT_TYPE_COLORS,
    SETTLEMENT_TYPE_LABELS,
} from "@/types/partner-colors";
import { router } from "@inertiajs/react";
import {
    CheckCircle,
    Clock,
    Pencil,
    Plus,
    Settings,
    Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import CreateSettlementConfigModal from "./CreateSettlementConfigModal";
import EditSettlementConfigModal from "./EditSettlementConfigModal";

interface Props {
    partner: Partner;
    settlementConfigs: PartnerSettlementConfig[];
    can: SettlementConfigCan;
}

export default function SettlementConfigPanel({
    partner,
    settlementConfigs,
    can,
}: Props) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingConfig, setEditingConfig] =
        useState<PartnerSettlementConfig | null>(null);

    const activeConfig = settlementConfigs.find((c) => c.is_active) ?? null;
    const inactiveConfigs = settlementConfigs.filter((c) => !c.is_active);

    // -------------------------------------------------------------------------
    // Approve
    // -------------------------------------------------------------------------

    const handleApprove = (config: PartnerSettlementConfig) => {
        Swal.fire({
            title: "Approve Settlement Config?",
            text: "Once approved, this config cannot be edited or deleted.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#4f46e5",
            confirmButtonText: "Yes, approve it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route("backend.partners.settlement-configs.approve", {
                        partner: partner.id,
                        config: config.id,
                    }),
                    {},
                    {
                        onSuccess: () =>
                            toast.success("Settlement config approved."),
                        onError: () =>
                            toast.error("Failed to approve settlement config."),
                    },
                );
            }
        });
    };

    // -------------------------------------------------------------------------
    // Delete
    // -------------------------------------------------------------------------

    const handleDelete = (config: PartnerSettlementConfig) => {
        Swal.fire({
            title: "Delete Settlement Config?",
            text: "This config will be permanently removed.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("backend.partners.settlement-configs.destroy", {
                        partner: partner.id,
                        config: config.id,
                    }),
                    {
                        onSuccess: () =>
                            toast.success("Settlement config deleted."),
                        onError: () =>
                            toast.error("Failed to delete settlement config."),
                    },
                );
            }
        });
    };

    // -------------------------------------------------------------------------
    // Render helpers
    // -------------------------------------------------------------------------

    const ConfigCard = ({
        config,
        isActive,
    }: {
        config: PartnerSettlementConfig;
        isActive: boolean;
    }) => (
        <div
            className={`rounded-lg border p-4 ${
                isActive
                    ? config.is_pending
                        ? "border-yellow-200 bg-yellow-50/40"
                        : "border-indigo-200 bg-indigo-50/40"
                    : "border-gray-100 bg-gray-50"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex flex-wrap gap-2">
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${SETTLEMENT_TYPE_COLORS[config.settlement_type]}`}
                        >
                            {SETTLEMENT_TYPE_LABELS[config.settlement_type]}
                        </span>
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_PREFERENCE_COLORS[config.payment_preference]}`}
                        >
                            {
                                PAYMENT_PREFERENCE_LABELS[
                                    config.payment_preference
                                ]
                            }
                        </span>
                        {config.auto_cost_return && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                Auto Cost Return
                            </span>
                        )}

                        {/* Approval status badge */}
                        {config.is_pending ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                                <Clock className="h-3 w-3" />
                                Pending Approval
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                <CheckCircle className="h-3 w-3" />
                                Approved
                            </span>
                        )}

                        {!isActive && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                                Inactive
                            </span>
                        )}
                    </div>

                    {/* Notes */}
                    {config.notes && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                            {config.notes}
                        </p>
                    )}

                    {/* Audit */}
                    <p className="text-xs text-gray-400">
                        Created{" "}
                        {new Date(config.created_at).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "short", year: "numeric" },
                        )}
                        {config.created_by_user && (
                            <> by {config.created_by_user.name}</>
                        )}
                        {config.is_approved && config.approved_by_user && (
                            <> · Approved by {config.approved_by_user.name}</>
                        )}
                    </p>
                </div>

                {/* Actions — only for active config */}
                {isActive && (
                    <div className="flex items-center gap-1 shrink-0">
                        {/* Approve button — only when pending */}
                        {config.is_pending && can.approve && (
                            <button
                                onClick={() => handleApprove(config)}
                                className="rounded-md p-1.5 text-gray-400 hover:bg-white hover:text-indigo-600"
                                title="Approve config"
                            >
                                <CheckCircle className="h-4 w-4" />
                            </button>
                        )}
                        {/* Edit — only when pending */}
                        {config.is_pending && can.edit && (
                            <button
                                onClick={() => setEditingConfig(config)}
                                className="rounded-md p-1.5 text-gray-400 hover:bg-white hover:text-indigo-600"
                                title="Edit config"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                        )}
                        {/* Delete — only when pending */}
                        {config.is_pending && can.delete && (
                            <button
                                onClick={() => handleDelete(config)}
                                className="rounded-md p-1.5 text-gray-400 hover:bg-white hover:text-red-500"
                                title="Delete config"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <>
            <div className="rounded-lg border border-gray-200 bg-white">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Settings className="h-4 w-4 text-gray-400" />
                        Settlement Config
                    </div>
                    {can.create && !activeConfig && !partner.deleted_at && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Config
                        </button>
                    )}
                </div>

                <div className="p-5 space-y-4">
                    {/* Active config */}
                    {activeConfig ? (
                        <ConfigCard config={activeConfig} isActive={true} />
                    ) : (
                        <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
                            <Settings className="mx-auto h-8 w-8 text-gray-300" />
                            <p className="mt-2 text-sm text-gray-500">
                                No settlement config yet
                            </p>
                            <p className="text-xs text-gray-400">
                                Defaults to Profit Only / Cash when unset
                            </p>
                            {can.create && !partner.deleted_at && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Config
                                </button>
                            )}
                        </div>
                    )}

                    {/* Inactive configs history */}
                    {inactiveConfigs.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                Previous Configs
                            </p>
                            {inactiveConfigs.map((config) => (
                                <ConfigCard
                                    key={config.id}
                                    config={config}
                                    isActive={false}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateSettlementConfigModal
                    partner={partner}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
            {editingConfig && (
                <EditSettlementConfigModal
                    partner={partner}
                    config={editingConfig}
                    onClose={() => setEditingConfig(null)}
                />
            )}
        </>
    );
}
