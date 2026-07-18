// Engine output interfaces for Phase 4F Profit Calculation Engine.
// Runtime color/label maps go in profit-calculation-colors.ts — never here.

// ─── Source Type ──────────────────────────────────────────────────────────────

export type SourceType = "investment_based" | "partner_based";

// ─── Rule Snapshot ────────────────────────────────────────────────────────────

export interface ProfitRuleSnapshot {
    id?: number;
    rule_type: string;
    profit_source?: string;
    share_percent?: number;
    effective_from?: string;
    effective_to?: string | null;
    approved_by?: number;
    approved_at?: string;
    // Capital-based legacy fields
    invested_amount?: number;
    total_investment?: number;
    period_start?: string;
    note?: string;
    // Mixed strategy
    sub_strategies?: string[];
}

// ─── Product Breakdown (product_based / mixed strategies) ─────────────────────

export interface ProductBreakdownItem {
    product_id: number;
    product_name: string;
    qty_sold: number;
    total_revenue: number;
    total_cost: number;
    product_profit: number;
    partner_profit: number;
    cost_return: number;
}

// ─── Already Paid Info (Gap 4.4) ──────────────────────────────────────────────

export interface AlreadyPaidInfo {
    /** The date up to which this partner was already paid (inclusive) */
    paid_up_to: string;
    /** paid_up_to + 1 day — the first day of the remaining unpaid window */
    paid_up_to_next_day: string;
    /** Distribution number of the prior settled distribution e.g. PD-2026-000001 */
    distribution_no: string;
}

// ─── Effective Period Info (Gap 4.5) ──────────────────────────────────────────

export interface EffectivePeriodInfo {
    /** Computed effective start for this partner (may differ from selected_start) */
    start: string;
    /** Computed effective end for this partner (may differ from selected_end) */
    end: string;
    /** The admin-selected period_start */
    selected_start: string;
    /** The admin-selected period_end */
    selected_end: string;
    /**
     * Human-readable note explaining why the effective period differs from the selected period.
     * null when no adjustment was made (full selected period applies).
     * Example: "Jul 1–31 already paid via PD-2026-000001; Eligibility starts Jul 7"
     */
    adjustment_reason: string | null;
    /** Prior payment info that caused the start to be pushed forward — null if none */
    last_paid_info: AlreadyPaidInfo | null;
    /**
     * Financial summary computed for this specific effective period.
     * null for ineligible partners.
     */
    financial_summary: {
        total_revenue: number;
        total_cogs: number;
        total_expenses: number;
        total_investment: number;
        gross_profit: number;
        net_profit: number;
        distribution_percent: number;
        distributable_amount: number;
    } | null;
}

// ─── Partner Preview Item (partner_based) ────────────────────────────────────

export interface PartnerPreviewItem {
    partner_id: number;
    partner_name: string;
    partner_code: string;
    rule_type: string | null;
    profit_source: string | null;
    share_percent: number;
    share_amount: number;
    cost_return_amount: number;
    settlement_type: string | null;
    payment_preference: string | null;
    profit_rule_snapshot: ProfitRuleSnapshot;
    is_eligible: boolean;
    eligibility_reason: string | null;
    product_breakdown?: ProductBreakdownItem[];
    /**
     * Effective period info for this partner — always present for partner_based distributions.
     * null only for investment_based items.
     */
    effective_period?: EffectivePeriodInfo | null;
    // extra note field editable on frontend before store
    note?: string | null;
    [key: string]:
        | string
        | number
        | boolean
        | null
        | undefined
        | ProfitRuleSnapshot
        | ProductBreakdownItem[]
        | EffectivePeriodInfo;
}

// ─── Investment Preview Item (investment_based — legacy) ──────────────────────

export interface InvestmentPreviewItem {
    investment_id: number;
    investor_name: string;
    investment_title: string;
    investment_type: string;
    invested_amount: number;
    share_percent: number;
    share_amount: number;
    note: string | null;
    [key: string]: string | number | null;
}

// ─── Engine Preview Response ──────────────────────────────────────────────────

export interface EnginePreviewData {
    total_revenue: number;
    total_cogs: number;
    total_expenses: number;
    total_investment: number;
    gross_profit: number;
    net_profit: number;
    distribution_percent: number;
    distributable_amount: number;
    source_type: SourceType;
    items: PartnerPreviewItem[] | InvestmentPreviewItem[];
}

// ─── Form State ───────────────────────────────────────────────────────────────

export interface CalculationFormData {
    title: string;
    distribution_date: string;
    period_start: string;
    period_end: string;
    distribution_percent: string;
    distributable_amount: string;
    source_type: SourceType;
    note: string;
    // Financial snapshots — filled after calculate
    total_revenue: string;
    total_cogs: string;
    total_expenses: string;
    total_investment: string;
    gross_profit: string;
    net_profit: string;
    items: PartnerPreviewItem[] | InvestmentPreviewItem[];
}
