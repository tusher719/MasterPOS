// resources/js/Pages/Backend/Purchases/_components/StatusBadge.tsx

import React from "react";

// ─── Purchase Status ──────────────────────────────────────────────────────────

type PurchaseStatus =
    | "draft"
    | "ordered"
    | "received"
    | "partial_received"
    | "cancelled";

type PaymentStatus = "paid" | "partial" | "due";

const purchaseStatusConfig: Record<
    PurchaseStatus,
    { label: string; className: string }
> = {
    draft: {
        label: "Draft",
        className: "bg-gray-100 text-gray-500",
    },
    ordered: {
        label: "Ordered",
        className: "bg-blue-100 text-blue-700",
    },
    received: {
        label: "Received",
        className: "bg-green-100 text-green-700",
    },
    partial_received: {
        label: "Partial Received",
        className: "bg-amber-100 text-amber-700",
    },
    cancelled: {
        label: "Cancelled",
        className: "bg-red-100 text-red-500",
    },
};

const paymentStatusConfig: Record<
    PaymentStatus,
    { label: string; className: string }
> = {
    paid: {
        label: "Paid",
        className: "bg-green-100 text-green-700",
    },
    partial: {
        label: "Partial",
        className: "bg-amber-100 text-amber-700",
    },
    due: {
        label: "Due",
        className: "bg-red-100 text-red-500",
    },
};

// ─── Components ───────────────────────────────────────────────────────────────

interface PurchaseStatusBadgeProps {
    status: PurchaseStatus | string;
}

export function PurchaseStatusBadge({ status }: PurchaseStatusBadgeProps) {
    const config = purchaseStatusConfig[status as PurchaseStatus] ?? {
        label: status,
        className: "bg-gray-100 text-gray-500",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
        >
            {config.label}
        </span>
    );
}

interface PaymentStatusBadgeProps {
    status: PaymentStatus | string;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
    const config = paymentStatusConfig[status as PaymentStatus] ?? {
        label: status,
        className: "bg-gray-100 text-gray-500",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
        >
            {config.label}
        </span>
    );
}
