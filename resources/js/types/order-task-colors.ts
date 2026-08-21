import type {
    OrderTaskPriority,
    OrderTaskSource,
    OrderTaskStatus,
} from "./order-task.d";

// ─── Status ───────────────────────────────────────────────────────────────────

export const ORDER_TASK_STATUS_LABELS: Record<OrderTaskStatus, string> = {
    pending: "Pending",
    claimed: "Claimed",
    in_progress: "In Progress",
    ready: "Ready",
    converted_to_sale: "Converted",
    cancelled: "Cancelled",
};

export const ORDER_TASK_STATUS_COLORS: Record<OrderTaskStatus, string> = {
    pending: "bg-gray-100 text-gray-600",
    claimed: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    ready: "bg-green-100 text-green-700",
    converted_to_sale: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-red-100 text-red-600",
};

// ─── Priority ─────────────────────────────────────────────────────────────────

export const ORDER_TASK_PRIORITY_LABELS: Record<OrderTaskPriority, string> = {
    urgent: "Urgent",
    normal: "Normal",
    flexible: "Flexible",
};

export const ORDER_TASK_PRIORITY_COLORS: Record<OrderTaskPriority, string> = {
    urgent: "bg-red-100 text-red-700",
    normal: "bg-blue-100 text-blue-700",
    flexible: "bg-gray-100 text-gray-500",
};

// ─── Source ───────────────────────────────────────────────────────────────────

export const ORDER_TASK_SOURCE_LABELS: Record<OrderTaskSource, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    phone: "Phone",
    website: "Website",
    other: "Other",
};

export const ORDER_TASK_SOURCE_COLORS: Record<OrderTaskSource, string> = {
    facebook: "bg-blue-100 text-blue-700",
    instagram: "bg-pink-100 text-pink-700",
    whatsapp: "bg-green-100 text-green-700",
    phone: "bg-purple-100 text-purple-700",
    website: "bg-indigo-100 text-indigo-700",
    other: "bg-gray-100 text-gray-500",
};

// ─── Filter option arrays (for button groups) ─────────────────────────────────

export const STATUS_FILTER_OPTIONS = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "claimed", label: "Claimed" },
    { value: "in_progress", label: "In Progress" },
    { value: "ready", label: "Ready" },
    { value: "converted_to_sale", label: "Converted" },
    { value: "cancelled", label: "Cancelled" },
] as const;

export const PRIORITY_FILTER_OPTIONS = [
    { value: "", label: "All" },
    { value: "urgent", label: "Urgent" },
    { value: "normal", label: "Normal" },
    { value: "flexible", label: "Flexible" },
] as const;

export const SOURCE_FILTER_OPTIONS = [
    { value: "", label: "All" },
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "phone", label: "Phone" },
    { value: "website", label: "Website" },
    { value: "other", label: "Other" },
] as const;
