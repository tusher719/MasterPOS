import {
    RULE_CHANGE_TYPE_COLORS,
    RULE_CHANGE_TYPE_LABELS,
    RULE_TYPE_LABELS,
} from "@/types/partner-colors";
import { Partner, PartnerProfitRule } from "@/types/partner.d";
import { Clock, X } from "lucide-react";

interface Props {
    partner: Partner;
    profitRules: PartnerProfitRule[];
    onClose: () => void;
}

export default function RuleHistoryDrawer({
    partner,
    profitRules,
    onClose,
}: Props) {
    // Collect all history entries across all rules, sorted by created_at ascending
    const allHistory = profitRules
        .flatMap((rule) =>
            (rule.history ?? []).map((entry) => ({
                ...entry,
                rule,
            })),
        )
        .sort(
            (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
        );

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Rule History
                        </h2>
                        <p className="text-xs text-gray-500">{partner.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {allHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Clock size={32} className="mb-3 text-gray-300" />
                            <p className="text-sm text-gray-400">
                                No history yet.
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                History entries appear after rules are created
                                or approved.
                            </p>
                        </div>
                    ) : (
                        <ol className="relative border-l border-gray-200">
                            {allHistory.map((entry) => (
                                <li key={entry.id} className="mb-6 ml-4">
                                    {/* Timeline dot */}
                                    <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-gray-300" />

                                    {/* Change type badge */}
                                    <div className="mb-1 flex items-center gap-2">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                RULE_CHANGE_TYPE_COLORS[
                                                    entry.change_type
                                                ]
                                            }`}
                                        >
                                            {
                                                RULE_CHANGE_TYPE_LABELS[
                                                    entry.change_type
                                                ]
                                            }
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(
                                                entry.created_at,
                                            ).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>

                                    {/* Rule snapshot */}
                                    <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                                        <p className="text-xs font-medium text-gray-700">
                                            {
                                                RULE_TYPE_LABELS[
                                                    entry.rule.rule_type
                                                ]
                                            }{" "}
                                            —{" "}
                                            {Number(
                                                entry.rule.share_percent,
                                            ).toFixed(2)}
                                            %
                                        </p>

                                        {/* Change reason */}
                                        <p className="mt-1 text-xs text-gray-500 italic">
                                            {entry.change_reason}
                                        </p>

                                        {/* Changed by */}
                                        {entry.changed_by_user && (
                                            <p className="mt-1 text-xs text-gray-400">
                                                by{" "}
                                                <span className="text-gray-600">
                                                    {entry.changed_by_user.name}
                                                </span>
                                            </p>
                                        )}

                                        {/* New values (for updated entries) */}
                                        {entry.change_type === "updated" &&
                                            entry.new_value && (
                                                <div className="mt-2 space-y-0.5 border-t border-gray-200 pt-2">
                                                    {Object.entries(
                                                        entry.new_value,
                                                    ).map(([key, val]) => (
                                                        <p
                                                            key={key}
                                                            className="text-xs text-gray-500"
                                                        >
                                                            <span className="font-medium capitalize">
                                                                {key.replace(
                                                                    /_/g,
                                                                    " ",
                                                                )}
                                                                :
                                                            </span>{" "}
                                                            {String(val ?? "—")}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-5 py-3">
                    <p className="text-xs text-gray-400">
                        {allHistory.length} event
                        {allHistory.length !== 1 ? "s" : ""} recorded
                    </p>
                </div>
            </div>
        </>
    );
}
