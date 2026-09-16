// Types for Purchase Return / Damage-Wastage Tracking module

export type PurchaseReturnStatus = "draft" | "confirmed";
export type PurchaseReturnType = "supplier_return" | "damage_wastage";

export interface PurchaseReturnItem {
    id: number;
    purchase_return_id: number;
    product_id: number;
    variant_id: number | null;
    quantity: string; // decimal — always wrap in Number() before arithmetic
    unit_cost: string; // decimal — always wrap in Number() before arithmetic
    subtotal: string; // decimal — always wrap in Number() before arithmetic
    reason_note: string | null;
    product?: {
        id: number;
        name: string;
        sku: string;
        stock_qty: string;
    };
    variant?: {
        id: number;
        sku: string;
        attributes: Record<string, string>;
        stock_qty: string;
    };
}

export interface PurchaseReturn {
    id: number;
    purchase_id: number;
    return_date: string; // YYYY-MM-DD
    return_type: PurchaseReturnType;
    reason: string;
    note: string | null;
    status: PurchaseReturnStatus;
    total_return_value: string; // decimal
    confirmed_by: number | null;
    confirmed_at: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    items_count?: number;
    purchase?: {
        id: number;
        reference_no: string;
        supplier?: {
            id: number;
            name: string;
        };
    };
    items?: PurchaseReturnItem[];
    created_by_user?: {
        id: number;
        name: string;
    };
    confirmed_by_user?: {
        id: number;
        name: string;
    };
}

export interface PurchaseReturnStats {
    total: number;
    draft: number;
    confirmed: number;
    supplier_returns: number;
    damage_wastage: number;
}

export interface PurchaseReturnFilters {
    search?: string;
    status?: PurchaseReturnStatus | "";
    return_type?: PurchaseReturnType | "";
    date_from?: string;
    date_to?: string;
    trashed?: string;
}

export interface PurchaseReturnCan {
    create: boolean;
    confirm: boolean;
    delete: boolean;
}

export interface PurchaseReturnPaginatedData {
    data: PurchaseReturn[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    links: {
        prev: string | null;
        next: string | null;
    };
}

export interface PurchaseReturnIndexProps {
    returns: PurchaseReturnPaginatedData;
    stats: PurchaseReturnStats;
    filters: PurchaseReturnFilters;
    can: PurchaseReturnCan;
}

// Form data for creating a new return
export interface ReturnItemFormData {
    product_id: number | "";
    variant_id: number | null;
    quantity: string;
    unit_cost: string;
    reason_note: string;
    // UI-only helpers — not sent to backend
    product_name?: string;
    variant_label?: string;
    max_quantity?: number; // available qty guard
}

export interface CreateReturnFormData {
    purchase_id: number | "";
    return_date: string;
    return_type: PurchaseReturnType | "";
    reason: string;
    note: string;
    items: ReturnItemFormData[];
}

// Purchase option for the purchase selector dropdown
export interface PurchaseOption {
    id: number;
    reference_no: string;
    supplier_name: string;
    purchase_date: string;
    grand_total: string;
    items: PurchaseItemOption[];
}

export interface PurchaseItemOption {
    id: number;
    product_id: number;
    product_name: string;
    variant_id: number | null;
    variant_label: string | null;
    quantity: number;
    unit_cost: string;
    available_qty: number; // quantity minus already-returned qty
}
