import type {
    Distribution,
    DistributionPermissions,
} from "@/types/profit-distribution";
import { Edit2, Eye, Trash2 } from "lucide-react";
import { route } from "ziggy-js";

interface Props {
    distributions: Distribution[];
    can: DistributionPermissions;
    processing: number | null;
    onDelete: (distribution: Distribution) => void;
    onRestore: (distribution: Distribution) => void;
}

function fmt(value: number | string): string {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function fmtDate(value: string | null): string {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function StatusBadge({ status }: { status: Distribution["status"] }) {
    const map = {
        draft: "bg-gray-100 text-gray-600",
        approved: "bg-amber-100 text-amber-700",
        distributed: "bg-green-100 text-green-700",
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[status]}`}
        >
            {status}
        </span>
    );
}

// Gap 1.3 — source type badge
function SourceTypeBadge({
    sourceType,
}: {
    sourceType: Distribution["source_type"];
}) {
    if (sourceType === "partner_based") {
        return (
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                Partner-based
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
            Legacy
        </span>
    );
}

export default function ProfitDistributionTable({
    distributions,
    can,
    processing,
    onDelete,
    onRestore,
}: Props) {
    if (distributions.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
                <p className="text-sm text-gray-500">
                    No profit distributions found.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                    Create a new distribution to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Distribution No
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Title
                            </th>
                            {/* Gap 1.3 */}
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Type
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Period
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Dist. Date
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                Net Profit
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                Distributable
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500">
                                Investors
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500">
                                Status
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {distributions.map((dist) => {
                            const isProcessing = processing === dist.id;

                            return (
                                <tr
                                    key={dist.id}
                                    className={`hover:bg-gray-50 transition-colors ${isProcessing ? "opacity-60" : ""}`}
                                >
                                    {/* Distribution No */}
                                    <td className="px-4 py-3">
                                        <a
                                            href={route(
                                                "backend.profit-distributions.show",
                                                dist.id,
                                            )}
                                            className="font-mono text-xs font-semibold text-indigo-600 hover:underline"
                                        >
                                            {dist.distribution_no}
                                        </a>
                                    </td>

                                    {/* Title */}
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-800 max-w-[200px] truncate">
                                            {dist.title}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            by {dist.creator?.name ?? "—"}
                                        </p>
                                    </td>

                                    {/* Type — Gap 1.3 */}
                                    <td className="px-4 py-3">
                                        <SourceTypeBadge
                                            sourceType={dist.source_type}
                                        />
                                    </td>

                                    {/* Period */}
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                        <span>
                                            {fmtDate(dist.period_start)}
                                        </span>
                                        <span className="mx-1 text-gray-400">
                                            →
                                        </span>
                                        <span>{fmtDate(dist.period_end)}</span>
                                    </td>

                                    {/* Distribution date */}
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                        {fmtDate(dist.distribution_date)}
                                    </td>

                                    {/* Net profit */}
                                    <td className="px-4 py-3 text-right">
                                        <span
                                            className={`font-medium ${Number(dist.net_profit) >= 0 ? "text-indigo-700" : "text-red-600"}`}
                                        >
                                            ৳ {fmt(dist.net_profit)}
                                        </span>
                                    </td>

                                    {/* Distributable */}
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-semibold text-indigo-700">
                                            ৳ {fmt(dist.distributable_amount)}
                                        </span>
                                        <p className="text-xs text-gray-400">
                                            {Number(
                                                dist.distribution_percent,
                                            ).toFixed(1)}
                                            %
                                        </p>
                                    </td>

                                    {/* Investors count */}
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                                            {dist.items_count}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge status={dist.status} />
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            {/* View */}
                                            <a
                                                href={route(
                                                    "backend.profit-distributions.show",
                                                    dist.id,
                                                )}
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                title="View"
                                            >
                                                <Eye size={15} />
                                            </a>

                                            {/* Edit — draft + unlocked only */}
                                            {can.edit && !dist.is_locked && (
                                                <a
                                                    href={route(
                                                        "backend.profit-distributions.edit",
                                                        dist.id,
                                                    )}
                                                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={15} />
                                                </a>
                                            )}

                                            {/* Delete — draft + unlocked only */}
                                            {can.delete && !dist.is_locked && (
                                                <button
                                                    onClick={() =>
                                                        onDelete(dist)
                                                    }
                                                    disabled={isProcessing}
                                                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
