import { FinancialData, PeriodMeta } from "../Index";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ShoppingCart,
    Receipt,
    PiggyBank,
} from "lucide-react";
import React from "react";

interface Props {
    financial: FinancialData;
    period: PeriodMeta;
}

export function CurrencyDisplay({
    value,
    className = "",
    size = "normal",
}: {
    value: number;
    className?: string;
    size?: "small" | "normal" | "large";
}) {
    const formatted = Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const sizeClasses = {
        small: "text-sm",
        normal: "text-lg sm:text-xl",
        large: "text-2xl",
    };

    return (
        <span className={`inline-flex items-baseline gap-1.5 font-semibold text-foreground ${sizeClasses[size]} ${className}`}>
            <span className="text-[0.78em] font-medium text-muted-foreground select-none">৳</span>
            <span className="font-bold tracking-tight font-sans">{formatted}</span>
        </span>
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
    value: React.ReactNode;
    changePct?: number;
    icon: React.ReactNode;
    accent: string;
}) {
    return (
        <div className="group rounded-2xl border border-border bg-card p-4.5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/30">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
                    <div className="mt-1.5 truncate">
                        {value}
                    </div>
                </div>
                <div className={`shrink-0 rounded-xl p-2.5 transition-transform duration-200 group-hover:scale-105 ${accent}`}>
                    {icon}
                </div>
            </div>
            {changePct !== undefined && (
                <div className="mt-3 flex items-center gap-1.5">
                    <ChangeBadge pct={changePct} />
                    <span className="text-[11px] text-muted-foreground">
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
                    value={<CurrencyDisplay value={financial.revenue} />}
                    changePct={financial.revenue_change_pct}
                    icon={<Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                    accent="bg-indigo-50 dark:bg-indigo-950/60"
                />
                <KpiCard
                    label="Total Expenses"
                    value={<CurrencyDisplay value={financial.expenses} />}
                    changePct={financial.expenses_change_pct}
                    icon={<Receipt className="h-5 w-5 text-rose-500 dark:text-rose-400" />}
                    accent="bg-rose-50 dark:bg-rose-950/60"
                />
                <KpiCard
                    label="Net Profit"
                    value={<CurrencyDisplay value={financial.net_profit} />}
                    changePct={financial.profit_change_pct}
                    icon={<PiggyBank className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                    accent="bg-emerald-50 dark:bg-emerald-950/60"
                />
                <KpiCard
                    label="Total Sales Orders"
                    value={
                        <span className="text-xl font-bold tracking-tight text-foreground font-sans">
                            {financial.sales_count.toLocaleString()}
                        </span>
                    }
                    icon={<ShoppingCart className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                    accent="bg-amber-50 dark:bg-amber-950/60"
                />
            </div>

            {/* Today snapshot */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Today's Revenue"
                    value={<CurrencyDisplay value={financial.today_revenue} />}
                    icon={<Wallet className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />}
                    accent="bg-indigo-50/70 dark:bg-indigo-950/50"
                />
                <KpiCard
                    label="Today's Profit"
                    value={<CurrencyDisplay value={financial.today_profit} />}
                    icon={<PiggyBank className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />}
                    accent="bg-emerald-50/70 dark:bg-emerald-950/50"
                />
                <KpiCard
                    label="Avg. Order Value (AOV)"
                    value={<CurrencyDisplay value={financial.aov} />}
                    icon={<ShoppingCart className="h-5 w-5 text-sky-500 dark:text-sky-400" />}
                    accent="bg-sky-50 dark:bg-sky-950/50"
                />
                <KpiCard
                    label="Gross Profit Margin"
                    value={
                        <span className="text-xl font-bold tracking-tight text-foreground font-sans">
                            {financial.profit_margin.toFixed(1)}%
                        </span>
                    }
                    icon={<TrendingUp className="h-5 w-5 text-amber-500 dark:text-amber-400" />}
                    accent="bg-amber-50 dark:bg-amber-950/50"
                />
            </div>

            {/* Dues & capital */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Sales Due"
                    value={<CurrencyDisplay value={financial.sales_due} />}
                    icon={<Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                    accent="bg-amber-50 dark:bg-amber-950/50"
                />
                <KpiCard
                    label="Purchase Due"
                    value={<CurrencyDisplay value={financial.purchase_due} />}
                    icon={<Receipt className="h-5 w-5 text-rose-500 dark:text-rose-400" />}
                    accent="bg-rose-50 dark:bg-rose-950/50"
                />
                <KpiCard
                    label="Total Capital Investment"
                    value={<CurrencyDisplay value={financial.total_investment} />}
                    icon={<PiggyBank className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                    accent="bg-indigo-50 dark:bg-indigo-950/50"
                />
                <KpiCard
                    label="Distributed Profit"
                    value={<CurrencyDisplay value={financial.total_distributed} />}
                    icon={<PiggyBank className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                    accent="bg-emerald-50 dark:bg-emerald-950/50"
                />
            </div>
        </div>
    );
}
