import { PageProps } from "@/types";

// -------------------------------------------------------------------------
// Core Entities
// -------------------------------------------------------------------------

export interface Partner {
    id: number;
    name: string;
    code: string | null;
    partner_type_capital: boolean;
    partner_type_working: boolean;
    partner_type_product: boolean;
    phone: string | null;
    email: string | null;
    address: string | null;
    user_id: number | null;
    note: string | null;
    is_active: boolean;
    created_by: number;
    updated_by: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Accessors
    type_labels: string;
    has_type: boolean;

    // Relations (optional — only when loaded)
    user?: PartnerUser | null;
    created_by_user?: PartnerUser | null;
    updated_by_user?: PartnerUser | null;
    investments?: PartnerLinkedInvestment[];
}

export interface PartnerInvestment {
    id: number;
    partner_id: number;
    investment_id: number;
    is_primary: boolean;
    note: string | null;
    created_at: string;
    updated_at: string;

    // Relations (optional)
    partner?: Partner;
    investment?: PartnerLinkedInvestment;
}

export interface PartnerLinkedInvestment {
    id: number;
    title: string;
    investor_name: string;
    amount: string; // decimal serialized as string
    status: "active" | "withdrawn";
    investment_date: string;

    // Pivot fields (when loaded via BelongsToMany)
    pivot?: {
        id: number;
        is_primary: boolean;
        note: string | null;
    };
}

export interface PartnerUser {
    id: number;
    name: string;
    email?: string;
    deleted_at?: string | null;
}

export interface InvestmentOption {
    id: number;
    title: string;
    investor_name: string;
    amount: string; // decimal serialized as string
}

// -------------------------------------------------------------------------
// Profit Rules
// -------------------------------------------------------------------------

export type RuleType =
    | "fixed_percent"
    | "product_based"
    | "capital_based"
    | "mixed";

export type ProfitSource =
    | "capital_share"
    | "working_share"
    | "product_share"
    | "custom";

export type RuleChangeType = "created" | "updated" | "approved" | "deactivated";

export interface PartnerProfitRule {
    id: number;
    partner_id: number;
    rule_type: RuleType;
    profit_source: ProfitSource;
    share_percent: string; // decimal serialized as string — always wrap in Number()
    effective_from: string; // YYYY-MM-DD
    effective_to: string | null; // null = currently active
    is_active: boolean;
    reason: string | null;
    approved_by: number | null;
    approved_at: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    // Accessors
    is_pending: boolean;
    is_approved: boolean;
    is_currently_active: boolean;
    // Relations (when eager loaded)
    approved_by_user?: PartnerUser | null;
    created_by_user?: PartnerUser | null;
    history?: PartnerProfitRuleHistory[];
}

export interface PartnerProfitRuleHistory {
    id: number;
    partner_profit_rule_id: number;
    changed_by: number;
    change_type: RuleChangeType;
    previous_value: Record<string, unknown> | null;
    new_value: Record<string, unknown>;
    change_reason: string;
    created_at: string;
    updated_at: string;
    // Relations (when eager loaded)
    changed_by_user?: PartnerUser | null;
}

export interface ProfitRuleFormData {
    rule_type: RuleType | "";
    profit_source: ProfitSource | "";
    share_percent: string;
    effective_from: string;
    reason: string;
}

export interface ProfitRuleCan {
    view: boolean;
    create: boolean;
    edit: boolean;
    approve: boolean;
}

// -------------------------------------------------------------------------
// Profit Eligibility
// -------------------------------------------------------------------------

export type EligibilityStatus = "active" | "paused" | "ended";

export interface PartnerEligibility {
    id: number;
    partner_id: number;
    profit_start_date: string; // YYYY-MM-DD
    profit_end_date: string | null; // null = ongoing
    status: EligibilityStatus;
    pause_reason: string | null;
    paused_by: number | null;
    paused_at: string | null;
    resumed_by: number | null;
    resumed_at: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;

    // Accessors
    is_active: boolean;
    is_paused: boolean;
    is_ended: boolean;
    is_ongoing: boolean;

    // Relations (when eager loaded)
    creator?: PartnerUser | null;
    paused_by_user?: PartnerUser | null;
    resumed_by_user?: PartnerUser | null;
}

export interface EligibilityFormData {
    profit_start_date: string;
    profit_end_date: string;
}

export interface PauseEligibilityFormData {
    pause_reason: string;
}

export interface ResumeEligibilityFormData {
    resume_date: string;
    profit_end_date: string;
}

export interface EligibilityCan {
    view: boolean;
    create: boolean;
    pause: boolean;
    resume: boolean;
}

// -------------------------------------------------------------------------
// Filters & Stats
// -------------------------------------------------------------------------

export interface PartnerFilters {
    search?: string;
    type?: "capital" | "working" | "product" | "";
    status?: "active" | "inactive" | "";
    trashed?: "1" | "";
}

export interface PartnerStats {
    total: number;
    active: number;
    capital: number;
    working: number;
    product: number;
}

// -------------------------------------------------------------------------
// Can (Permissions)
// -------------------------------------------------------------------------

export interface PartnerCan {
    create: boolean;
    edit: boolean;
    delete: boolean;
    restore: boolean;
    forceDelete: boolean;
}

// -------------------------------------------------------------------------
// Paginator
// -------------------------------------------------------------------------

export interface PartnerPaginatedData {
    data: Partner[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
}

// -------------------------------------------------------------------------
// Page Props
// -------------------------------------------------------------------------

export interface PartnerIndexProps extends PageProps {
    partners: PartnerPaginatedData;
    filters: PartnerFilters;
    stats: PartnerStats;
    investmentOptions: InvestmentOption[];
    can: PartnerCan;
}

export interface PartnerShowProps extends PageProps {
    partner: Partner;
    investmentOptions: InvestmentOption[];
    profitRules: PartnerProfitRule[];
    eligibilities: PartnerEligibility[];
    settlementConfigs: PartnerSettlementConfig[];
    can: PartnerCan;
    profitRuleCan: ProfitRuleCan;
    eligibilityCan: EligibilityCan;
    settlementConfigCan: SettlementConfigCan;
}

// -------------------------------------------------------------------------
// Form Data
// -------------------------------------------------------------------------

export interface PartnerFormData {
    name: string;
    partner_type_capital: boolean;
    partner_type_working: boolean;
    partner_type_product: boolean;
    phone: string;
    email: string;
    address: string;
    user_id: string;
    note: string;
    is_active: boolean;
}

export interface LinkInvestmentFormData {
    investment_id: string;
    is_primary: boolean;
    note: string;
}

// -------------------------------------------------------------------------
// Settlement Config
// -------------------------------------------------------------------------

export type SettlementType = "profit_only" | "cost_plus_profit" | "custom";

export type PaymentPreference =
    | "cash"
    | "bank_transfer"
    | "adjustment"
    | "reinvestment";

export interface PartnerSettlementConfig {
    id: number;
    partner_id: number;
    settlement_type: SettlementType;
    payment_preference: PaymentPreference;
    auto_cost_return: boolean;
    notes: string | null;
    is_active: boolean;
    created_by: number;
    created_at: string;
    updated_at: string;

    // Accessors
    settlement_type_label: string;
    payment_preference_label: string;

    // Relations (when eager loaded)
    created_by_user?: PartnerUser | null;
}

export interface SettlementConfigFormData {
    settlement_type: SettlementType | "";
    payment_preference: PaymentPreference | "";
    auto_cost_return: boolean;
    notes: string;
}

export interface SettlementConfigCan {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}
