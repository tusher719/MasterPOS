import { ProductAnalyticsData, TopProduct } from "../Index";
import { Zap, TrendingDown, Award } from "lucide-react";

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

function ProductTable({
    title,
    icon,
    rows,
    valueKey,
    valueLabel,
    isCurrency,
}: {
    title: string;
    icon: React.ReactNode;
    rows: {
        id: number;
        name: string;
        total_qty: number;
        total_revenue?: number;
        total_profit?: number;
    }[];
    valueKey: "total_revenue" | "total_profit";
    valueLabel: string;
    isCurrency: boolean;
}) {
    return (
        <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {icon}
                {title}
            </p>
            {rows.length === 0 ? (
                <p className="text-xs text-gray-400">
                    No data for this period.
                </p>
            ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium">
                                    Product
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    Qty
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    {valueLabel}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((r) => (
                                <tr key={r.id}>
                                    <td className="px-3 py-2 truncate text-gray-700">
                                        {r.name}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-600">
                                        {r.total_qty}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium text-gray-700">
                                        {isCurrency
                                            ? fmtCurrency(
                                                  Number(r[valueKey]) || 0,
                                              )
                                            : (
                                                  Number(r[valueKey]) || 0
                                              ).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function ProductAnalytics({ analytics, topProducts }: Props) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ProductTable
                title="Top 5 products"
                icon={<Award className="h-3.5 w-3.5" />}
                rows={topProducts}
                valueKey="total_revenue"
                valueLabel="Revenue"
                isCurrency
            />
            <ProductTable
                title="Fast moving"
                icon={<Zap className="h-3.5 w-3.5" />}
                rows={analytics.fast_moving}
                valueKey="total_revenue"
                valueLabel="Revenue"
                isCurrency
            />
            <ProductTable
                title="Slow moving"
                icon={<TrendingDown className="h-3.5 w-3.5" />}
                rows={analytics.slow_moving}
                valueKey="total_revenue"
                valueLabel="Revenue"
                isCurrency
            />
            <ProductTable
                title="Highest profit"
                icon={<Award className="h-3.5 w-3.5" />}
                rows={analytics.highest_profit}
                valueKey="total_profit"
                valueLabel="Profit"
                isCurrency
            />
        </div>
    );
}
