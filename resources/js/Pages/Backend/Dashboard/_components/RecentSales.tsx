import { RecentSaleItem } from "../Index";
import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";

interface Props {
    sales: RecentSaleItem[];
}

function fmtCurrency(value: number): string {
    return (
        "৳ " +
        Number(value || 0).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

function statusColor(status: string): string {
    const map: Record<string, string> = {
        paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800/60",
        partial: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800/60",
        due: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-800/60",
    };
    return map[status] ?? "bg-muted text-muted-foreground";
}

export default function RecentSales({ sales }: Props) {
    if (sales.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                No recent sales.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground">
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
                <tbody className="divide-y divide-border">
                    {sales.map((s) => (
                        <tr key={s.id} className="transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3">
                                <Link
                                    href={route("backend.pos.sales.show", s.id)}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {s.reference_no}
                                </Link>
                            </td>
                            <td className="px-4 py-3 text-foreground font-medium">
                                {s.customer_name}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                                {s.sale_date}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-foreground font-sans">
                                {fmtCurrency(s.grand_total)}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <span
                                    className={[
                                        "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
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
