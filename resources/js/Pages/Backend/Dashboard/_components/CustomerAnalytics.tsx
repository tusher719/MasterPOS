import { CustomerAnalyticsData, TopCustomer } from '../Index';
import { Users, UserPlus, Repeat } from 'lucide-react';

interface Props {
    analytics: CustomerAnalyticsData;
    topCustomers: TopCustomer[];
}

function fmtCurrency(value: number): string {
    return '৳' + Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatBox({
    label,
    value,
    icon,
    accent,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    accent: string;
}) {
    return (
        <div className="rounded-md border border-gray-100 p-3">
            <div className="flex items-center gap-2">
                <div className={`rounded-md p-1.5 ${accent}`}>{icon}</div>
                <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className="mt-1.5 text-base font-semibold text-gray-800">{value}</p>
        </div>
    );
}

export default function CustomerAnalytics({ analytics, topCustomers }: Props) {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
                <StatBox
                    label="Total Customers"
                    value={analytics.total.toLocaleString()}
                    icon={<Users className="h-3.5 w-3.5 text-indigo-600" />}
                    accent="bg-indigo-50"
                />
                <StatBox
                    label="New Customers"
                    value={analytics.new.toLocaleString()}
                    icon={<UserPlus className="h-3.5 w-3.5 text-green-600" />}
                    accent="bg-green-50"
                />
                <StatBox
                    label="Returning"
                    value={analytics.returning.toLocaleString()}
                    icon={<Repeat className="h-3.5 w-3.5 text-amber-600" />}
                    accent="bg-amber-50"
                />
            </div>

            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Top 5 customers by spend
                </p>
                {topCustomers.length === 0 ? (
                    <p className="text-xs text-gray-400">No customer purchases in this period.</p>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">Customer</th>
                                    <th className="px-3 py-2 text-right font-medium">Orders</th>
                                    <th className="px-3 py-2 text-right font-medium">Spent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {topCustomers.map((c) => (
                                    <tr key={c.id}>
                                        <td className="px-3 py-2">
                                            <p className="font-medium text-gray-700">{c.name}</p>
                                            {c.phone && (
                                                <p className="text-[11px] text-gray-400">{c.phone}</p>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-600">
                                            {c.total_orders}
                                        </td>
                                        <td className="px-3 py-2 text-right font-medium text-gray-700">
                                            {fmtCurrency(c.total_spent)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
