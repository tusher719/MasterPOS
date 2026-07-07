import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { toast } from "sonner";
import { Calculator, Save, ArrowLeft, RefreshCw } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";

interface PreviewItem {
    investment_id: number;
    investor_name: string;
    investment_title: string;
    investment_type: string;
    invested_amount: number;
    share_percent: number;
    share_amount: number;
    note: string | null;
    [key: string]: string | number | null;
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
    items: PreviewItem[];
}

interface FormData {
    title: string;
    distribution_date: string;
    period_start: string;
    period_end: string;
    distribution_percent: string;
    distributable_amount: string;
    note: string;
    // Financial snapshots filled after calculate
    total_revenue: string;
    total_cogs: string;
    total_expenses: string;
    total_investment: string;
    gross_profit: string;
    net_profit: string;
    items: PreviewItem[];
}

interface Errors {
    [key: string]: string;
}

function fmt(value: number | string): string {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function Create() {
    const [form, setForm] = useState<FormData>({
        title: "",
        distribution_date: "",
        period_start: "",
        period_end: "",
        distribution_percent: "100",
        distributable_amount: "",
        note: "",
        total_revenue: "",
        total_cogs: "",
        total_expenses: "",
        total_investment: "",
        gross_profit: "",
        net_profit: "",
        items: [],
    });

    const [errors, setErrors] = useState<Errors>({});
    const [calculating, setCalculating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [preview, setPreview] = useState<PreviewData | null>(null);

    // -----------------------------------------------------------------------
    // Field update
    // -----------------------------------------------------------------------

    function update(field: keyof FormData, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // -----------------------------------------------------------------------
    // Calculate preview
    // -----------------------------------------------------------------------

    async function handleCalculate() {
        if (!form.period_start || !form.period_end) {
            toast.error("Please select period start and end dates first.");
            return;
        }

        setCalculating(true);
        try {
            const response = await axios.get(
                route("backend.profit-distributions.calculate-preview"),
                {
                    params: {
                        period_start: form.period_start,
                        period_end: form.period_end,
                        distribution_percent:
                            form.distribution_percent || "100",
                    },
                },
            );

            const data: PreviewData = response.data;
            setPreview(data);

            // Fill financial snapshots into form
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

            if (data.items.length === 0) {
                toast.warning("No active investments found for this period.");
            } else {
                toast.success(
                    `Preview calculated — ${data.items.length} investor(s) found.`,
                );
            }
        } catch (err: any) {
            const msg =
                err.response?.data?.message ??
                "Calculation failed. Please try again.";
            toast.error(msg);
        } finally {
            setCalculating(false);
        }
    }

    // -----------------------------------------------------------------------
    // Update item note inline
    // -----------------------------------------------------------------------

    function updateItemNote(index: number, note: string) {
        setForm((prev) => {
            const items = [...prev.items];
            items[index] = { ...items[index], note };
            return { ...prev, items };
        });
    }

    // -----------------------------------------------------------------------
    // Submit
    // -----------------------------------------------------------------------

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (form.items.length === 0) {
            toast.error(
                "Please calculate the preview first to generate investor shares.",
            );
            return;
        }

        setSubmitting(true);
        setErrors({});

        router.post(
            route("backend.profit-distributions.store"),
            {
                title: form.title,
                distribution_date: form.distribution_date,
                period_start: form.period_start,
                period_end: form.period_end,
                distribution_percent: form.distribution_percent,
                distributable_amount: form.distributable_amount,
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

    const hasPreview = preview !== null && form.items.length > 0;

    return (
        <AuthenticatedLayout>
            <Head title="New Profit Distribution" />

            <div className="space-y-6">
                {/* Page header */}
                <div className="flex items-center gap-4">
                    <a
                        href={route("backend.profit-distributions.index")}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        <ArrowLeft size={14} />
                        Back
                    </a>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            New Profit Distribution
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Select a period, calculate financials, then save as
                            draft.
                        </p>
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
                                    placeholder="e.g. Q1 2026 Profit Distribution"
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
                                <p className="mt-1 text-xs text-gray-500">
                                    Percentage of net profit to distribute.
                                </p>
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
                                    placeholder="Optional internal note…"
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

                    {/* ── Section 2: Period & Calculate ── */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="mb-4 text-base font-semibold text-gray-700">
                            Period & Calculation
                        </h2>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {/* Period start */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Period Start{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.period_start}
                                    onChange={(e) => {
                                        update("period_start", e.target.value);
                                        setPreview(null);
                                    }}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {errors.period_start && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.period_start}
                                    </p>
                                )}
                            </div>

                            {/* Period end */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Period End{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.period_end}
                                    onChange={(e) => {
                                        update("period_end", e.target.value);
                                        setPreview(null);
                                    }}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {errors.period_end && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.period_end}
                                    </p>
                                )}
                            </div>

                            {/* Calculate button */}
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={handleCalculate}
                                    disabled={
                                        calculating ||
                                        !form.period_start ||
                                        !form.period_end
                                    }
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {calculating ? (
                                        <RefreshCw
                                            size={15}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Calculator size={15} />
                                    )}
                                    {calculating ? "Calculating…" : "Calculate"}
                                </button>
                            </div>
                        </div>

                        {/* Financial summary — shown after calculate */}
                        {hasPreview && (
                            <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                                    Financial Summary
                                </h3>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {[
                                        {
                                            label: "Total Revenue",
                                            value: preview.total_revenue,
                                            color: "text-green-700",
                                        },
                                        {
                                            label: "Total COGS",
                                            value: preview.total_cogs,
                                            color: "text-orange-600",
                                        },
                                        {
                                            label: "Total Expenses",
                                            value: preview.total_expenses,
                                            color: "text-red-600",
                                        },
                                        {
                                            label: "Gross Profit",
                                            value: preview.gross_profit,
                                            color:
                                                preview.gross_profit >= 0
                                                    ? "text-indigo-700"
                                                    : "text-red-600",
                                        },
                                        {
                                            label: "Net Profit",
                                            value: preview.net_profit,
                                            color:
                                                preview.net_profit >= 0
                                                    ? "text-indigo-700"
                                                    : "text-red-600",
                                        },
                                        {
                                            label: "Total Investment",
                                            value: preview.total_investment,
                                            color: "text-gray-700",
                                        },
                                        {
                                            label: "Dist. %",
                                            value: preview.distribution_percent,
                                            color: "text-gray-700",
                                            suffix: "%",
                                        },
                                        {
                                            label: "Distributable",
                                            value: preview.distributable_amount,
                                            color: "text-indigo-700",
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
                                                {item.suffix
                                                    ? `${Number(item.value).toFixed(2)}${item.suffix}`
                                                    : `৳ ${fmt(item.value)}`}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Distributable amount override */}
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
                                    <p className="mt-1 text-xs text-gray-500">
                                        Auto-filled from calculation. Adjust
                                        manually if needed.
                                    </p>
                                    {errors.distributable_amount && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.distributable_amount}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Section 3: Investor Shares ── */}
                    {hasPreview && (
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <h2 className="text-base font-semibold text-gray-700">
                                    Investor Share Breakdown
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        ({form.items.length} investor
                                        {form.items.length !== 1 ? "s" : ""})
                                    </span>
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
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
                                                key={item.investment_id}
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
                                                        {item.investment_title}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {item.investment_type}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-700">
                                                    ৳{" "}
                                                    {fmt(item.invested_amount)}
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
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={item.note ?? ""}
                                                        onChange={(e) =>
                                                            updateItemNote(
                                                                i,
                                                                e.target.value,
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
                                                        (s, i) =>
                                                            s +
                                                            Number(
                                                                i.invested_amount,
                                                            ),
                                                        0,
                                                    ),
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                {form.items
                                                    .reduce(
                                                        (s, i) =>
                                                            s +
                                                            Number(
                                                                i.share_percent,
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
                                                        (s, i) =>
                                                            s +
                                                            Number(
                                                                i.share_amount,
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
                        </div>
                    )}

                    {/* ── Form actions ── */}
                    <div className="flex items-center justify-end gap-3">
                        <a
                            href={route("backend.profit-distributions.index")}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </a>
                        <button
                            type="submit"
                            disabled={submitting || !hasPreview}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Save size={15} />
                            {submitting ? "Saving…" : "Save as Draft"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
