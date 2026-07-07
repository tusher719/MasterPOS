export interface Distribution {
    id: number;
    distribution_no: string;
    title: string;
    distribution_date: string;
    period_start: string;
    period_end: string;
    total_revenue: string;
    total_expenses: string;
    net_profit: string;
    distributable_amount: string;
    distribution_percent: string;
    status: "draft" | "approved" | "distributed";
    is_locked: boolean;
    items_count: number;
    created_at: string;
    creator: { id: number; name: string } | null;
}

export interface DistributionStats {
    total: number;
    draft: number;
    approved: number;
    distributed: number;
    total_distributed: string;
}

export interface DistributionPermissions {
    create: boolean;
    edit: boolean;
    delete: boolean;
    restore: boolean;
    approve: boolean;
}
