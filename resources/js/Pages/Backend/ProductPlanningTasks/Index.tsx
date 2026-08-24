import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import type {
    ProductPlanningTask,
    TaskFilters,
    TaskIndexProps,
    TaskStatus,
} from "@/types/product-planning-task";
import {
    TASK_STATUS_COLORS,
    TASK_STATUS_LABELS,
    TASK_STATUS_OPTIONS,
} from "@/types/product-planning-task-colors";
import { Head, router } from "@inertiajs/react";
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ClipboardList,
    Clock,
    Edit2,
    PlusCircle,
    RefreshCw,
    RotateCcw,
    XCircle,
} from "lucide-react";
import { useState } from "react";
import CreateTaskModal from "./_components/CreateTaskModal";
import EditTaskModal from "./_components/EditTaskModal";
import UpdateStatusModal from "./_components/UpdateStatusModal";

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                        {value}
                    </p>
                </div>
                <div className={`rounded-full p-2 ${color}`}>
                    <Icon size={18} />
                </div>
            </div>
        </div>
    );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TASK_STATUS_COLORS[status]}`}
        >
            {TASK_STATUS_LABELS[status]}
        </span>
    );
}

// ─── Grand total helper ───────────────────────────────────────────────────────

function calcGrandTotal(task: ProductPlanningTask): number {
    return task.items.reduce((sum, item) => {
        if (item.unit_cost === null) return sum;
        return sum + Number(item.quantity) * Number(item.unit_cost);
    }, 0);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Index({
    tasks,
    stats,
    staffOptions,
    products,
    filters,
    can,
}: TaskIndexProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [assignedTo, setAssignedTo] = useState(filters.assigned_to ?? "");
    const [trashed, setTrashed] = useState(filters.trashed ?? false);

    const [showCreate, setShowCreate] = useState(false);
    const [editTask, setEditTask] = useState<ProductPlanningTask | null>(null);
    const [statusTask, setStatusTask] = useState<ProductPlanningTask | null>(
        null,
    );

    // ─── Filter helpers ───────────────────────────────────────────────────────

    function applyFilters(overrides: Partial<TaskFilters> = {}) {
        router.get(
            route("backend.product-planning-tasks.index"),
            {
                search: overrides.search ?? search,
                status: overrides.status ?? status,
                assigned_to: overrides.assigned_to ?? assignedTo,
                trashed: overrides.trashed ?? trashed,
            },
            { preserveScroll: true, preserveState: true },
        );
    }

    function resetFilters() {
        setSearch("");
        setStatus("");
        setAssignedTo("");
        setTrashed(false);
        router.get(
            route("backend.product-planning-tasks.index"),
            {},
            { preserveScroll: true },
        );
    }

    const hasFilters = !!(search || status || assignedTo || trashed);

    // ─── Row actions ──────────────────────────────────────────────────────────

    function handleDelete(task: ProductPlanningTask) {
        if (!confirm(`Delete task "${task.title}"?`)) return;
        router.delete(
            route("backend.product-planning-tasks.destroy", task.id),
            {
                preserveScroll: true,
            },
        );
    }

    function handleRestore(task: ProductPlanningTask) {
        router.post(
            route("backend.product-planning-tasks.restore", task.id),
            {},
            { preserveScroll: true },
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Product Planning Tasks" />

            {/* ── Header ── */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Product Planning Tasks
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Plan and track product preparation internally.
                    </p>
                </div>
                {can.create && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <PlusCircle size={16} />
                        New Task
                    </button>
                )}
            </div>

            {/* ── Stats ── */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard
                    label="Total"
                    value={stats.total}
                    icon={ClipboardList}
                    color="bg-gray-100 text-gray-500"
                />
                <StatCard
                    label="Pending"
                    value={stats.pending}
                    icon={Clock}
                    color="bg-amber-100 text-amber-600"
                />
                <StatCard
                    label="In Progress"
                    value={stats.in_progress}
                    icon={RefreshCw}
                    color="bg-blue-100 text-blue-600"
                />
                <StatCard
                    label="Done"
                    value={stats.done}
                    icon={CheckCircle2}
                    color="bg-green-100 text-green-600"
                />
                <StatCard
                    label="Cancelled"
                    value={stats.cancelled}
                    icon={XCircle}
                    color="bg-red-100 text-red-600"
                />
                <StatCard
                    label="Overdue"
                    value={stats.overdue}
                    icon={AlertCircle}
                    color="bg-orange-100 text-orange-600"
                />
            </div>

            {/* ── Filters ── */}
            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-end gap-3">
                    {/* Search */}
                    <div className="min-w-[200px] flex-1">
                        <input
                            type="text"
                            placeholder="Search by title…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && applyFilters()
                            }
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Status pills */}
                    <div className="flex flex-wrap gap-1">
                        <button
                            onClick={() => {
                                setStatus("");
                                applyFilters({ status: "" });
                            }}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                !status
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            All
                        </button>
                        {TASK_STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    setStatus(opt.value);
                                    applyFilters({ status: opt.value });
                                }}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                    status === opt.value
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Assigned to */}
                    <select
                        value={assignedTo}
                        onChange={(e) => {
                            setAssignedTo(e.target.value);
                            applyFilters({ assigned_to: e.target.value });
                        }}
                        className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">All Staff</option>
                        {staffOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>

                    {/* Trashed toggle */}
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={trashed}
                            onChange={(e) => {
                                setTrashed(e.target.checked);
                                applyFilters({ trashed: e.target.checked });
                            }}
                            className="rounded border-gray-300 text-indigo-600"
                        />
                        Show deleted
                    </label>

                    {/* Apply / Reset */}
                    <button
                        onClick={() => applyFilters()}
                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        Apply
                    </button>
                    {hasFilters && (
                        <button
                            onClick={resetFilters}
                            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Title
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Items
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Grand Total
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Due Date
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Assigned To
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">
                                    Created By
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {tasks.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-12 text-center text-gray-400"
                                    >
                                        No planning tasks found.
                                    </td>
                                </tr>
                            ) : (
                                tasks.data.map((task) => {
                                    const grandTotal = calcGrandTotal(task);
                                    const isDeleted = !!task.deleted_at;
                                    const isTerminal =
                                        task.status === "done" ||
                                        task.status === "cancelled";

                                    return (
                                        <tr
                                            key={task.id}
                                            className={
                                                isDeleted
                                                    ? "opacity-50"
                                                    : "hover:bg-gray-50"
                                            }
                                        >
                                            {/* Title */}
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-800">
                                                    {task.title}
                                                </p>
                                                {task.note && (
                                                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                                                        {task.note}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    status={task.status}
                                                />
                                            </td>

                                            {/* Items count */}
                                            <td className="px-4 py-3 text-gray-600">
                                                {task.items.length} item
                                                {task.items.length !== 1
                                                    ? "s"
                                                    : ""}
                                            </td>

                                            {/* Grand total */}
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {grandTotal > 0
                                                    ? `৳${grandTotal.toFixed(2)}`
                                                    : "—"}
                                            </td>

                                            {/* Due date */}
                                            <td className="px-4 py-3">
                                                {task.due_date ? (
                                                    <span className="flex items-center gap-1 text-gray-600">
                                                        <Calendar size={13} />
                                                        {task.due_date.slice(
                                                            0,
                                                            10,
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            {/* Assigned to */}
                                            <td className="px-4 py-3 text-gray-600">
                                                {task.assigned_to_user
                                                    ?.name ?? (
                                                    <span className="text-gray-300">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>

                                            {/* Created by */}
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                <div>
                                                    {task.created_by_user
                                                        ?.name ?? "—"}
                                                </div>
                                                <div className="text-gray-400">
                                                    {task.created_at.slice(
                                                        0,
                                                        10,
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {isDeleted ? (
                                                        // Restore button
                                                        can.delete && (
                                                            <button
                                                                onClick={() =>
                                                                    handleRestore(
                                                                        task,
                                                                    )
                                                                }
                                                                className="rounded-md p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                                                                title="Restore"
                                                            >
                                                                <RotateCcw
                                                                    size={15}
                                                                />
                                                            </button>
                                                        )
                                                    ) : (
                                                        <>
                                                            {/* Update status */}
                                                            {can.edit &&
                                                                !isTerminal && (
                                                                    <button
                                                                        onClick={() =>
                                                                            setStatusTask(
                                                                                task,
                                                                            )
                                                                        }
                                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                                                                        title="Update status"
                                                                    >
                                                                        <CheckCircle2
                                                                            size={
                                                                                15
                                                                            }
                                                                        />
                                                                    </button>
                                                                )}

                                                            {/* Edit */}
                                                            {can.edit &&
                                                                !isTerminal && (
                                                                    <button
                                                                        onClick={() =>
                                                                            setEditTask(
                                                                                task,
                                                                            )
                                                                        }
                                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2
                                                                            size={
                                                                                15
                                                                            }
                                                                        />
                                                                    </button>
                                                                )}

                                                            {/* Delete */}
                                                            {can.delete && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            task,
                                                                        )
                                                                    }
                                                                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                                    title="Delete"
                                                                >
                                                                    <XCircle
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                {(tasks.last_page ?? 1) > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
                        <span>
                            Showing {tasks.from ?? 0}–{tasks.to ?? 0} of{" "}
                            {tasks.total} tasks
                        </span>
                        <div className="flex gap-1">
                            {tasks.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.get(
                                            link.url,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                                        link.active
                                            ? "bg-indigo-600 text-white"
                                            : link.url
                                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                              : "cursor-not-allowed text-gray-300"
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {showCreate && (
                <CreateTaskModal
                    products={products}
                    staffOptions={staffOptions}
                    onClose={() => setShowCreate(false)}
                />
            )}

            {editTask && (
                <EditTaskModal
                    task={editTask}
                    products={products}
                    staffOptions={staffOptions}
                    onClose={() => setEditTask(null)}
                />
            )}

            {statusTask && (
                <UpdateStatusModal
                    task={statusTask}
                    onClose={() => setStatusTask(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
