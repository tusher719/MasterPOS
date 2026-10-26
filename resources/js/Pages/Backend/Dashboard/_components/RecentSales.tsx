import { RecentSaleItem } from "../Index";
import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";

interface Props {
    sales: RecentSaleItem[];
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

function statusColor(status: string): string {
    const map: Record<string, string> = {
        paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-500/20",
        partial: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-500/20",
        due: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-500/20",
    };
    return map[status] ?? "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400";
}

export default function RecentSales({ sales }: Props) {
    if (sales.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center text-xs text-gray-400 dark:text-neutral-500">
                No recent sales.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200/80 dark:border-neutral-800">
            <table className="w-full text-xs">
                <thead className="border-b border-gray-100 bg-gray-50/70 text-gray-500 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-400">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold">
                            Reference
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                            Customer
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                            Date
                        </th>
                        <th className="px-4 py-3 text-right font-semibold">
                            Amount
                        </th>
                        <th className="px-4 py-3 text-center font-semibold">
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                    {sales.map((s) => (
                        <tr key={s.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-800/40">
                            <td className="px-4 py-3">
                                <Link
                                    href={route("backend.pos.sales.show", s.id)}
                                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                >
                                    {s.reference_no}
                                </Link>
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-neutral-300">
                                {s.customer_name}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-neutral-400">
                                {s.sale_date}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                {fmtCurrency(s.grand_total)}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <span
                                    className={[
                                        "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                                        statusColor(s.payment_status),
                                    ].join(" ")}
                                >
                                    {s.payment_status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
