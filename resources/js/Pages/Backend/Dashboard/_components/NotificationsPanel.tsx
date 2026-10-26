import { NotificationItem } from "../Index";
import { Bell, BellRing } from "lucide-react";

interface Props {
    notifications: NotificationItem[];
}

function timeAgo(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function parseData(raw: string): { title?: string; message?: string } {
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

export default function NotificationsPanel({ notifications }: Props) {
    if (notifications.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center text-xs text-gray-400 dark:text-neutral-500">
                No notifications yet.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {notifications.map((n) => {
                const parsed = parseData(n.data);
                const unread = !n.read_at;

                return (
                    <div
                        key={n.id}
                        className={[
                            "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                            unread
                                ? "border border-indigo-100 bg-indigo-50/60 dark:border-indigo-900/40 dark:bg-indigo-950/20"
                                : "border border-gray-100/80 bg-gray-50/50 dark:border-neutral-800/80 dark:bg-neutral-800/30",
                        ].join(" ")}
                    >
                        <div className="mt-0.5 flex-shrink-0">
                            {unread ? (
                                <BellRing className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                                <Bell className="h-4 w-4 text-gray-400 dark:text-neutral-500" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p
                                className={[
                                    "truncate text-xs",
                                    unread
                                        ? "font-semibold text-gray-900 dark:text-neutral-100"
                                        : "font-medium text-gray-600 dark:text-neutral-400",
                                ].join(" ")}
                            >
                                {parsed.title ?? "Notification"}
                            </p>
                            {parsed.message && (
                                <p className="truncate text-[11px] text-gray-500 dark:text-neutral-400">
                                    {parsed.message}
                                </p>
                            )}
                        </div>
                        <span className="flex-shrink-0 text-[11px] text-gray-400 dark:text-neutral-500">
                            {timeAgo(n.created_at)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
