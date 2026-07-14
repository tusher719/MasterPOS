// Runtime color/label maps for Partner domain.
// MUST be a .ts file — never .d.ts (Vite cannot resolve runtime values from .d.ts)

import type { ProfitSource, RuleChangeType, RuleType } from "./partner.d";

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
