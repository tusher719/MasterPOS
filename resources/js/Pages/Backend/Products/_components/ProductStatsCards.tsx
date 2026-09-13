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
            color: "text-foreground",
            bg: "bg-card",
        },
        {
            label: "Active",
            value: stats.active,
            color: "text-foreground",
            bg: "bg-card",
        },
        {
            label: "Low Stock",
            value: stats.low_stock,
            color: stats.low_stock > 0 ? "text-amber-500" : "text-foreground",
            bg: "bg-card",
        },
        {
            label: "Featured",
            value: stats.featured,
            color: "text-indigo-600",
            bg: "bg-card",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className={`${card.bg} rounded-lg border border-border p-4`}
                >
                    <p className="text-xs text-muted-foreground">
                        {card.label}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${card.color}`}>
                        {card.value}
                    </p>
                </div>
            ))}
        </div>
    );
}
