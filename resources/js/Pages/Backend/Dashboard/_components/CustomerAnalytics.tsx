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
        <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-3.5 shadow-2xs transition hover:shadow-xs dark:border-neutral-800 dark:bg-neutral-800/40">
            <div
                className={`absolute -right-3 -top-3 h-14 w-14 rounded-full opacity-[0.08] dark:opacity-[0.15] ${gradient}`}
            />
            <div className="relative flex items-center gap-2">
                <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-2xs ${gradient}`}
                >
                    {icon}
                </div>
                <p className="text-[11px] font-medium text-gray-500 dark:text-neutral-400">{label}</p>
            </div>
            <p className="relative mt-2 text-lg font-bold tracking-tight text-gray-800 dark:text-neutral-100">
                {value}
            </p>
        </div>
    );
}

const AVATAR_COLORS = [
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400",
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
    "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
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
                    gradient="bg-emerald-500"
                />
                <StatCard
                    label="Returning"
                    value={analytics.returning.toLocaleString()}
                    icon={<Repeat className="h-3.5 w-3.5" />}
                    gradient="bg-amber-500"
                />
            </div>

            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                    Top 5 customers by spend
                </p>
                {topCustomers.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-neutral-500">
                        No customer purchases in this period.
                    </p>
                ) : (
                    <div className="space-y-1.5">
                        {topCustomers.map((c, i) => (
                            <div
                                key={c.id}
                                className="flex items-center gap-3 rounded-xl border border-gray-100/80 px-3 py-2.5 transition hover:border-indigo-100 hover:bg-indigo-50/20 dark:border-neutral-800/80 dark:hover:border-indigo-900/40 dark:hover:bg-indigo-950/20"
                            >
                                <div
                                    className={[
                                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ring-1 ring-black/5 dark:ring-white/10",
                                        AVATAR_COLORS[i % AVATAR_COLORS.length],
                                    ].join(" ")}
                                >
                                    {initials(c.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-xs font-medium text-gray-800 dark:text-neutral-200">
                                            {c.name}
                                        </p>
                                        <p className="flex-shrink-0 text-xs font-semibold text-gray-900 dark:text-neutral-100">
                                            {fmtCurrency(c.total_spent)}
                                        </p>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                                            <div
                                                className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400"
                                                style={{
                                                    width: `${(c.total_spent / maxSpent) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="flex-shrink-0 text-[10px] text-gray-400 dark:text-neutral-500">
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
