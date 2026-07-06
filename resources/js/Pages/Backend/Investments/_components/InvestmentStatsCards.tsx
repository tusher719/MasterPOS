import {
    TrendingUp,
    CalendarDays,
    CalendarCheck,
    CircleDollarSign,
    ArrowDownLeft,
} from "lucide-react";

interface Stats {
    today: string | number;
    this_week: string | number;
    this_month: string | number;
    total_active: string | number;
    total_withdrawn: string | number;
}

interface Props {
    stats: Stats;
}

function formatCurrency(value: string | number): string {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function InvestmentStatsCards({ stats }: Props) {
    const cards = [
        {
            label: "Today's Investment",
            value: stats.today,
            icon: CalendarDays,
            color: "indigo",
            bg: "bg-indigo-50",
            iconBg: "bg-indigo-100",
            iconFg: "text-indigo-600",
            textFg: "text-indigo-700",
        },
        {
            label: "This Week",
            value: stats.this_week,
            icon: CalendarCheck,
            color: "violet",
            bg: "bg-violet-50",
            iconBg: "bg-violet-100",
            iconFg: "text-violet-600",
            textFg: "text-violet-700",
        },
        {
            label: "This Month",
            value: stats.this_month,
            icon: TrendingUp,
            color: "blue",
            bg: "bg-blue-50",
            iconBg: "bg-blue-100",
            iconFg: "text-blue-600",
            textFg: "text-blue-700",
        },
        {
            label: "Total Active",
            value: stats.total_active,
            icon: CircleDollarSign,
            color: "green",
            bg: "bg-green-50",
            iconBg: "bg-green-100",
            iconFg: "text-green-600",
            textFg: "text-green-700",
        },
        {
            label: "Total Withdrawn",
            value: stats.total_withdrawn,
            icon: ArrowDownLeft,
            color: "amber",
            bg: "bg-amber-50",
            iconBg: "bg-amber-100",
            iconFg: "text-amber-600",
            textFg: "text-amber-700",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.label}
                        className={`rounded-lg border border-gray-200 ${card.bg} p-4`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-500">
                                {card.label}
                            </p>
                            <div className={`rounded-md ${card.iconBg} p-1.5`}>
                                <Icon className={`h-4 w-4 ${card.iconFg}`} />
                            </div>
                        </div>
                        <p className={`mt-2 text-xl font-bold ${card.textFg}`}>
                            ৳ {formatCurrency(card.value)}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
