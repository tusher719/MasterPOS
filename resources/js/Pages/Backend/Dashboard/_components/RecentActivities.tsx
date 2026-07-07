import { ActivityItem } from "../Index";
import { Activity } from "lucide-react";

interface Props {
    activities: ActivityItem[];
}

function timeAgo(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function actionColor(action: string): string {
    const map: Record<string, string> = {
        created: "bg-green-100 text-green-700",
        updated: "bg-amber-100 text-amber-700",
        deleted: "bg-red-100 text-red-700",
        restored: "bg-indigo-100 text-indigo-700",
    };
    return map[action.toLowerCase()] ?? "bg-gray-100 text-gray-600";
}

export default function RecentActivities({ activities }: Props) {
    if (activities.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center text-xs text-gray-400">
                No recent activity.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <Activity className="h-3.5 w-3.5 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-700">
                                {a.user?.name ?? "System"}
                            </span>
                            <span
                                className={[
                                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize",
                                    actionColor(a.action),
                                ].join(" ")}
                            >
                                {a.action}
                            </span>
                            <span className="text-[10px] text-gray-400 capitalize">
                                {a.module}
                            </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                            {a.description}
                        </p>
                    </div>
                    <span className="flex-shrink-0 text-[11px] text-gray-400">
                        {timeAgo(a.created_at)}
                    </span>
                </div>
            ))}
        </div>
    );
}
