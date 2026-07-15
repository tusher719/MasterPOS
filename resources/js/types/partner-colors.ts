// Runtime color/label maps for Partner domain.
// MUST be a .ts file — never .d.ts (Vite cannot resolve runtime values from .d.ts)

import type {
    EligibilityStatus,
    PaymentPreference,
    ProfitSource,
    RuleChangeType,
    RuleType,
    SettlementType,
} from "./partner.d";

// -------------------------------------------------------------------------
// Partner Type
// -------------------------------------------------------------------------

export const PARTNER_TYPE_COLORS: Record<string, string> = {
    capital: "bg-blue-100 text-blue-700",
    working: "bg-purple-100 text-purple-700",
    product: "bg-orange-100 text-orange-700",
};

export const PARTNER_TYPE_LABELS: Record<string, string> = {
    capital: "Capital",
    working: "Working",
    product: "Product",
};

// -------------------------------------------------------------------------
// Partner Status
// -------------------------------------------------------------------------

export const PARTNER_STATUS_COLORS: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-500",
    deleted: "bg-red-100 text-red-600",
};

export const PARTNER_STATUS_LABELS: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
    deleted: "Deleted",
};

// -------------------------------------------------------------------------
// Investment Status (used in LinkedInvestmentsCard)
// -------------------------------------------------------------------------

export const INVESTMENT_STATUS_COLORS: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    withdrawn: "bg-amber-100 text-amber-700",
};

export const INVESTMENT_STATUS_LABELS: Record<string, string> = {
    active: "Active",
    withdrawn: "Withdrawn",
};

// -------------------------------------------------------------------------
// Rule Type
// -------------------------------------------------------------------------

export const RULE_TYPE_COLORS: Record<RuleType, string> = {
    fixed_percent: "bg-indigo-100 text-indigo-700",
    product_based: "bg-orange-100 text-orange-700",
    capital_based: "bg-blue-100 text-blue-700",
    mixed: "bg-purple-100 text-purple-700",
};

export const RULE_TYPE_LABELS: Record<RuleType, string> = {
    fixed_percent: "Fixed %",
    product_based: "Product Based",
    capital_based: "Capital Based",
    mixed: "Mixed",
};

// -------------------------------------------------------------------------
// Profit Source
// -------------------------------------------------------------------------

export const PROFIT_SOURCE_COLORS: Record<ProfitSource, string> = {
    capital_share: "bg-blue-100 text-blue-700",
    working_share: "bg-purple-100 text-purple-700",
    product_share: "bg-orange-100 text-orange-700",
    custom: "bg-gray-100 text-gray-700",
};

export const PROFIT_SOURCE_LABELS: Record<ProfitSource, string> = {
    capital_share: "Capital Share",
    working_share: "Working Share",
    product_share: "Product Share",
    custom: "Custom",
};

// -------------------------------------------------------------------------
// Rule Change Type (History timeline)
// -------------------------------------------------------------------------

export const RULE_CHANGE_TYPE_COLORS: Record<RuleChangeType, string> = {
    created: "bg-green-100 text-green-700",
    updated: "bg-amber-100 text-amber-700",
    approved: "bg-indigo-100 text-indigo-700",
    deactivated: "bg-gray-100 text-gray-500",
};

export const RULE_CHANGE_TYPE_LABELS: Record<RuleChangeType, string> = {
    created: "Created",
    updated: "Updated",
    approved: "Approved",
    deactivated: "Deactivated",
};

// -------------------------------------------------------------------------
// Eligibility Status
// -------------------------------------------------------------------------

export const ELIGIBILITY_STATUS_COLORS: Record<EligibilityStatus, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-amber-100 text-amber-700",
    ended: "bg-gray-100 text-gray-500",
};

export const ELIGIBILITY_STATUS_LABELS: Record<EligibilityStatus, string> = {
    active: "Active",
    paused: "Paused",
    ended: "Ended",
};

// -------------------------------------------------------------------------
// Helper — get active partner types from a Partner object
// -------------------------------------------------------------------------

export function getPartnerTypes(partner: {
    partner_type_capital: boolean;
    partner_type_working: boolean;
    partner_type_product: boolean;
}): string[] {
    const types: string[] = [];
    if (partner.partner_type_capital) types.push("capital");
    if (partner.partner_type_working) types.push("working");
    if (partner.partner_type_product) types.push("product");
    return types;
}

// -------------------------------------------------------------------------
// Settlement Type
// -------------------------------------------------------------------------

export const SETTLEMENT_TYPE_COLORS: Record<SettlementType, string> = {
    profit_only: "bg-indigo-100 text-indigo-700",
    cost_plus_profit: "bg-orange-100 text-orange-700",
    custom: "bg-purple-100 text-purple-700",
};

export const SETTLEMENT_TYPE_LABELS: Record<SettlementType, string> = {
    profit_only: "Profit Only",
    cost_plus_profit: "Cost + Profit",
    custom: "Custom",
};

// -------------------------------------------------------------------------
// Payment Preference
// -------------------------------------------------------------------------
export const PAYMENT_PREFERENCE_COLORS: Record<PaymentPreference, string> = {
    cash: "bg-green-100 text-green-700",
    bank_transfer: "bg-blue-100 text-blue-700",
    adjustment: "bg-amber-100 text-amber-700",
    reinvestment: "bg-purple-100 text-purple-700",
};

export const PAYMENT_PREFERENCE_LABELS: Record<PaymentPreference, string> = {
    cash: "Cash",
    bank_transfer: "Bank Transfer",
    adjustment: "Adjustment",
    reinvestment: "Reinvestment",
};

// -------------------------------------------------------------------------
// Product Assignment — Approval Status
// -------------------------------------------------------------------------
export const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-500",
};

export const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
    pending: "Pending Approval",
    approved: "Approved",
    inactive: "Inactive",
};

// -------------------------------------------------------------------------
// Product Assignment — helper to get display status string
// -------------------------------------------------------------------------
export function getAssignmentStatus(assignment: {
    is_pending: boolean;
    is_approved: boolean;
    is_active: boolean;
}): string {
    if (assignment.is_pending) return "pending";
    if (!assignment.is_active) return "inactive";
    return "approved";
}
