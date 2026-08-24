import type { TaskItemStatus, TaskStatus } from "./product-planning-task";

// ─── Task status ──────────────────────────────────────────────────────────────

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    done: "Done",
    cancelled: "Cancelled",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
    pending: "bg-amber-100 text-amber-700",
    in_progress: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
};

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "done", label: "Done" },
    { value: "cancelled", label: "Cancelled" },
];

// Valid next statuses per current status (terminal = empty array)
export const TASK_STATUS_FLOW: Record<TaskStatus, TaskStatus[]> = {
    pending: ["in_progress", "cancelled"],
    in_progress: ["done", "cancelled"],
    done: [],
    cancelled: [],
};

export function getNextTaskStatuses(current: TaskStatus): TaskStatus[] {
    return TASK_STATUS_FLOW[current] ?? [];
}

// ─── Task item status ─────────────────────────────────────────────────────────

export const TASK_ITEM_STATUS_LABELS: Record<TaskItemStatus, string> = {
    pending: "Pending",
    ready: "Ready",
    cancelled: "Cancelled",
};

export const TASK_ITEM_STATUS_COLORS: Record<TaskItemStatus, string> = {
    pending: "bg-amber-100 text-amber-700",
    ready: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
};

export const TASK_ITEM_STATUS_OPTIONS: {
    value: TaskItemStatus;
    label: string;
}[] = [
    { value: "pending", label: "Pending" },
    { value: "ready", label: "Ready" },
    { value: "cancelled", label: "Cancelled" },
];
