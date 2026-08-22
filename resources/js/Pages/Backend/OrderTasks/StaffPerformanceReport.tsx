import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import {
    CheckCircle2,
    Clock,
    ListTodo,
    TrendingUp,
    XCircle,
} from "lucide-react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PerformanceRow {
    user_id: number;
    user_name: string;
    total_tasks: number;
    assigned: number;
    claimed: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    avg_completion_minutes: number;
}

interface Summary {
    total_tasks: number;
    total_completed: number;
    total_cancelled: number;
    avg_completion_minutes: number;
}

interface StaffOption {
    id: number;
    name: string;
}

interface Filters {
    user_id: string | null;
    date_from: string | null;
    date_to: string | null;
    source: string | null;
    status: string | null;
}

interface Props {
    rows: PerformanceRow[];
    summary: Summary;
    staffOptions: StaffOption[];
    filters: Filters;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_OPTIONS = [
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "phone", label: "Phone" },
    { value: "website", label: "Website" },
    { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "claimed", label: "Claimed" },
    { value: "in_progress", label: "In Progress" },
    { value: "ready", label: "Ready" },
    { value: "converted_to_sale", label: "Converted to Sale" },
    { value: "cancelled", label: "Cancelled" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMinutes(minutes: number): string {
    if (minutes === 0) return "—";
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function completionRate(row: PerformanceRow): string {
    if (row.total_tasks === 0) return "0%";
    return `${Math.round((row.completed / row.total_tasks) * 100)}%`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${color}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-xl font-bold text-gray-800">{value}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffPerformanceReport({
    rows,
    summary,
    staffOptions,
    filters,
}: Props) {
    const [form, setForm] = useState<Filters>({
        user_id: filters.user_id ?? "",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
        source: filters.source ?? "",
        status: filters.status ?? "",
    });

    function handleApply() {
        const params: Record<string, string> = {};
        if (form.user_id) params.user_id = form.user_id;
        if (form.date_from) params.date_from = form.date_from;
        if (form.date_to) params.date_to = form.date_to;
        if (form.source) params.source = form.source;
        if (form.status) params.status = form.status;

        router.get(route("backend.order-tasks.performance"), params, {
            preserveScroll: true,
        });
    }

    function handleReset() {
        setForm({
            user_id: "",
            date_from: "",
            date_to: "",
            source: "",
            status: "",
        });
        router.get(
            route("backend.order-tasks.performance"),
            {},
            { preserveScroll: true },
        );
    }

    const hasFilter =
        !!form.user_id ||
        !!form.date_from ||
        !!form.date_to ||
        !!form.source ||
        !!form.status;

    return (
        <AuthenticatedLayout>
            <Head title="Staff Performance Report" />

            <div className="space-y-6">
                {/* ── Page Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Staff Performance Report
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Order task metrics per staff / moderator
                        </p>
                    </div>
                </div>

                {/* ── Filters ── */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {/* Staff selector */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                Staff / Moderator
                            </label>
                            <select
                                value={form.user_id ?? ""}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        user_id: e.target.value,
                                    }))
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">All Staff</option>
                                {staffOptions.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                Date From
                            </label>
                            <input
                                type="date"
                                value={form.date_from ?? ""}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        date_from: e.target.value,
                                    }))
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                Date To
                            </label>
                            <input
                                type="date"
                                value={form.date_to ?? ""}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        date_to: e.target.value,
                                    }))
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Source */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                Source
                            </label>
                            <select
                                value={form.source ?? ""}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        source: e.target.value,
                                    }))
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">All Sources</option>
                                {SOURCE_OPTIONS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                Task Status
                            </label>
                            <select
                                value={form.status ?? ""}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        status: e.target.value,
                                    }))
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">All Statuses</option>
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Filter actions */}
                    <div className="mt-3 flex items-center gap-2">
                        <button
                            onClick={handleApply}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Apply Filters
                        </button>
                        {hasFilter && (
                            <button
                                onClick={handleReset}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Summary Cards ── */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard
                        label="Total Tasks"
                        value={summary.total_tasks}
                        icon={ListTodo}
                        color="bg-gray-100 text-gray-600"
                    />
                    <StatCard
                        label="Completed"
                        value={summary.total_completed}
                        icon={CheckCircle2}
                        color="bg-green-100 text-green-600"
                    />
                    <StatCard
                        label="Cancelled"
                        value={summary.total_cancelled}
                        icon={XCircle}
                        color="bg-red-100 text-red-500"
                    />
                    <StatCard
                        label="Avg. Completion"
                        value={formatMinutes(summary.avg_completion_minutes)}
                        icon={Clock}
                        color="bg-indigo-100 text-indigo-600"
                    />
                </div>

                {/* ── Table ── */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-3">
                        <h2 className="text-sm font-medium text-gray-700">
                            Per-Staff Breakdown
                            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                {rows.length} staff
                            </span>
                        </h2>
                    </div>

                    {rows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <TrendingUp size={32} className="mb-2 opacity-30" />
                            <p className="text-sm">
                                No data for the selected filters.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        <th className="px-4 py-3">Staff</th>
                                        <th className="px-4 py-3 text-center">
                                            Total Tasks
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Assigned
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Claimed
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            In Progress
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Completed
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Cancelled
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Completion Rate
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Avg. Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {rows.map((row) => {
                                        const rate = parseInt(
                                            completionRate(row),
                                        );
                                        const rateColor =
                                            rate >= 70
                                                ? "text-green-700 bg-green-50"
                                                : rate >= 40
                                                  ? "text-amber-700 bg-amber-50"
                                                  : "text-red-600 bg-red-50";

                                        return (
                                            <tr
                                                key={row.user_id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                {/* Staff name */}
                                                <td className="px-4 py-3 font-medium text-gray-800">
                                                    {row.user_name}
                                                </td>

                                                {/* Total */}
                                                <td className="px-4 py-3 text-center text-gray-600">
                                                    {row.total_tasks}
                                                </td>

                                                {/* Assigned */}
                                                <td className="px-4 py-3 text-center">
                                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                        {row.assigned}
                                                    </span>
                                                </td>

                                                {/* Claimed */}
                                                <td className="px-4 py-3 text-center">
                                                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                                                        {row.claimed}
                                                    </span>
                                                </td>

                                                {/* In Progress */}
                                                <td className="px-4 py-3 text-center">
                                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                                        {row.in_progress}
                                                    </span>
                                                </td>

                                                {/* Completed */}
                                                <td className="px-4 py-3 text-center">
                                                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                                        {row.completed}
                                                    </span>
                                                </td>

                                                {/* Cancelled */}
                                                <td className="px-4 py-3 text-center">
                                                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500">
                                                        {row.cancelled}
                                                    </span>
                                                </td>

                                                {/* Completion Rate */}
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${rateColor}`}
                                                    >
                                                        {completionRate(row)}
                                                    </span>
                                                </td>

                                                {/* Avg time */}
                                                <td className="px-4 py-3 text-center text-gray-500">
                                                    {formatMinutes(
                                                        row.avg_completion_minutes,
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                                {/* Footer totals */}
                                <tfoot>
                                    <tr className="border-t-2 border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                                        <td className="px-4 py-3">Total</td>
                                        <td className="px-4 py-3 text-center">
                                            {summary.total_tasks}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {rows.reduce(
                                                (s, r) => s + r.assigned,
                                                0,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {rows.reduce(
                                                (s, r) => s + r.claimed,
                                                0,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {rows.reduce(
                                                (s, r) => s + r.in_progress,
                                                0,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-green-700">
                                            {summary.total_completed}
                                        </td>
                                        <td className="px-4 py-3 text-center text-red-500">
                                            {summary.total_cancelled}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            —
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {formatMinutes(
                                                summary.avg_completion_minutes,
                                            )}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
