// ─── Payment Status ───────────────────────────────────────────────────────

export type PaymentStatus =
    | "pending"
    | "partial"
    | "paid"
    | "deferred"
    | "reinvested"
    | "cancelled"
    | "reopened";

export type DistributionStatus = "draft" | "approved" | "distributed";

// ─── Payment Transaction ──────────────────────────────────────────────────

export interface ItemPayment {
    id: number;
    amount: number;
    payment_status: PaymentStatus;
    payment_status_label: string;
    payment_method: string | null;
    transaction_reference: string | null;
    note: string | null;
    paid_by_name: string | null;
    paid_at: string | null;
    created_at?: string;
    is_terminal: boolean;
    can_be_reopened: boolean;
}

// ─── Distribution Item ────────────────────────────────────────────────────

export interface DistributionItem {
    id: number;
    profit_distribution_id: number;
    investment_id: number;
    investor_name: string;
    investment_title: string;
    investment_type: string;
    invested_amount: number;
    share_percent: number;
    share_amount: number;
    distribution_percent: number;
    effective_amount: number;
    deferred_amount: number;
    reinvested_amount: number;
    total_paid: number;
    remaining_amount: number;
    carried_from_distribution_id: number | null;
    carried_from_no: string | null;
    is_carried_forward: boolean;
    payment_status: PaymentStatus;
    payment_method: string | null;
    transaction_reference: string | null;
    note: string | null;
    payments?: ItemPayment[];
}

// ─── Eligibility ──────────────────────────────────────────────────────────

export interface DistributionEligibility {
    id: number;
    profit_distribution_id: number;
    investment_id: number;
    investor_name: string;
    is_eligible: boolean;
    eligibility_reason: string | null;
    override_by: number | null;
    override_at: string | null;
    is_manual_override: boolean;
}

// ─── Distribution ─────────────────────────────────────────────────────────

export interface Distribution {
    id: number;
    distribution_no: string;
    title: string;
    distribution_date: string;
    period_start: string;
    period_end: string;
    total_revenue: number;
    total_cogs: number;
    total_expenses: number;
    total_investment: number;
    gross_profit: number;
    net_profit: number;
    distribution_percent: number;
    distributable_amount: number;
    status: DistributionStatus;
    is_locked: boolean;
    note: string | null;
    approved_by: number | null;
    approved_at: string | null;
    distributed_by: number | null;
    distributed_at: string | null;
    created_by: number;
    updated_by: number | null;
    created_at: string;
    updated_at: string;
    // Relations
    items?: DistributionItem[];
    eligibilities?: DistributionEligibility[];
    // Computed
    can_be_edited: boolean;
    can_be_approved: boolean;
    can_be_distributed: boolean;
    can_be_reversed: boolean;
    can_be_deleted: boolean;
    paid_items_count?: number;
    pending_items_count?: number;
    total_paid_amount?: number;
    // Legacy fields (from older Index listing page — kept optional for compatibility)
    items_count?: number;
    creator?: { id: number; name: string } | null;
}

// ─── Distribution Stats ───────────────────────────────────────────────────

export interface DistributionStats {
    total_distributions: number;
    draft_count: number;
    approved_count: number;
    distributed_count: number;
    total_distributed_amount: number;
    total_pending_payments: number;
    // Legacy aliases (from older Index listing page — kept optional for compatibility)
    total?: number;
    draft?: number;
    approved?: number;
    distributed?: number;
    total_distributed?: number;
}

// ─── Distribution Permissions ─────────────────────────────────────────────

export interface DistributionPermissions {
    create: boolean;
    edit: boolean;
    delete: boolean;
    restore: boolean;
    approve: boolean;
    reverse: boolean;
    payment: boolean;
    eligibility: boolean;
}

// ─── Investor Profit Balance ──────────────────────────────────────────────

export interface InvestorBalance {
    id: number;
    investment_id: number;
    investor_name: string;
    total_earned: number;
    total_paid: number;
    total_deferred: number;
    total_reinvested: number;
    pending_balance: number;
    roi?: number;
    has_pending?: boolean;
    investment?: {
        id: number;
        investor_name: string;
        amount: number;
        investment_date: string;
        status: string;
    };
}

export interface InvestorBalanceStats {
    total_earned: number;
    total_paid: number;
    total_deferred: number;
    total_reinvested: number;
    total_pending: number;
    investor_count: number;
}

// ─── Payment Summary ──────────────────────────────────────────────────────

export interface PaymentSummaryEntry {
    count: number;
    total: number;
    label: string;
}

export type PaymentSummary = Partial<
    Record<PaymentStatus, PaymentSummaryEntry>
>;

// ─── Item Summary (from API) ──────────────────────────────────────────────

export interface ItemSummary {
    investor_name: string;
    effective_amount: number;
    total_paid: number;
    remaining_amount: number;
    payment_status: PaymentStatus;
    deferred_amount: number;
    reinvested_amount: number;
}

// ─── Form Data ────────────────────────────────────────────────────────────

export interface RecordPaymentFormData {
    action: "pay" | "defer" | "reinvest";
    amount: string;
    payment_method: string;
    transaction_reference: string;
    note: string;
    [key: string]: string | number | null;
}

export interface ReverseDistributionFormData {
    reason: string;
    [key: string]: string | number | null;
}

export interface EligibilityOverrideFormData {
    is_eligible: boolean;
    eligibility_reason: string;
    [key: string]: string | number | boolean | null;
}

// ─── Paginator ────────────────────────────────────────────────────────────

export interface PaginatorMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface PaginatorLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    meta: PaginatorMeta;
    links: PaginatorLink[];
}
