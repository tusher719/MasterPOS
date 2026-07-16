export type UsableType = "purchase" | "expense";

// ─── Core Entity ──────────────────────────────────────────────────

export interface FundUsage {
    id: number;
    capital_ledger_entry_id: number;
    usable_type: UsableType;
    usable_id: number;
    usable_label: string; // 'Purchase' | 'Expense'
    usable_title: string; // reference_no or expense title
    amount: string; // decimal — always wrap in Number()
    note: string | null;
    created_by_name: string;
    created_at: string;
}

// ─── Form Data ────────────────────────────────────────────────────

export interface FundUsageFormData {
    usable_type: UsableType | "";
    usable_id: number | "";
    amount: string;
    note: string;
}

// ─── Dropdown Options ─────────────────────────────────────────────

export interface PurchaseOption {
    id: number;
    label: string; // "REF-001 — 5,000.00 BDT"
    grand_total: number;
    purchase_date: string;
}

export interface ExpenseOption {
    id: number;
    label: string; // "Office Rent — 3,000.00 BDT"
    amount: number;
    expense_date: string;
}

// ─── Panel Props ──────────────────────────────────────────────────

export interface FundUsagePanelProps {
    entryId: number;
    entryAmount: number;
    linkedAmount: number;
    remainingAmount: number;
    usages: FundUsage[];
    purchases: PurchaseOption[];
    expenses: ExpenseOption[];
    can: FundUsageCan;
}

// ─── Permissions ──────────────────────────────────────────────────

export interface FundUsageCan {
    create: boolean;
    delete: boolean;
}
