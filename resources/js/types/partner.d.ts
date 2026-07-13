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
}

export interface InvestmentOption {
    id: number;
    title: string;
    investor_name: string;
    amount: string; // decimal serialized as string
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
    can: PartnerCan;
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
