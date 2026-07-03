interface Stats {
    total: number;
    active: number;
    low_stock: number;
    featured: number;
}

interface Props {
    stats: Stats;
}

export default function ProductStatsCards({ stats }: Props) {
    const cards = [
        {
            label: "Total Products",
            value: stats.total,
            color: "text-gray-800",
            bg: "bg-white",
        },
        {
            label: "Active",
            value: stats.active,
            color: "text-green-700",
            bg: "bg-white",
        },
        {
            label: "Low Stock",
            value: stats.low_stock,
            color: stats.low_stock > 0 ? "text-amber-500" : "text-gray-800",
            bg: "bg-white",
        },
        {
            label: "Featured",
            value: stats.featured,
            color: "text-indigo-600",
            bg: "bg-white",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className={`${card.bg} rounded-lg border border-gray-200 p-4`}
                >
                    <p className="text-xs text-gray-500">{card.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${card.color}`}>
                        {card.value}
                    </p>
                </div>
            ))}
        </div>
    );
}
