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
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                positive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700",
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
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="mt-1 text-lg font-semibold text-gray-800">
                        {value}
                    </p>
                </div>
                <div className={`rounded-md p-2 ${accent}`}>{icon}</div>
            </div>
            {changePct !== undefined && (
                <div className="mt-2">
                    <ChangeBadge pct={changePct} />
                    <span className="ml-1.5 text-[11px] text-gray-400">
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
                    icon={<Wallet className="h-4 w-4 text-indigo-600" />}
                    accent="bg-indigo-50"
                />
                <KpiCard
                    label="Total Expenses"
                    value={fmtCurrency(financial.expenses)}
                    changePct={financial.expenses_change_pct}
                    icon={<Receipt className="h-4 w-4 text-red-500" />}
                    accent="bg-red-50"
                />
                <KpiCard
                    label="Net Profit"
                    value={fmtCurrency(financial.net_profit)}
                    changePct={financial.profit_change_pct}
                    icon={<PiggyBank className="h-4 w-4 text-green-600" />}
                    accent="bg-green-50"
                />
                <KpiCard
                    label="Total Sales"
                    value={financial.sales_count.toLocaleString()}
                    icon={<ShoppingCart className="h-4 w-4 text-amber-600" />}
                    accent="bg-amber-50"
                />
            </div>

            {/* Today snapshot */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Today's Revenue"
                    value={fmtCurrency(financial.today_revenue)}
                    icon={<Wallet className="h-4 w-4 text-indigo-500" />}
                    accent="bg-indigo-50"
                />
                <KpiCard
                    label="Today's Profit"
                    value={fmtCurrency(financial.today_profit)}
                    icon={<PiggyBank className="h-4 w-4 text-green-500" />}
                    accent="bg-green-50"
                />
                <KpiCard
                    label="Avg. Order Value"
                    value={fmtCurrency(financial.aov)}
                    icon={<ShoppingCart className="h-4 w-4 text-gray-500" />}
                    accent="bg-gray-100"
                />
                <KpiCard
                    label="Profit Margin"
                    value={`${financial.profit_margin.toFixed(1)}%`}
                    icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
                    accent="bg-amber-50"
                />
            </div>

            {/* Dues & capital */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Sales Due"
                    value={fmtCurrency(financial.sales_due)}
                    icon={<Receipt className="h-4 w-4 text-amber-600" />}
                    accent="bg-amber-50"
                />
                <KpiCard
                    label="Purchase Due"
                    value={fmtCurrency(financial.purchase_due)}
                    icon={<Receipt className="h-4 w-4 text-red-500" />}
                    accent="bg-red-50"
                />
                <KpiCard
                    label="Total Investment"
                    value={fmtCurrency(financial.total_investment)}
                    icon={<PiggyBank className="h-4 w-4 text-indigo-600" />}
                    accent="bg-indigo-50"
                />
                <KpiCard
                    label="Total Distributed"
                    value={fmtCurrency(financial.total_distributed)}
                    icon={<PiggyBank className="h-4 w-4 text-green-600" />}
                    accent="bg-green-50"
                />
            </div>
        </div>
    );
}
