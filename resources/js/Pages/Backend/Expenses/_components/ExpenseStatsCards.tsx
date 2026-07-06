interface Stats {
    today: number;
    this_month: number;
    this_year: number;
    all_time: number;
}

interface Props {
    stats: Stats;
}

function formatAmount(value: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export default function ExpenseStatsCards({ stats }: Props) {
    const cards = [
        {
            label:   "Today's Expenses",
            value:   stats.today,
            color:   'text-rose-600',
            bg:      'bg-rose-50',
            border:  'border-rose-100',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            label:  'This Month',
            value:  stats.this_month,
            color:  'text-amber-600',
            bg:     'bg-amber-50',
            border: 'border-amber-100',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            label:  'This Year',
            value:  stats.this_year,
            color:  'text-indigo-600',
            bg:     'bg-indigo-50',
            border: 'border-indigo-100',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
            ),
        },
        {
            label:  'All Time Total',
            value:  stats.all_time,
            color:  'text-gray-700',
            bg:     'bg-gray-50',
            border: 'border-gray-100',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(card => (
                <div
                    key={card.label}
                    className={`rounded-lg border ${card.border} bg-white p-4`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">
                            {card.label}
                        </p>
                        <div className={`rounded-lg ${card.bg} ${card.color} p-2`}>
                            {card.icon}
                        </div>
                    </div>
                    <p className={`mt-3 text-2xl font-bold ${card.color}`}>
                        ৳ {formatAmount(card.value)}
                    </p>
                </div>
            ))}
        </div>
    );
}
