import React from "react";
import { ShoppingBag, TrendingUp, AlertCircle, Calendar } from "lucide-react";

interface Stats {
    total: number;
    today: number;
    total_revenue: number;
    due_amount: number;
}

interface Props {
    stats: Stats;
}

export default function SaleStatsCards({ stats }: Props) {
    const cards = [
        {
            label: "Total Sales",
            value: stats.total.toString(),
            icon: ShoppingBag,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
        },
        {
            label: "Today's Sales",
            value: stats.today.toString(),
            icon: Calendar,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            label: "Total Revenue",
            value: `৳${stats.total_revenue.toFixed(2)}`,
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Total Due",
            value: `৳${stats.due_amount.toFixed(2)}`,
            icon: AlertCircle,
            color: stats.due_amount > 0 ? "text-red-500" : "text-gray-400",
            bg: stats.due_amount > 0 ? "bg-red-50" : "bg-gray-50",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500">
                                {card.label}
                            </p>
                            <p className="mt-1 text-xl font-bold text-gray-800">
                                {card.value}
                            </p>
                        </div>
                        <div className={`rounded-lg p-2 ${card.bg}`}>
                            <card.icon size={20} className={card.color} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
