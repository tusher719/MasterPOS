import {
    AppDateRangeInput,
    DEFAULT_PERIOD_PRESETS,
} from "@/Components/DatePicker";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import {
    Activity,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Filter,
    Search,
    X,
} from "lucide-react";
import { useState } from "react";
import DetailModal from "./_components/DetailModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityLogUser {
    id: number;
    name: string;
    email: string;
}

interface ActivityLog {
    id: number;
    user_id: number | null;
    module: string;
    action: string;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    properties: Record<string, unknown> | null;
    created_at: string;
    user: ActivityLogUser | null;
}

interface PaginatorMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface PaginatorLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedLogs {
    data: ActivityLog[];
    meta: PaginatorMeta;
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
}

interface UserOption {
    id: number;
    name: string;
    email: string;
}

interface Filters {
    search?: string;
    module?: string;
    action?: string;
    user_id?: string;
    date_from?: string;
    date_to?: string;
}

interface Props {
    logs: PaginatedLogs;
    modules: string[];
    actions: string[];
    users: UserOption[];
    filters: Filters;
}

// ─── Action badge colors ──────────────────────────────────────────────────────

function getActionColor(action: string): string {
    switch (action.toLowerCase()) {
        case "create":
            return "bg-green-100 text-green-700";
        case "update":
            return "bg-blue-100 text-blue-700";
        case "delete":
            return "bg-red-100 text-red-700";
        case "restore":
            return "bg-amber-100 text-amber-700";
        case "approve":
            return "bg-indigo-100 text-indigo-700";
        default:
            return "bg-gray-100 text-gray-600";
    }
}

// ─── Module badge ─────────────────────────────────────────────────────────────

function ModuleBadge({ module }: { module: string }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <Activity size={10} />
            {module}
        </span>
    );
}

// ─── Action badge ─────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
    return (
        <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${getActionColor(action)}`}
        >
            {action}
        </span>
    );
}

// ─── Format datetime ──────────────────────────────────────────────────────────

function formatDateTime(dt: string): { date: string; time: string } {
    const d = new Date(dt);
    return {
        date: d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }),
        time: d.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }),
    };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AuditTrailIndex({
    logs,
    modules,
    actions,
    users,
    filters,
}: Props) {
    const data = logs?.data ?? [];
    const meta = logs?.meta ?? {
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 0,
        from: null,
        to: null,
    };

    // Local filter state — synced from server filters on mount
    const [search, setSearch] = useState(filters.search ?? "");
    const [module, setModule] = useState(filters.module ?? "");
    const [action, setAction] = useState(filters.action ?? "");
    const [userId, setUserId] = useState(filters.user_id ?? "");
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? "");
    const [dateTo, setDateTo] = useState(filters.date_to ?? "");

    // Detail modal
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

    const hasFilters = !!(
        search ||
        module ||
        action ||
        userId ||
        dateFrom ||
        dateTo
    );

    // Apply filters — router.get with all params
    const applyFilters = (overrides: Partial<Filters> = {}) => {
        const params = {
            search,
            module,
            action,
            user_id: userId,
            date_from: dateFrom,
            date_to: dateTo,
            ...overrides,
        };

        // Remove empty values
        const cleaned = Object.fromEntries(
            Object.entries(params).filter(
                ([, v]) => v !== "" && v !== undefined,
            ),
        );

        router.get(route("backend.audit-trail.index"), cleaned, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const resetFilters = () => {
        setSearch("");
        setModule("");
        setAction("");
        setUserId("");
        setDateFrom("");
        setDateTo("");
        router.get(
            route("backend.audit-trail.index"),
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") applyFilters();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Audit Trail" />

            <div className="space-y-6">
                {/* ── Page header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                            <ClipboardList size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Audit Trail
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                System-wide activity log
                            </p>
                        </div>
                    </div>

                    {/* Total count */}
                    <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                            {meta.total.toLocaleString()}
                        </span>{" "}
                        entries
                    </div>
                </div>

                {/* ── Filters ──────────────────────────────────────────────── */}
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {/* Search */}
                        <div className="relative">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <input
                                type="text"
                                placeholder="Search description..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="w-full rounded-md border border-border bg-input pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Module */}
                        <select
                            value={module}
                            onChange={(e) => {
                                setModule(e.target.value);
                                applyFilters({ module: e.target.value });
                            }}
                            className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">All Modules</option>
                            {modules.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>

                        {/* Action */}
                        <select
                            value={action}
                            onChange={(e) => {
                                setAction(e.target.value);
                                applyFilters({ action: e.target.value });
                            }}
                            className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">All Actions</option>
                            {actions.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>

                        {/* User */}
                        <select
                            value={userId}
                            onChange={(e) => {
                                setUserId(e.target.value);
                                applyFilters({ user_id: e.target.value });
                            }}
                            className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">All Users</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>

                        {/* Date range — spans 2 cols on larger screens */}
                        <div className="sm:col-span-2">
                            <AppDateRangeInput
                                startValue={dateFrom}
                                endValue={dateTo}
                                onStartChange={(v) => setDateFrom(v)}
                                onEndChange={(v) => setDateTo(v)}
                                onChange={(start, end) =>
                                    applyFilters({
                                        date_from: start,
                                        date_to: end,
                                    })
                                }
                                presets={DEFAULT_PERIOD_PRESETS}
                            />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => applyFilters()}
                                className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                <Filter size={14} />
                                Apply
                            </button>

                            {hasFilters && (
                                <button
                                    onClick={resetFilters}
                                    className="flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                                >
                                    <X size={14} />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Table ────────────────────────────────────────────────── */}
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                        Timestamp
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                        User
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                        Module
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                        Action
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                        Description
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                        Subject
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-16 text-center text-sm text-muted-foreground"
                                        >
                                            <ClipboardList
                                                size={32}
                                                className="mx-auto mb-3 opacity-30"
                                            />
                                            No activity logs found
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((log) => {
                                        const { date, time } = formatDateTime(
                                            log.created_at,
                                        );
                                        return (
                                            <tr
                                                key={log.id}
                                                onClick={() =>
                                                    setSelectedLog(log)
                                                }
                                                className="cursor-pointer bg-card transition-colors hover:bg-muted/40"
                                            >
                                                {/* Timestamp */}
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <p className="text-xs font-medium text-foreground">
                                                        {date}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {time}
                                                    </p>
                                                </td>

                                                {/* User */}
                                                <td className="px-4 py-3">
                                                    {log.user ? (
                                                        <div>
                                                            <p className="text-xs font-medium text-foreground">
                                                                {log.user.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {log.user.email}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            System
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Module */}
                                                <td className="px-4 py-3">
                                                    <ModuleBadge
                                                        module={log.module}
                                                    />
                                                </td>

                                                {/* Action */}
                                                <td className="px-4 py-3">
                                                    <ActionBadge
                                                        action={log.action}
                                                    />
                                                </td>

                                                {/* Description */}
                                                <td className="max-w-xs px-4 py-3">
                                                    <p className="truncate text-xs text-foreground">
                                                        {log.description}
                                                    </p>
                                                </td>

                                                {/* Subject */}
                                                <td className="px-4 py-3">
                                                    {log.subject_type ? (
                                                        <span className="text-xs text-muted-foreground">
                                                            {log.subject_type
                                                                .split("\\")
                                                                .pop()}
                                                            {log.subject_id && (
                                                                <span className="ml-1 font-mono text-[10px] text-muted-foreground/60">
                                                                    #
                                                                    {
                                                                        log.subject_id
                                                                    }
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/40">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Pagination ───────────────────────────────────────── */}
                    {(meta?.last_page ?? 1) > 1 && (
                        <div className="flex items-center justify-between border-t border-border px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                                Showing{" "}
                                <span className="font-medium text-foreground">
                                    {meta.from ?? 0}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium text-foreground">
                                    {meta.to ?? 0}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-foreground">
                                    {meta.total.toLocaleString()}
                                </span>{" "}
                                entries
                            </p>

                            <div className="flex items-center gap-1">
                                <button
                                    disabled={!logs.links.prev}
                                    onClick={() =>
                                        logs.links.prev &&
                                        router.get(
                                            logs.links.prev,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft size={13} />
                                    Prev
                                </button>

                                <span className="px-3 text-xs text-muted-foreground">
                                    {meta.current_page} / {meta.last_page}
                                </span>

                                <button
                                    disabled={!logs.links.next}
                                    onClick={() =>
                                        logs.links.next &&
                                        router.get(
                                            logs.links.next,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                    <ChevronRight size={13} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Detail Modal ─────────────────────────────────────────────── */}
            {selectedLog && (
                <DetailModal
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
