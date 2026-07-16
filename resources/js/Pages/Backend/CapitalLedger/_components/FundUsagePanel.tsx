import type {
    ExpenseOption,
    FundUsage,
    FundUsageCan,
    PurchaseOption,
} from "@/types/fund-usage";
import { router } from "@inertiajs/react";
import { Banknote, Link2, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";
import LinkFundUsageModal from "./LinkFundUsageModal";

interface Props {
    entryId: number;
    entryAmount: number;
    linkedAmount: number;
    remainingAmount: number;
    usages: FundUsage[];
    purchases: PurchaseOption[];
    expenses: ExpenseOption[];
    can: FundUsageCan;
}

export default function FundUsagePanel({
    entryId,
    entryAmount,
    linkedAmount,
    remainingAmount,
    usages,
    purchases,
    expenses,
    can,
}: Props) {
    const [showModal, setShowModal] = useState(false);

    // ─── Delete ───────────────────────────────────────────────────

    const handleDelete = (usage: FundUsage) => {
        Swal.fire({
            title: "Unlink Fund Usage?",
            text: `This will unlink ${usage.usable_label} "${usage.usable_title}" (${Number(usage.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} BDT) from this withdrawal.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, unlink it",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("backend.capital-ledger.fund-usages.destroy", {
                        capitalLedgerEntry: entryId,
                        investmentFundUsage: usage.id,
                    }),
                    { preserveScroll: true },
                );
            }
        });
    };

    // ─── Summary Bar ──────────────────────────────────────────────

    const linkedPercent =
        entryAmount > 0 ? Math.min(100, (linkedAmount / entryAmount) * 100) : 0;

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">
                        Fund Usages
                    </span>
                    {usages.length > 0 && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            {usages.length}
                        </span>
                    )}
                </div>
                {can.create && remainingAmount > 0 && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Link Usage
                    </button>
                )}
            </div>

            {/* Amount Summary */}
            <div className="border-b border-gray-100 px-5 py-4">
                <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                    <span>
                        Linked:{" "}
                        <span className="font-medium text-gray-700">
                            {linkedAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                            })}{" "}
                            BDT
                        </span>
                    </span>
                    <span>
                        Remaining:{" "}
                        <span
                            className={`font-medium ${remainingAmount > 0 ? "text-amber-600" : "text-green-600"}`}
                        >
                            {remainingAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                            })}{" "}
                            BDT
                        </span>
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                        className="h-2 rounded-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${linkedPercent}%` }}
                    />
                </div>

                <div className="mt-1.5 text-right text-xs text-gray-400">
                    {linkedPercent.toFixed(1)}% of{" "}
                    {Number(entryAmount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                    })}{" "}
                    BDT withdrawal linked
                </div>
            </div>

            {/* Usages List */}
            <div className="p-5">
                {usages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Banknote className="mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">
                            No fund usages linked
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Link purchases or expenses funded by this
                            withdrawal.
                        </p>
                        {can.create && remainingAmount > 0 && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="mt-3 flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                            >
                                <PlusCircle className="h-3.5 w-3.5" />
                                Link First Usage
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {usages.map((usage) => (
                            <div
                                key={usage.id}
                                className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                            >
                                {/* Left — usable info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {/* Type Badge */}
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                usage.usable_type === "purchase"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-orange-100 text-orange-700"
                                            }`}
                                        >
                                            {usage.usable_label}
                                        </span>
                                        <span className="truncate text-sm font-medium text-gray-800">
                                            {usage.usable_title}
                                        </span>
                                    </div>

                                    <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                                        <span className="font-semibold text-gray-700">
                                            {Number(
                                                usage.amount,
                                            ).toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                            })}{" "}
                                            BDT
                                        </span>
                                        {usage.note && (
                                            <span className="truncate italic">
                                                {usage.note}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-1 text-xs text-gray-400">
                                        Linked by {usage.created_by_name} ·{" "}
                                        {usage.created_at}
                                    </div>
                                </div>

                                {/* Right — delete */}
                                {can.delete && (
                                    <button
                                        onClick={() => handleDelete(usage)}
                                        className="ml-3 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                        title="Unlink"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <LinkFundUsageModal
                    entryId={entryId}
                    remainingAmount={remainingAmount}
                    purchases={purchases}
                    expenses={expenses}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}
