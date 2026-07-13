import { Partner } from "@/types/partner";
import {
    INVESTMENT_STATUS_COLORS,
    INVESTMENT_STATUS_LABELS,
} from "@/types/partner-colors";
import { router } from "@inertiajs/react";
import { Link, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";

interface LinkedInvestmentsCardProps {
    partner: Partner;
    canEdit: boolean;
    onLinkClick: () => void;
}

export default function LinkedInvestmentsCard({
    partner,
    canEdit,
    onLinkClick,
}: LinkedInvestmentsCardProps) {
    const investments = partner.investments ?? [];

    // -------------------------------------------------------------------------
    // Unlink
    // -------------------------------------------------------------------------

    const handleUnlink = (pivotId: number, title: string) => {
        Swal.fire({
            title: "Unlink Investment?",
            text: `"${title}" will be unlinked from this partner. The investment record itself will not be deleted.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, unlink it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("backend.partners.unlink-investment", {
                        partner: partner.id,
                        partnerInvestment: pivotId,
                    }),
                    {
                        onSuccess: () =>
                            toast.success("Investment unlinked successfully."),
                        onError: () =>
                            toast.error("Failed to unlink investment."),
                    },
                );
            }
        });
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                        Linked Investments
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {investments.length}
                    </span>
                </div>
                {canEdit && (
                    <button
                        onClick={onLinkClick}
                        className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Link Investment
                    </button>
                )}
            </div>

            {/* Table */}
            {investments.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-400">
                    No investments linked to this partner yet.
                </div>
            ) : (
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Investment
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Investor
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                Amount
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Primary
                            </th>
                            {canEdit && (
                                <th className="px-4 py-3 text-right font-medium text-gray-500">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {investments.map((investment) => (
                            <tr
                                key={investment.id}
                                className="hover:bg-gray-50"
                            >
                                <td className="px-4 py-3">
                                    <p className="font-medium text-gray-800">
                                        {investment.title}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(
                                            investment.investment_date,
                                        ).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {investment.investor_name}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-800">
                                    ৳
                                    {Number(investment.amount).toLocaleString(
                                        "en-BD",
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        },
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${INVESTMENT_STATUS_COLORS[investment.status]}`}
                                    >
                                        {
                                            INVESTMENT_STATUS_LABELS[
                                                investment.status
                                            ]
                                        }
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {investment.pivot?.is_primary ? (
                                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                            Primary
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">
                                            —
                                        </span>
                                    )}
                                </td>
                                {canEdit && (
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() =>
                                                handleUnlink(
                                                    investment.pivot!.id,
                                                    investment.title,
                                                )
                                            }
                                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                            title="Unlink investment"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>

                    {/* Footer totals */}
                    {investments.length > 1 && (
                        <tfoot className="border-t border-gray-200 bg-gray-50">
                            <tr>
                                <td
                                    colSpan={2}
                                    className="px-4 py-3 text-sm font-medium text-gray-600"
                                >
                                    Total ({investments.length} investments)
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">
                                    ৳
                                    {investments
                                        .reduce(
                                            (sum, inv) =>
                                                sum + Number(inv.amount),
                                            0,
                                        )
                                        .toLocaleString("en-BD", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                </td>
                                <td colSpan={canEdit ? 3 : 2} />
                            </tr>
                        </tfoot>
                    )}
                </table>
            )}
        </div>
    );
}
