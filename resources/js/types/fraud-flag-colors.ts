// Runtime color/label maps — must live in .ts not .d.ts (Rule 16)
// Tailwind classes kept as static strings to prevent PurgeCSS stripping

import type {
    FraudFlagReason,
    FraudFlagStatus,
    FraudFlagTriggerType,
} from "./fraud-flag";

// ── Status ────────────────────────────────────────────────────────────────────

export const FRAUD_FLAG_STATUS_LABELS: Record<FraudFlagStatus, string> = {
    pending_review: "Pending Review",
    confirmed_fraud: "Confirmed Fraud",
    cleared: "Cleared",
};

export const FRAUD_FLAG_STATUS_COLORS: Record<FraudFlagStatus, string> = {
    pending_review: "bg-amber-100 text-amber-700",
    confirmed_fraud: "bg-red-100 text-red-700",
    cleared: "bg-green-100 text-green-700",
};

// ── Trigger Type ──────────────────────────────────────────────────────────────

export const FRAUD_FLAG_TRIGGER_LABELS: Record<FraudFlagTriggerType, string> = {
    manual: "Manual",
    auto_layer2: "Auto (IP Limit)",
    auto_layer3: "Auto (Success Ratio)",
};

export const FRAUD_FLAG_TRIGGER_COLORS: Record<FraudFlagTriggerType, string> = {
    manual: "bg-indigo-100 text-indigo-700",
    auto_layer2: "bg-orange-100 text-orange-700",
    auto_layer3: "bg-purple-100 text-purple-700",
};

// ── Reason ────────────────────────────────────────────────────────────────────

export const FRAUD_FLAG_REASON_LABELS: Record<FraudFlagReason, string> = {
    no_answer: "No Answer",
    refused_delivery: "Refused Delivery",
    multiple_returns: "Multiple Returns",
    fake_order: "Fake Order",
    failed_validation: "Failed Validation",
    ip_limit_exceeded: "IP Limit Exceeded",
    low_success_ratio: "Low Success Ratio",
    other: "Other",
};

// ── Filter options (for select/button-group UI) ───────────────────────────────

export const FRAUD_FLAG_STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "pending_review", label: "Pending Review" },
    { value: "confirmed_fraud", label: "Confirmed Fraud" },
    { value: "cleared", label: "Cleared" },
] as const;

export const FRAUD_FLAG_TRIGGER_OPTIONS = [
    { value: "", label: "All Triggers" },
    { value: "manual", label: "Manual" },
    { value: "auto_layer2", label: "Auto (IP Limit)" },
    { value: "auto_layer3", label: "Auto (Success Ratio)" },
] as const;

export const FRAUD_FLAG_REASON_OPTIONS = [
    { value: "", label: "All Reasons" },
    { value: "no_answer", label: "No Answer" },
    { value: "refused_delivery", label: "Refused Delivery" },
    { value: "multiple_returns", label: "Multiple Returns" },
    { value: "fake_order", label: "Fake Order" },
    { value: "failed_validation", label: "Failed Validation" },
    { value: "ip_limit_exceeded", label: "IP Limit Exceeded" },
    { value: "low_success_ratio", label: "Low Success Ratio" },
    { value: "other", label: "Other" },
] as const;
