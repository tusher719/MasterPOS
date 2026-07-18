import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import type { PartnerPreviewItem } from "@/types/profit-calculation";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import { ArrowLeft, Calculator, Lock, RefreshCw, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";
import PartnerBasedPreviewTable from "./_components/PartnerBasedPreviewTable";
// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemData {
    [key: string]: string | number | Record<string, any> | null | undefined;
    investment_id: number | null;
    partner_id: number | null;
    investor_name: string;
    investment_title: string;
    investment_type: string;
    invested_amount: number | null;
    share_percent: number;
    share_amount: number;
    cost_return_amount?: number;
    rule_type?: string | null;
    partner_name?: string;
    partner_code?: string;
    note: string | null;
    profit_rule_snapshot: Record<string, any> | null;
    settlement_type: string | null;
    // Gap 4.5 — effective period snapshot per item
    effective_period?: Record<string, any> | null;
}

interface Distribution {
    id: number;
    distribution_no: string;
    title: string;
    distribution_date: string;
    period_start: string;
    period_end: string;
    total_revenue: string;
    total_cogs: string;
    total_expenses: string;
    total_investment: string;
    gross_profit: string;
    net_profit: string;
    distribution_percent: string;
    distributable_amount: string;
    source_type: "investment_based" | "partner_based";
    status: "draft" | "approved" | "distributed";
    is_locked: boolean;
    note: string | null;
    items: ItemData[];
}

interface PreviewData {
    total_revenue: number;
    total_cogs: number;
    total_expenses: number;
    total_investment: number;
    gross_profit: number;
    net_profit: number;
    distribution_percent: number;
    distributable_amount: number;
    items: ItemData[];
}

interface FormData {
    title: string;
    distribution_date: string;
    period_start: string;
    period_end: string;
    distribution_percent: string;
    distributable_amount: string;
    source_type: "investment_based" | "partner_based";
    note: string;
    total_revenue: string;
    total_cogs: string;
    total_expenses: string;
    total_investment: string;
    gross_profit: string;
    net_profit: string;
    items: ItemData[];
}

interface Errors {
    [key: string]: string;
}

interface Props {
    distribution: Distribution;
    can: { edit: boolean };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number | string | null): string {
    if (value === null || value === undefined) return "—";
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function toDateInputValue(value: string | null | undefined): string {
    if (!value) return "";
    return value.slice(0, 10);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Edit({ distribution, can }: Props) {
    if (distribution.is_locked) {
        return (
            <AuthenticatedLayout>
                <Head title="Edit Distribution" />
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Lock size={40} className="mb-4 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-700">
                        This distribution is locked
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Approved or distributed records cannot be edited.
                    </p>
                    <a
                        href={route(
                            "backend.profit-distributions.show",
                            distribution.id,
                        )}
                        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        View Distribution
                    </a>
                </div>
            </AuthenticatedLayout>
        );
    }

    const isPartnerBased = distribution.source_type === "partner_based";

    const [form, setForm] = useState<FormData>({
        title: distribution.title,
        distribution_date: toDateInputValue(distribution.distribution_date),
        period_start: toDateInputValue(distribution.period_start),
        period_end: toDateInputValue(distribution.period_end),
        distribution_percent: distribution.distribution_percent,
        distributable_amount: distribution.distributable_amount,
        source_type: distribution.source_type,
        note: distribution.note ?? "",
        total_revenue: distribution.total_revenue,
        total_cogs: distribution.total_cogs,
        total_expenses: distribution.total_expenses,
        total_investment: distribution.total_investment,
        gross_profit: distribution.gross_profit,
        net_profit: distribution.net_profit,
        items: distribution.items,
    });

    const [errors, setErrors] = useState<Errors>({});
    const [calculating, setCalculating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [recalculated, setRecalculated] = useState(false);

    function update(field: keyof FormData, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // ─── Recalculate ──────────────────────────────────────────────────────────

    async function handleRecalculate() {
        if (!form.period_start || !form.period_end) {
            toast.error("Please select period start and end dates first.");
            return;
        }

        setCalculating(true);
        try {
            const response = await axios.get(
                route("backend.profit-calculation.preview"),
                {
                    params: {
                        period_start: form.period_start,
                        period_end: form.period_end,
                        distribution_percent:
                            form.distribution_percent || "100",
                        source_type: form.source_type,
                        // Exclude this distribution from the overlap check (Gap 4.4)
                        exclude_distribution_id: distribution.id,
                    },
                },
            );

            const data: PreviewData = response.data;

            setForm((prev) => ({
                ...prev,
                total_revenue: String(data.total_revenue),
                total_cogs: String(data.total_cogs),
                total_expenses: String(data.total_expenses),
                total_investment: String(data.total_investment),
                gross_profit: String(data.gross_profit),
                net_profit: String(data.net_profit),
                distributable_amount: String(data.distributable_amount),
                items: data.items,
            }));

            setRecalculated(true);

            if (data.items.length === 0) {
                toast.warning("No active records found for this period.");
            } else {
                const eligibleCount =
                    form.source_type === "partner_based"
                        ? (
                              data.items as unknown as PartnerPreviewItem[]
                          ).filter((i) => i.is_eligible).length
                        : data.items.length;

                toast.success(
                    `Recalculated — ${eligibleCount} eligible record(s) found.`,
                );
            }
        } catch (err: any) {
            const msg = err.response?.data?.message ?? "Recalculation failed.";
            toast.error(msg);
        } finally {
            setCalculating(false);
        }
    }

    // ─── Note update ──────────────────────────────────────────────────────────

    function updateItemNote(index: number, note: string) {
        setForm((prev) => {
            const items = [...prev.items];
            items[index] = { ...items[index], note };
            return { ...prev, items };
        });
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (form.items.length === 0) {
            toast.error("No items found. Please recalculate first.");
            return;
        }

        setSubmitting(true);
        setErrors({});

        router.put(
            route("backend.profit-distributions.update", distribution.id),
            {
                title: form.title,
                distribution_date: form.distribution_date,
                period_start: form.period_start,
                period_end: form.period_end,
                distribution_percent: form.distribution_percent,
                distributable_amount: form.distributable_amount,
                source_type: form.source_type,
                note: form.note,
                total_revenue: form.total_revenue,
                total_cogs: form.total_cogs,
                total_expenses: form.total_expenses,
                total_investment: form.total_investment,
                gross_profit: form.gross_profit,
                net_profit: form.net_profit,
                items: form.items,
            },
            {
                onError: (errs) => {
                    setErrors(errs);
                    toast.error("Please fix the errors below.");
                },
                onFinish: () => setSubmitting(false),
            },
        );
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <AuthenticatedLayout>
            <Head title={`Edit — ${distribution.distribution_no}`} />

            <div className="space-y-6">
                {/* Page header */}
                <div className="flex items-center gap-4">
                    <a
                        href={route(
                            "backend.profit-distributions.show",
                            distribution.id,
                        )}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        <ArrowLeft size={14} />
                        Back
                    </a>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Edit Distribution
                            <span className="ml-2 text-base font-normal text-gray-500">
                                {distribution.distribution_no}
                            </span>
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Only draft distributions can be edited.
                        </p>
                    </div>
                </div>

                {/* Draft badge */}
                <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Draft — changes will update the financial snapshots
                    </div>
                    {/* Source type badge — read-only on edit */}
                    <div
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                            isPartnerBased
                                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                : "border-gray-200 bg-gray-50 text-gray-600"
                        }`}
                    >
                        {isPartnerBased ? "Partner Based" : "Investment Based"}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ── Section 1: Basic Info ── */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="mb-4 text-base font-semibold text-gray-700">
                            Basic Information
                        </h2>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Title */}
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Title{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) =>
                                        update("title", e.target.value)
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            {/* Distribution date */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Distribution Date{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.distribution_date}
                                    onChange={(e) =>
                                        update(
                                            "distribution_date",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {errors.distribution_date && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.distribution_date}
                                    </p>
                                )}
                            </div>

                            {/* Distribution percent */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Distribution %{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={form.distribution_percent}
                                    onChange={(e) =>
                                        update(
                                            "distribution_percent",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {errors.distribution_percent && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.distribution_percent}
                                    </p>
                                )}
                            </div>

                            {/* Note */}
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Note
                                </label>
                                <textarea
                                    value={form.note}
                                    onChange={(e) =>
                                        update("note", e.target.value)
                                    }
                                    rows={2}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {errors.note && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.note}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Section 2: Period & Recalculate ── */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="mb-1 text-base font-semibold text-gray-700">
                            Period & Recalculation
                        </h2>
                        <p className="mb-4 text-xs text-gray-500">
                            Click Recalculate to refresh financial data for the
                            selected period.
                        </p>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Period Start{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.period_start}
                                    onChange={(e) =>
                                        update("period_start", e.target.value)
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {errors.period_start && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.period_start}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Period End{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.period_end}
                                    onChange={(e) =>
                                        update("period_end", e.target.value)
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {errors.period_end && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.period_end}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={handleRecalculate}
                                    disabled={calculating}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                                >
                                    {calculating ? (
                                        <RefreshCw
                                            size={15}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Calculator size={15} />
                                    )}
                                    {calculating
                                        ? "Recalculating…"
                                        : "Recalculate"}
                                </button>
                            </div>
                        </div>

                        {/* Financial summary */}
                        <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    Financial Summary
                                </h3>
                                {recalculated && (
                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                        Recalculated
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {[
                                    {
                                        label: "Total Revenue",
                                        value: form.total_revenue,
                                        color: "text-green-700",
                                    },
                                    {
                                        label: "Total COGS",
                                        value: form.total_cogs,
                                        color: "text-orange-600",
                                    },
                                    {
                                        label: "Total Expenses",
                                        value: form.total_expenses,
                                        color: "text-red-600",
                                    },
                                    {
                                        label: "Gross Profit",
                                        value: form.gross_profit,
                                        color:
                                            Number(form.gross_profit) >= 0
                                                ? "text-indigo-700"
                                                : "text-red-600",
                                    },
                                    {
                                        label: "Net Profit",
                                        value: form.net_profit,
                                        color:
                                            Number(form.net_profit) >= 0
                                                ? "text-indigo-700"
                                                : "text-red-600",
                                    },
                                    {
                                        label: "Total Investment",
                                        value: form.total_investment,
                                        color: "text-gray-700",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-md border border-gray-200 bg-white p-3"
                                    >
                                        <p className="text-xs text-gray-500">
                                            {item.label}
                                        </p>
                                        <p
                                            className={`mt-0.5 text-sm font-semibold ${item.color}`}
                                        >
                                            ৳ {fmt(item.value)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 max-w-xs">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Distributable Amount (editable)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.distributable_amount}
                                    onChange={(e) =>
                                        update(
                                            "distributable_amount",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {errors.distributable_amount && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.distributable_amount}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Section 3: Share Breakdown ── */}
                    {form.items.length > 0 && (
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <h2 className="text-base font-semibold text-gray-700">
                                    {isPartnerBased ? "Partner" : "Investor"}{" "}
                                    Share Breakdown
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        ({form.items.length} record
                                        {form.items.length !== 1 ? "s" : ""})
                                    </span>
                                </h2>
                            </div>

                            <div className="p-5">
                                {/* Partner-based — full PartnerBasedPreviewTable with Effective Period column */}
                                {isPartnerBased && (
                                    <PartnerBasedPreviewTable
                                        items={
                                            form.items as unknown as PartnerPreviewItem[]
                                        }
                                        onNoteChange={updateItemNote}
                                    />
                                )}

                                {/* Investment-based — legacy simple table */}
                                {!isPartnerBased && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="border-b border-gray-100 bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                        #
                                                    </th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                        Investor
                                                    </th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                        Investment
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                        Invested
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                        Share %
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                        Share Amount
                                                    </th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                        Note
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {form.items.map((item, i) => (
                                                    <tr
                                                        key={i}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="px-4 py-3 text-gray-500">
                                                            {i + 1}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-gray-800">
                                                            {item.investor_name}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-gray-700">
                                                                {
                                                                    item.investment_title
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {
                                                                    item.investment_type
                                                                }
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-700">
                                                            ৳{" "}
                                                            {fmt(
                                                                item.invested_amount,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-700">
                                                            {Number(
                                                                item.share_percent,
                                                            ).toFixed(4)}
                                                            %
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-indigo-700">
                                                            ৳{" "}
                                                            {fmt(
                                                                item.share_amount,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    item.note ??
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    updateItemNote(
                                                                        i,
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Optional…"
                                                                className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t border-gray-200 bg-gray-50">
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className="px-4 py-3 text-sm font-semibold text-gray-700"
                                                    >
                                                        Total
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                        ৳{" "}
                                                        {fmt(
                                                            form.items.reduce(
                                                                (s, it) =>
                                                                    s +
                                                                    Number(
                                                                        it.invested_amount ??
                                                                            0,
                                                                    ),
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                        {form.items
                                                            .reduce(
                                                                (s, it) =>
                                                                    s +
                                                                    Number(
                                                                        it.share_percent,
                                                                    ),
                                                                0,
                                                            )
                                                            .toFixed(4)}
                                                        %
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-700">
                                                        ৳{" "}
                                                        {fmt(
                                                            form.items.reduce(
                                                                (s, it) =>
                                                                    s +
                                                                    Number(
                                                                        it.share_amount,
                                                                    ),
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td />
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Form actions ── */}
                    <div className="flex items-center justify-end gap-3">
                        <a
                            href={route(
                                "backend.profit-distributions.show",
                                distribution.id,
                            )}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </a>
                        <button
                            type="submit"
                            disabled={submitting || form.items.length === 0}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Save size={15} />
                            {submitting ? "Saving…" : "Update Distribution"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
