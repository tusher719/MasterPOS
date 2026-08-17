// Fraud Flag type declarations
// Runtime color/label maps live in fraud-flag-colors.ts (not here)

export type FraudFlagReason =
    | "no_answer"
    | "refused_delivery"
    | "multiple_returns"
    | "fake_order"
    | "failed_validation"
    | "ip_limit_exceeded"
    | "low_success_ratio"
    | "other";

export type FraudFlagTriggerType = "manual" | "auto_layer2" | "auto_layer3";

export type FraudFlagStatus = "pending_review" | "confirmed_fraud" | "cleared";

export interface FraudFlagCustomer {
    id: number;
    name: string;
    phone: string | null;
}

export interface FraudFlagUser {
    id: number;
    name: string;
}

export interface FraudFlag {
    id: number;
    customer_id: number | null;
    customer: FraudFlagCustomer | null;
    phone: string;
    email: string | null;
    full_name_snapshot: string;
    address_snapshot: string | null;
    reason: FraudFlagReason;
    reason_note: string;
    trigger_type: FraudFlagTriggerType;
    related_sale_ids: number[] | null;
    status: FraudFlagStatus;
    flagged_by: number | null;
    flagged_by_user: FraudFlagUser | null;
    flagged_at: string;
    reviewed_by: number | null;
    reviewed_by_user: FraudFlagUser | null;
    reviewed_at: string | null;
    review_note: string | null;
    // is_pending / is_confirmed / is_cleared — appended accessors from backend
    is_pending: boolean;
    is_confirmed: boolean;
    is_cleared: boolean;
    created_at: string;
    updated_at: string;
}

export interface FraudFlagStats {
    total: number;
    pending_review: number;
    confirmed_fraud: number;
    cleared: number;
}

export interface FraudFlagFilters {
    search?: string;
    status?: FraudFlagStatus | "";
    trigger_type?: FraudFlagTriggerType | "";
    reason?: FraudFlagReason | "";
}

export interface FraudFlagCan {
    flag: boolean;
    review: boolean;
}

// Form payloads
export interface StoreFraudFlagFormData {
    customer_id: number | null;
    phone: string;
    email: string;
    full_name_snapshot: string;
    address_snapshot: string;
    reason: FraudFlagReason | "";
    reason_note: string;
    related_sale_ids: number[];
}

export interface ReviewFraudFlagFormData {
    action: "confirm" | "clear" | "";
    review_note: string;
}

// Inertia page props
export interface FraudFlagIndexProps {
    flags: {
        data: FraudFlag[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
            from: number | null;
            to: number | null;
        };
        links: { url: string | null; label: string; active: boolean }[];
    };
    stats: FraudFlagStats;
    filters: FraudFlagFilters;
    can: FraudFlagCan;
}
