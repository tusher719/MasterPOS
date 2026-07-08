import { ProductAnalyticsData, TopProduct } from "../Index";
import { Zap, TrendingDown, Award, Crown } from "lucide-react";

interface Props {
    analytics: ProductAnalyticsData;
    topProducts: TopProduct[];
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

const RANK_COLORS = [
    "bg-amber-400",
    "bg-gray-300",
    "bg-amber-700",
    "bg-gray-200",
    "bg-gray-200",
];

function ProductCard({
    title,
    icon,
    accent,
    rows,
    valueKey,
    valueLabel,
}: {
    title: string;
    icon: React.ReactNode;
    accent: string;
    rows: {
        id: number;
        name: string;
        total_qty: number;
        total_revenue?: number;
        total_profit?: number;
    }[];
    valueKey: "total_revenue" | "total_profit";
    valueLabel: string;
}) {
    const maxVal = Math.max(...rows.map((r) => Number(r[valueKey]) || 0), 1);

    return (
        <div className="rounded-xl border border-gray-100 p-4">
            <p
                className={`mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${accent}`}
            >
                {icon}
                {title}
            </p>
            {rows.length === 0 ? (
                <p className="text-xs text-gray-400">
                    No data for this period.
                </p>
            ) : (
                <div className="space-y-2">
                    {rows.map((r, i) => {
                        const val = Number(r[valueKey]) || 0;
                        return (
                            <div
                                key={r.id}
                                className="flex items-center gap-2.5"
                            >
                                <span
                                    className={[
                                        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                                        i < 3
                                            ? RANK_COLORS[i]
                                            : "bg-gray-200 text-gray-500",
                                    ].join(" ")}
                                >
                                    {i + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-xs font-medium text-gray-700">
                                            {r.name}
                                        </p>
                                        <p className="flex-shrink-0 text-xs font-semibold text-gray-800">
                                            {fmtCurrency(val)}
                                        </p>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className="h-full rounded-full bg-indigo-400"
                                                style={{
                                                    width: `${(val / maxVal) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="flex-shrink-0 text-[10px] text-gray-400">
                                            {r.total_qty} sold
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function ProductAnalytics({ analytics, topProducts }: Props) {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ProductCard
                title="Top 5 products"
                icon={<Crown className="h-3.5 w-3.5" />}
                accent="text-amber-600"
                rows={topProducts}
                valueKey="total_revenue"
                valueLabel="Revenue"
            />
            <ProductCard
                title="Fast moving"
                icon={<Zap className="h-3.5 w-3.5" />}
                accent="text-green-600"
                rows={analytics.fast_moving}
                valueKey="total_revenue"
                valueLabel="Revenue"
            />
            <ProductCard
                title="Slow moving"
                icon={<TrendingDown className="h-3.5 w-3.5" />}
                accent="text-red-500"
                rows={analytics.slow_moving}
                valueKey="total_revenue"
                valueLabel="Revenue"
            />
            <ProductCard
                title="Highest profit"
                icon={<Award className="h-3.5 w-3.5" />}
                accent="text-indigo-600"
                rows={analytics.highest_profit}
                valueKey="total_profit"
                valueLabel="Profit"
            />
        </div>
    );
}
