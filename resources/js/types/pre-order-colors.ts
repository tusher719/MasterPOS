// resources/js/types/pre-order-colors.ts
// Runtime color/label maps — kept in .ts not .d.ts (Rule 16)

import type { PreOrderStatus } from "./pre-order";

// ─── Status ───────────────────────────────────────────────────────────────────

export const PRE_ORDER_STATUS_LABELS: Record<PreOrderStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    ready: "Ready",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

export const PRE_ORDER_STATUS_COLORS: Record<PreOrderStatus, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    ready: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
};

// ─── Filter options ───────────────────────────────────────────────────────────

export const PRE_ORDER_STATUS_OPTIONS: {
    value: PreOrderStatus | "";
    label: string;
}[] = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "ready", label: "Ready" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
];

// ─── Payment method options for advance payment ───────────────────────────────

export const ADVANCE_PAYMENT_METHOD_OPTIONS: {
    value: string;
    label: string;
}[] = [
    { value: "cash", label: "Cash" },
    { value: "bkash", label: "bKash" },
    { value: "nagad", label: "Nagad" },
    { value: "rocket", label: "Rocket" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "other", label: "Other" },
];

// ─── Status flow — which statuses can transition to which ─────────────────────
// Used in UpdateStatusModal to disable invalid transitions

export const PRE_ORDER_STATUS_FLOW: Record<PreOrderStatus, PreOrderStatus[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["ready", "cancelled"],
    ready: ["delivered", "cancelled"],
    delivered: [], // terminal
    cancelled: [], // terminal
};

// ─── Helper — get next valid statuses for a given current status ──────────────

export function getNextStatuses(current: PreOrderStatus): PreOrderStatus[] {
    return PRE_ORDER_STATUS_FLOW[current] ?? [];
}
