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
        paid: "bg-green-100 text-green-700",
        partial: "bg-amber-100 text-amber-700",
        due: "bg-red-100 text-red-700",
    };
    return map[status] ?? "bg-gray-100 text-gray-600";
}

export default function RecentSales({ sales }: Props) {
    if (sales.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center text-xs text-gray-400">
                No recent sales.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                    <tr>
                        <th className="px-4 py-2.5 text-left font-medium">
                            Reference
                        </th>
                        <th className="px-4 py-2.5 text-left font-medium">
                            Customer
                        </th>
                        <th className="px-4 py-2.5 text-left font-medium">
                            Date
                        </th>
                        <th className="px-4 py-2.5 text-right font-medium">
                            Amount
                        </th>
                        <th className="px-4 py-2.5 text-center font-medium">
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {sales.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5">
                                <Link
                                    href={route("backend.pos.sales.show", s.id)}
                                    className="font-medium text-indigo-600 hover:underline"
                                >
                                    {s.reference_no}
                                </Link>
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">
                                {s.customer_name}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">
                                {s.sale_date}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-700">
                                {fmtCurrency(s.grand_total)}
                            </td>
                            <td className="px-4 py-2.5 text-center">
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
