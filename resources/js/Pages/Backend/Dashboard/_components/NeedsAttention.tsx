import { NeedsAttentionData } from "../Index";
import {
    AlertTriangle,
    PackageX,
    Receipt,
    ClipboardList,
    FileClock,
    Bell,
} from "lucide-react";
import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";

interface Props {
    data: NeedsAttentionData;
}

interface Item {
    key: keyof NeedsAttentionData;
    label: string;
    icon: React.ReactNode;
    href?: string;
}

const ITEMS: Item[] = [
    {
        key: "low_stock_count",
        label: "Low stock products",
        icon: <AlertTriangle className="h-4 w-4" />,
        href: "backend.products.index",
    },
    {
        key: "out_of_stock_count",
        label: "Out of stock products",
        icon: <PackageX className="h-4 w-4" />,
        href: "backend.products.index",
    },
    {
        key: "sales_due_count",
        label: "Sales with due payment",
        icon: <Receipt className="h-4 w-4" />,
        href: "backend.pos.sales.index",
    },
    {
        key: "purchase_due_count",
        label: "Purchases with due payment",
        icon: <ClipboardList className="h-4 w-4" />,
        href: "backend.purchases.index",
    },
    {
        key: "draft_distributions_count",
        label: "Draft profit distributions",
        icon: <FileClock className="h-4 w-4" />,
        href: "backend.profit-distributions.index",
    },
    {
        key: "unread_notifications_count",
        label: "Unread notifications",
        icon: <Bell className="h-4 w-4" />,
        href: "backend.notifications.index",
    },
];

export default function NeedsAttention({ data }: Props) {
    const active = ITEMS.filter((item) => data[item.key] > 0);

    if (active.length === 0) return null;

    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Needs your attention
            </p>
            <div className="flex flex-wrap gap-2">
                {active.map((item) => {
                    const content = (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100">
                            {item.icon}
                            {item.label}
                            <span className="rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {data[item.key]}
                            </span>
                        </span>
                    );

                    return item.href ? (
                        <Link key={item.key} href={route(item.href)}>
                            {content}
                        </Link>
                    ) : (
                        <span key={item.key}>{content}</span>
                    );
                })}
            </div>
        </div>
    );
}
