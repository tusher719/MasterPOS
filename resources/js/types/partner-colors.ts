// Runtime color/label maps for Partner domain.
// MUST be a .ts file — never .d.ts (Vite cannot resolve runtime values from .d.ts)

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
