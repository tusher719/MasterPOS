// resources/js/Pages/Backend/Purchases/_components/PurchaseStatsCards.tsx

import React from "react";
import {
    ShoppingCart,
    DollarSign,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

interface Stats {
    total_purchases: number;
    total_amount: number;
    total_paid: number;
    total_due: number;
}

interface Props {
    stats: Stats;
}

function formatCurrency(value: number): string {
    return (
        "৳ " +
        Number(value).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

export default function PurchaseStatsCards({ stats }: Props) {
    const cards = [
        {
            label: "Total Purchases",
            value: stats.total_purchases.toString(),
            icon: ShoppingCart,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-600",
            isCurrency: false,
        },
        {
            label: "Total Amount",
            value: formatCurrency(stats.total_amount),
            icon: DollarSign,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            isCurrency: true,
        },
        {
            label: "Total Paid",
            value: formatCurrency(stats.total_paid),
            icon: CheckCircle,
            iconBg: "bg-green-50",
            iconColor: "text-green-600",
            isCurrency: true,
        },
        {
            label: "Total Due",
            value: formatCurrency(stats.total_due),
            icon: AlertCircle,
            iconBg: "bg-red-50",
            iconColor: "text-red-500",
            isCurrency: true,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.label}
                        className="rounded-lg border border-gray-200 bg-white p-4 flex items-center gap-4"
                    >
                        {/* Icon */}
                        <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}
                        >
                            <Icon className={`h-5 w-5 ${card.iconColor}`} />
                        </div>

                        {/* Text */}
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 truncate">
                                {card.label}
                            </p>
                            <p className="mt-0.5 text-lg font-bold text-gray-800 truncate">
                                {card.value}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
