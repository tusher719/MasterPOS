// Investor Statement — TypeScript type definitions
// Used by: InvestorStatements/Index.tsx, Show.tsx, and all _components/

export interface StatementInvestmentInfo {
    id: number;
    investor_name: string;
    title: string;
    investment_type: string | null;
    investment_date: string;
    reference: string | null;
    status: "active" | "withdrawn";
    amount: number;
}

export interface StatementCapitalSummary {
    current_balance: number;
    total_deposited: number;
    total_withdrawn: number;
    total_reinvested: number;
    total_adjusted: number;
}

export interface StatementProfitSummary {
    total_earned: number;
    total_paid: number;
    total_deferred: number;
    total_reinvested: number;
    pending_balance: number;
}

export interface StatementDistributionItem {
    id: number;
    distribution_no: string | null;
    title: string | null;
    distribution_date: string | null;
    period_start: string | null;
    period_end: string | null;
    distribution_status: "approved" | "distributed";
    share_percent: number;
    share_amount: number;
    deferred_amount: number;
    reinvested_amount: number;
    payment_status:
        | "pending"
        | "partial"
        | "paid"
        | "deferred"
        | "reinvested"
        | "cancelled"
        | "reopened";
    note: string | null;
}

export interface StatementCapitalEntry {
    id: number;
    reference_no: string | null;
    transaction_type: "deposit" | "withdrawal" | "reinvestment" | "adjustment";
    direction: "credit" | "debit";
    amount: number;
    running_balance: number;
    reason: string | null;
    note: string | null;
    status: "completed" | "pending" | "approved" | "rejected" | "cancelled";
    created_at: string;
}

// Full statement — used in Show.tsx
export interface InvestorStatement {
    investment: StatementInvestmentInfo;
    capital_summary: StatementCapitalSummary;
    profit_summary: StatementProfitSummary;
    distribution_history: StatementDistributionItem[];
    capital_transactions: StatementCapitalEntry[];
}

// Index page — summary row per investor
export interface InvestorStatementSummary {
    id: number;
    investor_name: string;
    title: string;
    investment_type: string | null;
    investment_date: string;
    status: "active" | "withdrawn";
    amount: number;
    capital: {
        current_balance: number;
        total_deposited: number;
        total_withdrawn: number;
        total_reinvested: number;
        total_adjusted: number;
    };
    profit: {
        pending_balance: number;
        total_earned: number;
        total_paid: number;
        total_deferred: number;
        total_reinvested: number;
    };
}

// Shared can[] prop
export interface InvestorStatementCan {
    view: boolean;
    export: boolean;
}
