import { BarChart2, CheckCircle, Clock, DollarSign, Send } from "lucide-react";

interface Stats {
    total: number;
    draft: number;
    approved: number;
    distributed: number;
    total_distributed: string;
}

interface Props {
    stats: Stats;
}

function fmt(value: number | string): string {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function ProfitDistributionStatsCards({ stats }: Props) {
    const cards = [
        {
            label: "Total Distributions",
            value: stats.total,
            icon: BarChart2,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            display: String(stats.total),
        },
        {
            label: "Draft",
            value: stats.draft,
            icon: Clock,
            color: "text-gray-600",
            bg: "bg-gray-100",
            display: String(stats.draft),
        },
        {
            label: "Approved",
            value: stats.approved,
            icon: CheckCircle,
            color: "text-amber-600",
            bg: "bg-amber-50",
            display: String(stats.approved),
        },
        {
            label: "Distributed",
            value: stats.distributed,
            icon: Send,
            color: "text-green-600",
            bg: "bg-green-50",
            display: String(stats.distributed),
        },
        {
            label: "Total Distributed Amount",
            value: stats.total_distributed,
            icon: DollarSign,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            display: `৳ ${fmt(stats.total_distributed)}`,
            wide: true,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className={`rounded-lg border border-gray-200 bg-white p-4 ${card.wide ? "sm:col-span-3 lg:col-span-1" : ""}`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-500">
                            {card.label}
                        </p>
                        <span className={`rounded-md p-1.5 ${card.bg}`}>
                            <card.icon size={15} className={card.color} />
                        </span>
                    </div>
                    <p className={`mt-2 text-xl font-bold ${card.color}`}>
                        {card.display}
                    </p>
                </div>
            ))}
        </div>
    );
}
