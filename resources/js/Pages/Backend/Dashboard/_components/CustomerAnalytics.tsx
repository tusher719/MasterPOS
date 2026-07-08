import { CustomerAnalyticsData, TopCustomer } from "../Index";
import { Users, UserPlus, Repeat } from "lucide-react";

interface Props {
    analytics: CustomerAnalyticsData;
    topCustomers: TopCustomer[];
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

function StatCard({
    label,
    value,
    icon,
    gradient,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    gradient: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-3.5 transition hover:shadow-sm">
            <div
                className={`absolute -right-3 -top-3 h-14 w-14 rounded-full opacity-[0.08] ${gradient}`}
            />
            <div className="relative flex items-center gap-2">
                <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${gradient}`}
                >
                    {icon}
                </div>
                <p className="text-[11px] font-medium text-gray-500">{label}</p>
            </div>
            <p className="relative mt-2 text-lg font-bold text-gray-800">
                {value}
            </p>
        </div>
    );
}

const AVATAR_COLORS = [
    "bg-indigo-100 text-indigo-700",
    "bg-amber-100 text-amber-700",
    "bg-green-100 text-green-700",
    "bg-rose-100 text-rose-700",
    "bg-blue-100 text-blue-700",
];

function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");
}

export default function CustomerAnalytics({ analytics, topCustomers }: Props) {
    const maxSpent = Math.max(...topCustomers.map((c) => c.total_spent), 1);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
                <StatCard
                    label="Total"
                    value={analytics.total.toLocaleString()}
                    icon={<Users className="h-3.5 w-3.5" />}
                    gradient="bg-indigo-500"
                />
                <StatCard
                    label="New"
                    value={analytics.new.toLocaleString()}
                    icon={<UserPlus className="h-3.5 w-3.5" />}
                    gradient="bg-green-500"
                />
                <StatCard
                    label="Returning"
                    value={analytics.returning.toLocaleString()}
                    icon={<Repeat className="h-3.5 w-3.5" />}
                    gradient="bg-amber-500"
                />
            </div>

            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Top 5 customers by spend
                </p>
                {topCustomers.length === 0 ? (
                    <p className="text-xs text-gray-400">
                        No customer purchases in this period.
                    </p>
                ) : (
                    <div className="space-y-1.5">
                        {topCustomers.map((c, i) => (
                            <div
                                key={c.id}
                                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 transition hover:border-indigo-100 hover:bg-indigo-50/30"
                            >
                                <div
                                    className={[
                                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                                        AVATAR_COLORS[i % AVATAR_COLORS.length],
                                    ].join(" ")}
                                >
                                    {initials(c.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-xs font-medium text-gray-800">
                                            {c.name}
                                        </p>
                                        <p className="flex-shrink-0 text-xs font-semibold text-gray-800">
                                            {fmtCurrency(c.total_spent)}
                                        </p>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className="h-full rounded-full bg-indigo-400"
                                                style={{
                                                    width: `${(c.total_spent / maxSpent) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="flex-shrink-0 text-[10px] text-gray-400">
                                            {c.total_orders} orders
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
