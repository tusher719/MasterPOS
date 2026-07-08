import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart2,
    ShoppingCart,
    Percent,
    ArrowLeft,
} from "lucide-react";
import ReportFilters from "./_components/ReportFilters";
import ExportBar from "./_components/ExportBar";

interface CategoryTotal {
    category: string | null;
    total: string;
}

interface Summary {
    revenue: number;
    cogs: number;
    gross_profit: number;
    gross_margin: number;
    total_expenses: number;
    net_profit: number;
    net_margin: number;
    total_investments: number;
    sales_count: number;
    aov: number;
}

interface Props {
    summary: Summary;
    expenseByCategory: CategoryTotal[];
    filters: { from: string; to: string };
    can: { export: boolean };
}

function fmt(val: number): string {
    return Number(val).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function pctColor(val: number): string {
    if (val > 0) return "text-green-600";
    if (val < 0) return "text-red-500";
    return "text-gray-500";
}

export default function ProfitLossReport({
    summary,
    expenseByCategory,
    filters,
    can,
}: Props) {
    const isProfit = summary.net_profit >= 0;

    return (
        <AuthenticatedLayout>
            <Head title="Profit & Loss Statement" />

            <div className="space-y-4 print:space-y-3">
                {/* Back + heading */}
                <div className="flex items-center gap-3 print:hidden">
                    <Link
                        href={route("backend.reports.index")}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Reports
                    </Link>
                    <span className="text-gray-300">/</span>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Profit & Loss Statement
                    </h1>
                </div>

                {/* Print-only title */}
                <div className="hidden print:block">
                    <h1 className="text-xl font-bold text-gray-800">
                        Profit & Loss Statement
                    </h1>
                    <p className="text-sm text-gray-500">
                        Period: {filters.from} — {filters.to}
                    </p>
                </div>

                {/* Filters */}
                <div className="print:hidden">
                    <ReportFilters
                        filters={filters}
                        routeName="backend.reports.profit-loss"
                    />
                </div>

                {/* Export bar */}
                <div className="print:hidden">
                    <ExportBar
                        canExport={can.export}
                        reportType="profit-loss"
                        filters={filters}
                        rowCount={0}
                    />
                </div>

                {/* Top KPI row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <KpiCard
                        label="Total Revenue"
                        value={fmt(summary.revenue)}
                        icon={
                            <DollarSign className="h-4 w-4 text-indigo-600" />
                        }
                        accent="border-l-indigo-500"
                    />
                    <KpiCard
                        label="Cost of Goods"
                        value={fmt(summary.cogs)}
                        icon={
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                        }
                        accent="border-l-blue-500"
                    />
                    <KpiCard
                        label="Gross Profit"
                        value={fmt(summary.gross_profit)}
                        icon={<TrendingUp className="h-4 w-4 text-green-600" />}
                        accent="border-l-green-500"
                        highlight={summary.gross_profit >= 0 ? "green" : "red"}
                    />
                    <KpiCard
                        label="Total Expenses"
                        value={fmt(summary.total_expenses)}
                        icon={<TrendingDown className="h-4 w-4 text-red-500" />}
                        accent="border-l-red-500"
                    />
                    <KpiCard
                        label="Net Profit"
                        value={fmt(summary.net_profit)}
                        icon={<BarChart2 className="h-4 w-4 text-green-600" />}
                        accent={
                            isProfit ? "border-l-green-600" : "border-l-red-600"
                        }
                        highlight={isProfit ? "green" : "red"}
                    />
                    <KpiCard
                        label="Net Margin"
                        value={`${summary.net_margin}%`}
                        icon={<Percent className="h-4 w-4 text-gray-500" />}
                        accent={
                            isProfit ? "border-l-green-400" : "border-l-red-400"
                        }
                        plain
                    />
                </div>

                {/* Main content: P&L Statement + Expense breakdown */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* P&L Statement — 2 cols */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Revenue section */}
                        <StatementSection title="Revenue">
                            <StatementRow
                                label="Gross Sales Revenue"
                                value={fmt(summary.revenue)}
                                bold
                            />
                            <StatementRow
                                label="Total Sales Orders"
                                value={String(summary.sales_count)}
                                muted
                                plain
                            />
                            <StatementRow
                                label="Average Order Value"
                                value={fmt(summary.aov)}
                                muted
                            />
                        </StatementSection>

                        {/* COGS section */}
                        <StatementSection title="Cost of Goods Sold (COGS)">
                            <StatementRow
                                label="Product Cost (qty × cost price)"
                                value={fmt(summary.cogs)}
                                negative
                            />
                        </StatementSection>

                        {/* Gross profit */}
                        <div
                            className={`rounded-lg border-2 p-4
                            ${
                                summary.gross_profit >= 0
                                    ? "border-green-200 bg-green-50"
                                    : "border-red-200 bg-red-50"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-800">
                                    Gross Profit
                                </span>
                                <span
                                    className={`text-lg font-bold
                                    ${summary.gross_profit >= 0 ? "text-green-700" : "text-red-600"}`}
                                >
                                    {fmt(summary.gross_profit)}
                                </span>
                            </div>
                            <p
                                className={`mt-0.5 text-xs ${pctColor(summary.gross_margin)}`}
                            >
                                Gross Margin: {summary.gross_margin}%
                            </p>
                        </div>

                        {/* Operating expenses section */}
                        <StatementSection title="Operating Expenses">
                            {expenseByCategory.length === 0 ? (
                                <p className="py-2 text-xs text-gray-400">
                                    No expenses in this period.
                                </p>
                            ) : (
                                expenseByCategory.map((cat, idx) => (
                                    <StatementRow
                                        key={idx}
                                        label={cat.category ?? "Uncategorised"}
                                        value={fmt(Number(cat.total))}
                                        negative
                                    />
                                ))
                            )}
                            <div className="mt-1 border-t border-gray-200 pt-2">
                                <StatementRow
                                    label="Total Operating Expenses"
                                    value={fmt(summary.total_expenses)}
                                    bold
                                    negative
                                />
                            </div>
                        </StatementSection>

                        {/* Net profit */}
                        <div
                            className={`rounded-lg border-2 p-4
                            ${
                                isProfit
                                    ? "border-green-300 bg-green-50"
                                    : "border-red-300   bg-red-50"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-800 text-base">
                                    Net {isProfit ? "Profit" : "Loss"}
                                </span>
                                <span
                                    className={`text-xl font-bold
                                    ${isProfit ? "text-green-700" : "text-red-600"}`}
                                >
                                    {fmt(summary.net_profit)}
                                </span>
                            </div>
                            <p
                                className={`mt-0.5 text-xs ${pctColor(summary.net_margin)}`}
                            >
                                Net Margin: {summary.net_margin}%
                            </p>
                        </div>

                        {/* Investments note */}
                        {summary.total_investments > 0 && (
                            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                                <p className="text-xs text-blue-700">
                                    <span className="font-semibold">Note:</span>{" "}
                                    Total investments received in this period:{" "}
                                    <span className="font-bold">
                                        {fmt(summary.total_investments)}
                                    </span>
                                    . Investment capital is excluded from P&L
                                    calculations.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Expense breakdown sidebar — 1 col */}
                    <div className="lg:col-span-1">
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-4 py-3">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Expense Breakdown
                                </h3>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {expenseByCategory.length === 0 ? (
                                    <p className="px-4 py-6 text-center text-xs text-gray-400">
                                        No expenses in this period.
                                    </p>
                                ) : (
                                    expenseByCategory.map((cat, idx) => {
                                        const catTotal = Number(cat.total);
                                        const pct =
                                            summary.total_expenses > 0
                                                ? Math.round(
                                                      (catTotal /
                                                          summary.total_expenses) *
                                                          100,
                                                  )
                                                : 0;

                                        return (
                                            <div
                                                key={idx}
                                                className="px-4 py-3"
                                            >
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span
                                                        className="max-w-[130px] truncate text-xs
                                                                     font-medium text-gray-700"
                                                    >
                                                        {cat.category ??
                                                            "Uncategorised"}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {pct}%
                                                    </span>
                                                </div>
                                                <div className="mb-1 h-1.5 w-full rounded-full bg-gray-100">
                                                    <div
                                                        className="h-1.5 rounded-full bg-red-400 transition-all"
                                                        style={{
                                                            width: `${pct}%`,
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-right text-xs font-semibold text-red-600">
                                                    {fmt(catTotal)}
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {expenseByCategory.length > 0 && (
                                <div className="border-t-2 border-gray-200 bg-gray-50 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="text-xs font-semibold uppercase
                                                         tracking-wide text-gray-500"
                                        >
                                            Total
                                        </span>
                                        <span className="text-sm font-bold text-red-600">
                                            {fmt(summary.total_expenses)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick ratio cards */}
                        <div className="mt-4 space-y-3">
                            <div className="rounded-lg border border-gray-200 bg-white p-4">
                                <p className="text-xs text-gray-500">
                                    Expense Ratio
                                </p>
                                <p
                                    className={`text-lg font-bold ${
                                        summary.revenue > 0 &&
                                        summary.total_expenses /
                                            summary.revenue <
                                            0.5
                                            ? "text-green-600"
                                            : "text-amber-600"
                                    }`}
                                >
                                    {summary.revenue > 0
                                        ? `${Math.round((summary.total_expenses / summary.revenue) * 100)}%`
                                        : "—"}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-400">
                                    Expenses as % of revenue
                                </p>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-white p-4">
                                <p className="text-xs text-gray-500">
                                    COGS Ratio
                                </p>
                                <p className="text-lg font-bold text-blue-600">
                                    {summary.revenue > 0
                                        ? `${Math.round((summary.cogs / summary.revenue) * 100)}%`
                                        : "—"}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-400">
                                    COGS as % of revenue
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// ── Statement section wrapper ──────────────────────────────────────────────────

function StatementSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {title}
                </h3>
            </div>
            <div className="divide-y divide-gray-50 px-4 py-1">{children}</div>
        </div>
    );
}

// ── Statement row ──────────────────────────────────────────────────────────────

function StatementRow({
    label,
    value,
    bold = false,
    muted = false,
    negative = false,
    plain = false,
}: {
    label: string;
    value: string;
    bold?: boolean;
    muted?: boolean;
    negative?: boolean;
    plain?: boolean;
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <span
                className={`text-sm ${bold ? "font-semibold text-gray-800" : muted ? "text-gray-400" : "text-gray-600"}`}
            >
                {label}
            </span>
            <span
                className={`text-sm
                ${bold ? "font-bold" : "font-medium"}
                ${negative ? "text-red-600" : ""}
                ${muted ? "text-gray-400" : ""}
                ${!negative && !muted ? "text-gray-800" : ""}
            `}
            >
                {negative && value !== "0.00" ? `(${value})` : value}
            </span>
        </div>
    );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    accent: string;
    highlight?: "green" | "red";
    plain?: boolean;
}

function KpiCard({
    label,
    value,
    icon,
    accent,
    highlight,
    plain = false,
}: KpiProps) {
    return (
        <div
            className={`rounded-lg border border-gray-200 bg-white p-4 border-l-4 ${accent}`}
        >
            <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                    {label}
                </span>
                {icon}
            </div>
            <p
                className={`text-lg font-bold
                ${
                    highlight === "green"
                        ? "text-green-700"
                        : highlight === "red"
                          ? "text-red-600"
                          : "text-gray-800"
                }`}
            >
                {value}
            </p>
        </div>
    );
}
