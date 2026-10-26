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
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 shadow-2xs backdrop-blur-xs dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Action Required
            </p>
            <div className="flex flex-wrap gap-2">
                {active.map((item) => {
                    const content = (
                        <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-amber-900 shadow-2xs transition hover:bg-amber-100/60 dark:border-amber-800/40 dark:bg-neutral-900 dark:text-amber-200 dark:hover:bg-amber-950/40">
                            <span className="text-amber-600 dark:text-amber-400">{item.icon}</span>
                            {item.label}
                            <span className="rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs dark:bg-amber-500">
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
