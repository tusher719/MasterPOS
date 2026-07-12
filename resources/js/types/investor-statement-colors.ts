// Runtime color maps — imported by components directly
// Kept separate from .d.ts because .d.ts cannot contain runtime values

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    partial: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    deferred: "bg-purple-100 text-purple-700",
    reinvested: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-red-100 text-red-700",
    reopened: "bg-orange-100 text-orange-700",
};

export const CAPITAL_TX_COLORS: Record<string, string> = {
    deposit: "bg-green-100 text-green-700",
    withdrawal: "bg-red-100 text-red-700",
    reinvestment: "bg-indigo-100 text-indigo-700",
    adjustment: "bg-amber-100 text-amber-700",
};

export const CAPITAL_TX_DIRECTION_COLORS: Record<string, string> = {
    credit: "text-green-600",
    debit: "text-red-600",
};
