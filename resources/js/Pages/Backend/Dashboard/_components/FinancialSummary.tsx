import { FinancialData, PeriodMeta } from "../Index";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ShoppingCart,
    Receipt,
    PiggyBank,
} from "lucide-react";

interface Props {
    financial: FinancialData;
    period: PeriodMeta;
}

function fmtCurrency(value: number): string {
    return (
        "৳" +
        Number(value).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

function ChangeBadge({ pct }: { pct: number }) {
    const positive = pct >= 0;
    return (
        <span
            className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border",
                positive
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60",
            ].join(" ")}
        >
            {positive ? (
                <TrendingUp className="h-3 w-3" />
            ) : (
                <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(pct).toFixed(1)}%
        </span>
    );
}

function KpiCard({
    label,
    value,
    changePct,
    icon,
    accent,
}: {
    label: string;
    value: string;
    changePct?: number;
    icon: React.ReactNode;
    accent: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                        {value}
                    </p>
                </div>
                <div className={`rounded-xl p-2.5 ${accent}`}>{icon}</div>
            </div>
            {changePct !== undefined && (
                <div className="mt-3 flex items-center gap-1.5">
                    <ChangeBadge pct={changePct} />
                    <span className="text-[11px] text-slate-400">
                        vs previous period
                    </span>
                </div>
            )}
        </div>
    );
}

export default function FinancialSummary({ financial }: Props) {
    return (
        <div className="space-y-4">
            {/* Primary KPIs with comparison */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Total Revenue"
                    value={fmtCurrency(financial.revenue)}
                    changePct={financial.revenue_change_pct}
                    icon={<Wallet className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />}
                    accent="bg-indigo-50 dark:bg-indigo-950/50"
                />
                <KpiCard
                    label="Total Expenses"
                    value={fmtCurrency(financial.expenses)}
                    changePct={financial.expenses_change_pct}
                    icon={<Receipt className="h-4.5 w-4.5 text-rose-500 dark:text-rose-400" />}
                    accent="bg-rose-50 dark:bg-rose-950/50"
                />
                <KpiCard
                    label="Net Profit"
                    value={fmtCurrency(financial.net_profit)}
                    changePct={financial.profit_change_pct}
                    icon={<PiggyBank className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />}
                    accent="bg-emerald-50 dark:bg-emerald-950/50"
                />
                <KpiCard
                    label="Total Sales Orders"
                    value={financial.sales_count.toLocaleString()}
                    icon={<ShoppingCart className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />}
                    accent="bg-amber-50 dark:bg-amber-950/50"
                />
            </div>

            {/* Today snapshot */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Today's Revenue"
                    value={fmtCurrency(financial.today_revenue)}
                    icon={<Wallet className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-400" />}
                    accent="bg-indigo-50 dark:bg-indigo-950/50"
                />
                <KpiCard
                    label="Today's Profit"
                    value={fmtCurrency(financial.today_profit)}
                    icon={<PiggyBank className="h-4.5 w-4.5 text-emerald-500 dark:text-emerald-400" />}
                    accent="bg-emerald-50 dark:bg-emerald-950/50"
                />
                <KpiCard
                    label="Avg. Order Value (AOV)"
                    value={fmtCurrency(financial.aov)}
                    icon={<ShoppingCart className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />}
                    accent="bg-slate-100 dark:bg-slate-800"
                />
                <KpiCard
                    label="Gross Profit Margin"
                    value={`${financial.profit_margin.toFixed(1)}%`}
                    icon={<TrendingUp className="h-4.5 w-4.5 text-amber-500 dark:text-amber-400" />}
                    accent="bg-amber-50 dark:bg-amber-950/50"
                />
            </div>

            {/* Dues & capital */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Sales Due"
                    value={fmtCurrency(financial.sales_due)}
                    icon={<Receipt className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />}
                    accent="bg-amber-50 dark:bg-amber-950/50"
                />
                <KpiCard
                    label="Purchase Due"
                    value={fmtCurrency(financial.purchase_due)}
                    icon={<Receipt className="h-4.5 w-4.5 text-rose-500 dark:text-rose-400" />}
                    accent="bg-rose-50 dark:bg-rose-950/50"
                />
                <KpiCard
                    label="Total Capital Investment"
                    value={fmtCurrency(financial.total_investment)}
                    icon={<PiggyBank className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />}
                    accent="bg-indigo-50 dark:bg-indigo-950/50"
                />
                <KpiCard
                    label="Distributed Profit"
                    value={fmtCurrency(financial.total_distributed)}
                    icon={<PiggyBank className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />}
                    accent="bg-emerald-50 dark:bg-emerald-950/50"
                />
            </div>
        </div>
    );
}
