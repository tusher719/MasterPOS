import { ChartData } from "../Index";
import { Receipt, PieChart as PieChartIcon } from "lucide-react";

interface Props {
    charts: ChartData;
}

const CATEGORY_COLORS = [
    "#6366f1",
    "#f59e0b",
    "#f43f5e",
    "#10b981",
    "#0ea5e9",
    "#8b5cf6",
    "#fb923c",
    "#14b8a6",
];

function fmtCurrency(value: number): string {
    if (Math.abs(value) >= 1_000_000)
        return "৳" + (value / 1_000_000).toFixed(1) + "M";
    if (Math.abs(value) >= 1_000) return "৳" + (value / 1_000).toFixed(1) + "K";
    return "৳" + Number(value).toFixed(2);
}

export default function ExpenseBreakdown({ charts }: Props) {
    const categoryData = charts.expense_by_category
        .map((c) => ({ ...c, total: Number(c.total) || 0 }))
        .sort((a, b) => b.total - a.total);

    const totalExpenses = categoryData.reduce((sum, c) => sum + c.total, 0);
    const topCategory = categoryData[0];

    if (categoryData.length === 0) {
        return (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-300">
                <PieChartIcon className="h-8 w-8" />
                <p className="text-sm text-gray-400">
                    No expenses in this period.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                <Receipt className="h-3.5 w-3.5" />
                Expenses by category
            </p>

            {/* Hero total + top category */}
            <div className="rounded-xl border border-rose-100/60 bg-gradient-to-br from-rose-50/50 via-white to-white p-4 shadow-2xs dark:border-rose-950/40 dark:from-rose-950/20 dark:via-neutral-900 dark:to-neutral-900">
                <p className="text-[11px] font-medium text-gray-500 dark:text-neutral-400">
                    Total expenses
                </p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {fmtCurrency(totalExpenses)}
                </p>
                {topCategory && (
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-neutral-500">
                        Highest:{" "}
                        <span className="font-semibold text-gray-700 dark:text-neutral-300">
                            {topCategory.category}
                        </span>{" "}
                        (
                        {totalExpenses > 0
                            ? (
                                  (topCategory.total / totalExpenses) *
                                  100
                              ).toFixed(0)
                            : 0}
                        %)
                    </p>
                )}
            </div>

            {/* Stacked segment bar */}
            <div className="space-y-1.5">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                    {categoryData.map((c, i) => {
                        const pct =
                            totalExpenses > 0
                                ? (c.total / totalExpenses) * 100
                                : 0;
                        if (pct <= 0) return null;
                        return (
                            <div
                                key={c.category}
                                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                style={{
                                    width: `${pct}%`,
                                    background:
                                        CATEGORY_COLORS[
                                            i % CATEGORY_COLORS.length
                                        ],
                                }}
                                title={`${c.category}: ${fmtCurrency(c.total)}`}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Legend list */}
            <div className="space-y-1.5">
                {categoryData.map((c, i) => {
                    const pct =
                        totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0;
                    return (
                        <div
                            key={c.category}
                            className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-gray-50/70 dark:hover:bg-neutral-800/40"
                        >
                            <span
                                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                style={{
                                    background:
                                        CATEGORY_COLORS[
                                            i % CATEGORY_COLORS.length
                                        ],
                                }}
                            />
                            <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700 dark:text-neutral-300">
                                {c.category}
                            </span>
                            <span className="flex-shrink-0 text-xs font-semibold text-gray-900 dark:text-neutral-100">
                                {fmtCurrency(c.total)}
                            </span>
                            <span className="w-9 flex-shrink-0 text-right text-[10px] text-gray-400 dark:text-neutral-500">
                                {pct.toFixed(1)}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
