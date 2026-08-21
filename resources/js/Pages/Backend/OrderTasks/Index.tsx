import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    ORDER_TASK_PRIORITY_COLORS,
    ORDER_TASK_PRIORITY_LABELS,
    ORDER_TASK_SOURCE_LABELS,
    ORDER_TASK_STATUS_COLORS,
    ORDER_TASK_STATUS_LABELS,
    PRIORITY_FILTER_OPTIONS,
    SOURCE_FILTER_OPTIONS,
    STATUS_FILTER_OPTIONS,
} from "@/types/order-task-colors";
import type {
    OrderTask,
    OrderTaskFilters,
    OrderTaskIndexProps,
} from "@/types/order-task.d";
import { Head, router } from "@inertiajs/react";
import {
    AlertTriangle,
    CheckCircle,
    ClipboardList,
    Clock,
    Filter,
    Loader,
    Plus,
    RefreshCw,
    Search,
    User,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import AssignModal from "./_components/AssignModal";
import ConvertToSaleModal from "./_components/ConvertToSaleModal";
import CreateOrderTaskModal from "./_components/CreateOrderTaskModal";
import EditOrderTaskModal from "./_components/EditOrderTaskModal";
import UpdateStatusModal from "./_components/UpdateStatusModal";

export default function OrderTaskIndex({
    tasks,
    stats,
    staffList,
    filters,
    can,
}: OrderTaskIndexProps) {
    // ── Modal state ───────────────────────────────────────────────────────────
    const [showCreate, setShowCreate] = useState(false);
    const [editTask, setEditTask] = useState<OrderTask | null>(null);
    const [assignTask, setAssignTask] = useState<OrderTask | null>(null);
    const [statusTask, setStatusTask] = useState<OrderTask | null>(null);
    const [convertTask, setConvertTask] = useState<OrderTask | null>(null);

    // ── Filter state ──────────────────────────────────────────────────────────
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [priority, setPriority] = useState(filters.priority ?? "");
    const [source, setSource] = useState(filters.source ?? "");
    const [assignmentType, setAssignmentType] = useState(
        filters.assignment_type ?? "",
    );
    const [myTasks, setMyTasks] = useState(filters.my_tasks ?? false);
    const [overdue, setOverdue] = useState(filters.overdue ?? false);

    const hasFilters = !!(
        search ||
        status ||
        priority ||
        source ||
        assignmentType ||
        myTasks ||
        overdue
    );

    // ── Apply / reset filters ─────────────────────────────────────────────────
    const applyFilters = useCallback(
        (overrides: Partial<OrderTaskFilters> = {}) => {
            router.get(
                route("backend.order-tasks.index"),
                {
                    search,
                    status,
                    priority,
                    source,
                    assignment_type: assignmentType,
                    my_tasks: myTasks ? "1" : "",
                    overdue: overdue ? "1" : "",
                    ...overrides,
                },
                { preserveState: true, replace: true },
            );
        },
        [search, status, priority, source, assignmentType, myTasks, overdue],
    );

    const resetFilters = () => {
        setSearch("");
        setStatus("");
        setPriority("");
        setSource("");
        setAssignmentType("");
        setMyTasks(false);
        setOverdue(false);
        router.get(route("backend.order-tasks.index"), {}, { replace: true });
    };

    // ── Claim handler ─────────────────────────────────────────────────────────
    const handleClaim = (task: OrderTask) => {
        router.post(
            route("backend.order-tasks.claim", { orderTask: task.id }),
            {},
            {
                onSuccess: () => toast.success("Task claimed successfully."),
                onError: (e) => toast.error(Object.values(e)[0] as string),
            },
        );
    };

    // ── Delete handler ────────────────────────────────────────────────────────
    const handleDelete = (task: OrderTask) => {
        if (!confirm(`Delete task "${task.title}"?`)) return;
        router.delete(
            route("backend.order-tasks.destroy", { orderTask: task.id }),
            {
                onSuccess: () => toast.success("Task deleted."),
                onError: () => toast.error("Failed to delete task."),
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-800">
                        Order Tasks
                    </h2>
                </div>
                {can.create && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        New Task
                    </button>
                )}
            </div>
            <Head title="Order Tasks" />

            <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
                {/* ── Stats cards ─────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <StatCard
                        label="Total"
                        value={stats.total}
                        icon={
                            <ClipboardList className="h-5 w-5 text-gray-400" />
                        }
                        color="text-gray-700"
                    />
                    <StatCard
                        label="Pending"
                        value={stats.pending}
                        icon={<Clock className="h-5 w-5 text-amber-400" />}
                        color="text-amber-700"
                    />
                    <StatCard
                        label="In Progress"
                        value={stats.in_progress}
                        icon={<Loader className="h-5 w-5 text-blue-400" />}
                        color="text-blue-700"
                    />
                    <StatCard
                        label="Ready"
                        value={stats.ready}
                        icon={
                            <CheckCircle className="h-5 w-5 text-green-400" />
                        }
                        color="text-green-700"
                    />
                    <StatCard
                        label="Overdue"
                        value={stats.overdue}
                        icon={
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                        }
                        color="text-red-600"
                    />
                </div>

                {/* ── Filters ──────────────────────────────────────────────── */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                    {/* Row 1 — search + toggles */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search task, customer, phone…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    applyFilters({ search })
                                }
                                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        {/* My Tasks toggle */}
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={myTasks}
                                onChange={(e) => {
                                    setMyTasks(e.target.checked);
                                    applyFilters({
                                        my_tasks: e.target.checked,
                                    });
                                }}
                                className="rounded border-gray-300 text-indigo-600"
                            />
                            <User className="h-3.5 w-3.5" /> My Tasks
                        </label>

                        {/* Overdue toggle */}
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm text-red-600">
                            <input
                                type="checkbox"
                                checked={overdue}
                                onChange={(e) => {
                                    setOverdue(e.target.checked);
                                    applyFilters({ overdue: e.target.checked });
                                }}
                                className="rounded border-gray-300 text-red-500"
                            />
                            <AlertTriangle className="h-3.5 w-3.5" /> Overdue
                            Only
                        </label>

                        <button
                            onClick={() => applyFilters()}
                            className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
                        >
                            <Filter className="h-3.5 w-3.5" /> Filter
                        </button>

                        {hasFilters && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                <RefreshCw className="h-3.5 w-3.5" /> Reset
                            </button>
                        )}
                    </div>

                    {/* Row 2 — Status filter */}
                    <div className="flex flex-wrap gap-1">
                        {STATUS_FILTER_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    setStatus(opt.value);
                                    applyFilters({ status: opt.value });
                                }}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                    status === opt.value
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Row 3 — Priority + Source */}
                    <div className="flex flex-wrap gap-4">
                        <div className="flex flex-wrap gap-1">
                            {PRIORITY_FILTER_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setPriority(opt.value);
                                        applyFilters({ priority: opt.value });
                                    }}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                        priority === opt.value
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {SOURCE_FILTER_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setSource(opt.value);
                                        applyFilters({ source: opt.value });
                                    }}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                        source === opt.value
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Table ────────────────────────────────────────────────── */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                                        Task
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                                        Customer
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                                        Source
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                                        Priority
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                                        Assigned / Claimed
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                                        Due
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {tasks.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="py-12 text-center text-sm text-gray-400"
                                        >
                                            No tasks found.
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.data.map((task) => (
                                        <TaskRow
                                            key={task.id}
                                            task={task}
                                            can={can}
                                            onEdit={() => setEditTask(task)}
                                            onAssign={() => setAssignTask(task)}
                                            onClaim={() => handleClaim(task)}
                                            onUpdateStatus={() =>
                                                setStatusTask(task)
                                            }
                                            onConvert={() =>
                                                setConvertTask(task)
                                            }
                                            onDelete={() => handleDelete(task)}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {(tasks.meta?.last_page ?? 1) > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                            <p className="text-xs text-gray-500">
                                Showing {tasks.meta?.from ?? 0}–
                                {tasks.meta?.to ?? 0} of{" "}
                                {tasks.meta?.total ?? 0}
                            </p>
                            <div className="flex gap-1">
                                {(tasks.links ?? []).map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.get(link.url)
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        className={`rounded px-2.5 py-1 text-xs ${
                                            link.active
                                                ? "bg-indigo-600 text-white"
                                                : link.url
                                                  ? "text-gray-600 hover:bg-gray-100"
                                                  : "cursor-not-allowed text-gray-300"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modals ───────────────────────────────────────────────────── */}
            {showCreate && (
                <CreateOrderTaskModal
                    staffList={staffList}
                    canAssign={can.assign}
                    onClose={() => setShowCreate(false)}
                />
            )}
            {editTask && (
                <EditOrderTaskModal
                    task={editTask}
                    onClose={() => setEditTask(null)}
                />
            )}
            {assignTask && (
                <AssignModal
                    task={assignTask}
                    staffList={staffList}
                    onClose={() => setAssignTask(null)}
                />
            )}
            {statusTask && (
                <UpdateStatusModal
                    task={statusTask}
                    onClose={() => setStatusTask(null)}
                />
            )}
            {convertTask && (
                <ConvertToSaleModal
                    task={convertTask}
                    onClose={() => setConvertTask(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    icon,
    color,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{label}</span>
                {icon}
            </div>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
        </div>
    );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({
    task,
    can,
    onEdit,
    onAssign,
    onClaim,
    onUpdateStatus,
    onConvert,
    onDelete,
}: {
    task: OrderTask;
    can: {
        create: boolean;
        assign: boolean;
        claim: boolean;
        complete: boolean;
        delete: boolean;
    };
    onEdit: () => void;
    onAssign: () => void;
    onClaim: () => void;
    onUpdateStatus: () => void;
    onConvert: () => void;
    onDelete: () => void;
}) {
    const isTerminal =
        task.status === "converted_to_sale" || task.status === "cancelled";
    const isClaimable =
        task.assignment_type === "open" &&
        task.claimed_by === null &&
        task.status === "pending";
    const isOverdue =
        task.due_date !== null &&
        task.due_date < new Date().toISOString().slice(0, 10) &&
        !isTerminal;

    return (
        <tr
            className={`hover:bg-gray-50 transition-colors ${isTerminal ? "opacity-60" : ""}`}
        >
            {/* Task title */}
            <td className="px-4 py-3">
                <div className="flex items-start gap-2">
                    {isOverdue && (
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                    )}
                    <div>
                        <p className="text-sm font-medium text-gray-800">
                            {task.title}
                        </p>
                        {task.linked_sale && (
                            <p className="text-xs text-indigo-600">
                                → {task.linked_sale.reference_no}
                            </p>
                        )}
                    </div>
                </div>
            </td>

            {/* Customer */}
            <td className="px-4 py-3">
                <p className="text-sm text-gray-700">
                    {task.customer_name_snapshot}
                </p>
                {task.customer_phone_snapshot && (
                    <p className="text-xs text-gray-400">
                        {task.customer_phone_snapshot}
                    </p>
                )}
            </td>

            {/* Source */}
            <td className="px-4 py-3">
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        ORDER_TASK_SOURCE_LABELS[task.source]
                            ? "bg-gray-100 text-gray-600"
                            : ""
                    }`}
                >
                    {ORDER_TASK_SOURCE_LABELS[task.source]}
                </span>
            </td>

            {/* Priority */}
            <td className="px-4 py-3">
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_TASK_PRIORITY_COLORS[task.priority]}`}
                >
                    {ORDER_TASK_PRIORITY_LABELS[task.priority]}
                </span>
            </td>

            {/* Status */}
            <td className="px-4 py-3">
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_TASK_STATUS_COLORS[task.status]}`}
                >
                    {ORDER_TASK_STATUS_LABELS[task.status]}
                </span>
            </td>

            {/* Assigned / Claimed */}
            <td className="px-4 py-3 text-sm text-gray-600">
                {task.assigned_to_user ? (
                    <span className="text-xs">
                        <span className="text-gray-400">Assigned: </span>
                        {task.assigned_to_user.name}
                    </span>
                ) : task.assignment_type === "open" ? (
                    <span className="text-xs text-gray-400">Open</span>
                ) : null}
                {task.claimed_by_user && (
                    <p className="text-xs">
                        <span className="text-gray-400">Claimed: </span>
                        {task.claimed_by_user.name}
                    </p>
                )}
            </td>

            {/* Due date */}
            <td className="px-4 py-3">
                {task.due_date ? (
                    <span
                        className={`text-xs ${isOverdue ? "font-medium text-red-600" : "text-gray-500"}`}
                    >
                        {task.due_date}
                    </span>
                ) : (
                    <span className="text-xs text-gray-300">—</span>
                )}
            </td>

            {/* Actions */}
            <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                    {/* Claim button — open tasks only */}
                    {can.claim && isClaimable && (
                        <button
                            onClick={onClaim}
                            className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                        >
                            Claim
                        </button>
                    )}

                    {/* Status update */}
                    {can.complete && !isTerminal && (
                        <button
                            onClick={onUpdateStatus}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                            title="Update Status"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                    )}

                    {/* Convert to sale */}
                    {can.complete && task.status === "ready" && (
                        <button
                            onClick={onConvert}
                            className="rounded-md px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50"
                        >
                            Convert
                        </button>
                    )}

                    {/* Assign */}
                    {can.assign && !isTerminal && (
                        <button
                            onClick={onAssign}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                            title="Assign"
                        >
                            <User className="h-3.5 w-3.5" />
                        </button>
                    )}

                    {/* Edit */}
                    {can.create && !isTerminal && (
                        <button
                            onClick={onEdit}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                            title="Edit"
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </button>
                    )}

                    {/* Delete */}
                    {can.delete && (
                        <button
                            onClick={onDelete}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                            title="Delete"
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}
