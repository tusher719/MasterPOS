import DataTable from "@/Components/shared/DataTable";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { LoginHistoryItem } from "@/types/log";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
}

// Extended to include last_seen_at from the joined user
interface LoginHistoryItemWithPresence extends LoginHistoryItem {
    user: {
        id: number;
        name: string;
        email: string;
        last_seen_at: string | null;
    } | null;
}

// ─── Presence helpers ─────────────────────────────────────────────────────────

type PresenceStatus = "online" | "away" | "offline";

function getPresence(lastSeenAt: string | null): PresenceStatus {
    if (!lastSeenAt) return "offline";
    const diffMinutes = (Date.now() - new Date(lastSeenAt).getTime()) / 60000;
    if (diffMinutes <= 5) return "online";
    if (diffMinutes <= 30) return "away";
    return "offline";
}

function formatLastSeen(lastSeenAt: string | null): string {
    if (!lastSeenAt) return "Never";
    const diffMinutes = Math.floor(
        (Date.now() - new Date(lastSeenAt).getTime()) / 60000,
    );
    if (diffMinutes < 1) return "Active now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

// Ring colors: green=online, amber=away, gray=offline (same as Users/Index)
function getRingClass(status: PresenceStatus): string {
    if (status === "online") return "ring-2 ring-offset-1 ring-green-400";
    if (status === "away") return "ring-2 ring-offset-1 ring-amber-400";
    return "ring-2 ring-offset-1 ring-gray-300";
}

const STATUS_LABEL: Record<PresenceStatus, string> = {
    online: "Online",
    away: "Away",
    offline: "Offline",
};

const STATUS_LABEL_COLORS: Record<PresenceStatus, string> = {
    online: "text-green-600",
    away: "text-amber-500",
    offline: "text-muted-foreground",
};

const RING_COLORS: Record<PresenceStatus, string> = {
    online: "ring-green-400",
    away: "ring-amber-400",
    offline: "ring-gray-300",
};

// ─── PresenceAvatar ───────────────────────────────────────────────────────────

function PresenceAvatar({
    name,
    lastSeenAt,
}: {
    name: string;
    lastSeenAt: string | null;
}) {
    const status = getPresence(lastSeenAt);

    function getRingClass(status: PresenceStatus) {
        return `ring-2 ring-offset-1 ${RING_COLORS[status]}`;
    }

    return (
        <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 ${getRingClass(status)}`}
        >
            {name.charAt(0)}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Index({
    histories: initialHistories,
}: {
    histories: Paginated<LoginHistoryItemWithPresence>;
}) {
    // Local state so polling can update last_seen_at without full page reload
    const [histories, setHistories] =
        useState<Paginated<LoginHistoryItemWithPresence>>(initialHistories);

    // Poll every 30 seconds to refresh last_seen_at values
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await axios.get(
                    route("backend.login-histories.index"),
                    {
                        headers: {
                            // Tell Laravel/Inertia we want JSON, not a full page
                            "X-Requested-With": "XMLHttpRequest",
                            Accept: "application/json",
                        },
                    },
                );
                // res.data is the raw Inertia component props when Accept: application/json
                if (res.data?.props?.histories) {
                    setHistories(res.data.props.histories);
                }
            } catch {
                // Silent fail — stale data is acceptable for presence indicator
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <AuthenticatedLayout>
            <Head title="Login History" />

            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Login History
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Record of who logged in, when, and from where
                        </p>
                    </div>

                    {/* Live indicator — shows polling is active */}
                    <div className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                        </span>
                        Live
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-medium">Presence:</span>
                    {[
                        {
                            status: "online",
                            ringClass:
                                "ring-2 ring-offset-1 ring-offset-background ring-green-400",
                            label: "≤ 5 min",
                        },
                        {
                            status: "away",
                            ringClass:
                                "ring-2 ring-offset-1 ring-offset-background ring-amber-400",
                            label: "5–30 min",
                        },
                        {
                            status: "offline",
                            ringClass:
                                "ring-2 ring-offset-1 ring-offset-background ring-gray-300",
                            label: "> 30 min",
                        },
                    ].map(({ status, ringClass, label }) => (
                        <div key={status} className="flex items-center gap-1.5">
                            <div
                                className={`h-4 w-4 rounded-full bg-indigo-100 ${ringClass}`}
                            />
                            <span className="capitalize">{status}</span>
                            <span className="text-muted-foreground">
                                ({label})
                            </span>
                        </div>
                    ))}
                </div>

                <DataTable<LoginHistoryItemWithPresence>
                    columns={[
                        {
                            header: "User",
                            accessor: (h) => (
                                <div className="flex items-center gap-3">
                                    <PresenceAvatar
                                        name={h.user?.name ?? "?"}
                                        lastSeenAt={
                                            h.user?.last_seen_at ?? null
                                        }
                                    />
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {h.user?.name ?? "Deleted User"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {h.user?.email ?? "-"}
                                        </p>
                                        {/* Last seen label below email */}
                                        {h.user && (
                                            <p
                                                className={`text-[11px] font-medium ${STATUS_LABEL_COLORS[getPresence(h.user.last_seen_at)]}`}
                                            >
                                                {
                                                    STATUS_LABEL[
                                                        getPresence(
                                                            h.user.last_seen_at,
                                                        )
                                                    ]
                                                }{" "}
                                                ·{" "}
                                                {formatLastSeen(
                                                    h.user.last_seen_at,
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            header: "IP Address",
                            accessor: (h) => h.ip_address ?? "-",
                        },
                        {
                            header: "Device / Browser",
                            accessor: (h) => (
                                <span className="line-clamp-1 max-w-xs text-xs text-muted-foreground">
                                    {h.user_agent ?? "-"}
                                </span>
                            ),
                        },
                        {
                            header: "Logged In At",
                            accessor: (h) => {
                                const date = new Date(
                                    h.logged_in_at,
                                ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                });
                                const time = new Date(
                                    h.logged_in_at,
                                ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true,
                                });
                                return (
                                    <div>
                                        <p className="text-foreground">
                                            {date}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {time}
                                        </p>
                                    </div>
                                );
                            },
                        },
                    ]}
                    data={histories.data}
                    links={histories.links}
                />
            </div>
        </AuthenticatedLayout>
    );
}
