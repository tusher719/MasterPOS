import type {
    EffectivePeriodInfo,
    PartnerPreviewItem,
    ProductBreakdownItem,
} from "@/types/profit-calculation";
import {
    AlertCircle,
    CheckCircle,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { Fragment, useState } from "react";

interface Props {
    items: PartnerPreviewItem[];
    onNoteChange: (index: number, note: string) => void;
}

function fmt(value: number | string): string {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function fmtDate(d: string): string {
    return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
    });
}

function RuleTypeBadge({ ruleType }: { ruleType: string | null }) {
    if (!ruleType) return <span className="text-gray-400">—</span>;

    const colors: Record<string, string> = {
        fixed_percent: "bg-indigo-100 text-indigo-700",
        product_based: "bg-orange-100 text-orange-700",
        capital_based: "bg-gray-100 text-gray-600",
        mixed: "bg-purple-100 text-purple-700",
    };
    const labels: Record<string, string> = {
        fixed_percent: "Fixed %",
        product_based: "Product",
        capital_based: "Capital",
        mixed: "Mixed",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[ruleType] ?? "bg-gray-100 text-gray-600"}`}
        >
            {labels[ruleType] ?? ruleType}
        </span>
    );
}

function EffectivePeriodCell({ ep }: { ep: EffectivePeriodInfo | null }) {
    if (!ep) return <span className="text-gray-300">—</span>;

    const isAdjusted =
        ep.start !== ep.selected_start || ep.end !== ep.selected_end;

    return (
        <div className="space-y-0.5">
            {/* Date range — amber when adjusted, normal when full selected period */}
            <p
                className={`text-xs font-medium ${isAdjusted ? "text-amber-700" : "text-gray-700"}`}
            >
                {fmtDate(ep.start)} – {fmtDate(ep.end)}
            </p>

            {/* Already Paid badge (Gap 4.4) */}
            {ep.last_paid_info && (
                <span className="inline-flex items-center rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600 border border-red-100">
                    Already Paid up to {fmtDate(ep.last_paid_info.paid_up_to)}{" "}
                    (from {ep.last_paid_info.distribution_no})
                </span>
            )}

            {/* Eligibility-only adjustment note */}
            {ep.adjustment_reason && !ep.last_paid_info && (
                <p className="text-xs text-amber-600">{ep.adjustment_reason}</p>
            )}
        </div>
    );
}

function ProductBreakdownRow({ rows }: { rows: ProductBreakdownItem[] }) {
    if (rows.length === 0) return null;

    return (
        <div className="mt-2 rounded-md border border-orange-100 bg-orange-50 p-3">
            <p className="mb-2 text-xs font-semibold text-orange-700">
                Product Breakdown
            </p>
            <table className="w-full text-xs">
                <thead>
                    <tr className="text-left text-orange-600">
                        <th className="pb-1 pr-3">Product</th>
                        <th className="pb-1 pr-3 text-right">Qty</th>
                        <th className="pb-1 pr-3 text-right">Revenue</th>
                        <th className="pb-1 pr-3 text-right">Cost</th>
                        <th className="pb-1 pr-3 text-right">Profit</th>
                        <th className="pb-1 pr-3 text-right">Partner Share</th>
                        <th className="pb-1 text-right">Cost Return</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                    {rows.map((row) => (
                        <tr key={row.product_id}>
                            <td className="py-1 pr-3 text-gray-700">
                                {row.product_name}
                            </td>
                            <td className="py-1 pr-3 text-right text-gray-600">
                                {row.qty_sold}
                            </td>
                            <td className="py-1 pr-3 text-right text-gray-600">
                                ৳ {fmt(row.total_revenue)}
                            </td>
                            <td className="py-1 pr-3 text-right text-gray-600">
                                ৳ {fmt(row.total_cost)}
                            </td>
                            <td className="py-1 pr-3 text-right text-gray-600">
                                ৳ {fmt(row.product_profit)}
                            </td>
                            <td className="py-1 pr-3 text-right font-medium text-indigo-700">
                                ৳ {fmt(row.partner_profit)}
                            </td>
                            <td className="py-1 text-right text-green-700">
                                ৳ {fmt(row.cost_return)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function PartnerBasedPreviewTable({
    items,
    onNoteChange,
}: Props) {
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});

    function toggleExpand(index: number) {
        setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
    }

    const eligibleItems = items.filter((i) => i.is_eligible);
    const ineligibleItems = items.filter((i) => !i.is_eligible);

    return (
        <div className="space-y-4">
            {/* ── Eligible Partners ── */}
            {eligibleItems.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                        <h3 className="text-sm font-medium text-gray-700">
                            Eligible Partners
                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                {eligibleItems.length}
                            </span>
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 w-6"></th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        #
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Partner
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Rule Type
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Effective Period
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Share %
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Share Amount
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Cost Return
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Settlement
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Note
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item, i) => {
                                    if (!item.is_eligible) return null;

                                    const hasBreakdown =
                                        item.product_breakdown &&
                                        item.product_breakdown.length > 0;
                                    const isExpanded = expanded[i] ?? false;
                                    const total =
                                        Number(item.share_amount) +
                                        Number(item.cost_return_amount);

                                    return (
                                        <Fragment
                                            key={`partner-row-${item.partner_id}-${i}`}
                                        >
                                            <tr className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    {hasBreakdown && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleExpand(i)
                                                            }
                                                            className="text-gray-400 hover:text-gray-600"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown
                                                                    size={14}
                                                                />
                                                            ) : (
                                                                <ChevronRight
                                                                    size={14}
                                                                />
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">
                                                    {i + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-800">
                                                        {item.partner_name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {item.partner_code}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <RuleTypeBadge
                                                        ruleType={
                                                            item.rule_type
                                                        }
                                                    />
                                                </td>
                                                {/* Effective Period (Gap 4.4 + 4.5) */}
                                                <td className="px-4 py-3">
                                                    <EffectivePeriodCell
                                                        ep={
                                                            item.effective_period ??
                                                            null
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-700">
                                                    {Number(
                                                        item.share_percent,
                                                    ).toFixed(4)}
                                                    %
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-indigo-700">
                                                    ৳ {fmt(item.share_amount)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-green-700">
                                                    {Number(
                                                        item.cost_return_amount,
                                                    ) > 0 ? (
                                                        `৳ ${fmt(item.cost_return_amount)}`
                                                    ) : (
                                                        <span className="text-gray-300">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-gray-800">
                                                    ৳ {fmt(total)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-gray-500 capitalize">
                                                        {item.settlement_type?.replace(
                                                            /_/g,
                                                            " ",
                                                        ) ?? "—"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={item.note ?? ""}
                                                        onChange={(e) =>
                                                            onNoteChange(
                                                                i,
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Optional…"
                                                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                                                    />
                                                </td>
                                            </tr>

                                            {/* Product breakdown expandable row */}
                                            {isExpanded && hasBreakdown && (
                                                <tr
                                                    key={`breakdown-${item.partner_id}`}
                                                >
                                                    <td
                                                        colSpan={11}
                                                        className="px-6 pb-4 pt-0"
                                                    >
                                                        <ProductBreakdownRow
                                                            rows={
                                                                item.product_breakdown!
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                            <tfoot className="border-t border-gray-200 bg-gray-50">
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-3 text-sm font-semibold text-gray-700"
                                    >
                                        Total
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-700">
                                        ৳{" "}
                                        {fmt(
                                            eligibleItems.reduce(
                                                (s, i) =>
                                                    s + Number(i.share_amount),
                                                0,
                                            ),
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-green-700">
                                        ৳{" "}
                                        {fmt(
                                            eligibleItems.reduce(
                                                (s, i) =>
                                                    s +
                                                    Number(
                                                        i.cost_return_amount,
                                                    ),
                                                0,
                                            ),
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">
                                        ৳{" "}
                                        {fmt(
                                            eligibleItems.reduce(
                                                (s, i) =>
                                                    s +
                                                    Number(i.share_amount) +
                                                    Number(
                                                        i.cost_return_amount,
                                                    ),
                                                0,
                                            ),
                                        )}
                                    </td>
                                    <td colSpan={2} />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Ineligible Partners ── */}
            {ineligibleItems.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <AlertCircle size={15} className="text-amber-600" />
                        <p className="text-sm font-medium text-amber-700">
                            Ineligible Partners ({ineligibleItems.length}) —
                            excluded from distribution
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        {ineligibleItems.map((item) => (
                            <div
                                key={item.partner_id}
                                className="flex items-start justify-between rounded-md bg-white px-3 py-2 text-sm border border-amber-100"
                            >
                                <span className="font-medium text-gray-700">
                                    {item.partner_name}
                                    <span className="ml-2 text-xs text-gray-400">
                                        {item.partner_code}
                                    </span>
                                </span>
                                <div className="text-right">
                                    <p className="text-xs text-amber-600">
                                        {item.eligibility_reason}
                                    </p>
                                    {/* Show effective period dates even for ineligible — helps admin understand why */}
                                    {item.effective_period?.start &&
                                        item.effective_period?.end && (
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {item.effective_period.start >
                                                item.effective_period.end
                                                    ? `No unpaid window remaining (prior payment covers up to ${fmtDate(item.effective_period.last_paid_info?.paid_up_to ?? item.effective_period.start)})`
                                                    : `Computed: ${fmtDate(item.effective_period.start)} – ${fmtDate(item.effective_period.end)}`}
                                            </p>
                                        )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── All Eligible ── */}
            {ineligibleItems.length === 0 && eligibleItems.length > 0 && (
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2.5">
                    <CheckCircle size={14} className="text-green-600" />
                    <p className="text-xs text-green-700">
                        All {eligibleItems.length} partner(s) are eligible for
                        this period.
                    </p>
                </div>
            )}
        </div>
    );
}
