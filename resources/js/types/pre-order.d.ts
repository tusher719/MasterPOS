// resources/js/types/pre-order.d.ts

export type PreOrderStatus =
    | "pending"
    | "confirmed"
    | "ready"
    | "delivered"
    | "cancelled";

export interface PreOrder {
    id: number;
    customer_id: number | null;
    customer_name_snapshot: string;
    customer_phone_snapshot: string | null;
    product_id: number | null;
    product_name_snapshot: string | null;
    booking_date: string; // YYYY-MM-DD
    expected_delivery_date: string | null;
    total_amount: string; // decimal — always wrap in Number()
    advance_amount: string; // decimal — always wrap in Number()
    due_amount: string; // decimal — always wrap in Number()
    advance_payment_method: string | null;
    advance_transaction_id: string | null;
    advance_payment_proof: string | null;
    status: PreOrderStatus;
    linked_sale_id: number | null;
    note: string | null;
    created_by: number;
    updated_by: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Eager loaded relations
    customer?: {
        id: number;
        name: string;
        phone: string | null;
    } | null;
    product?: {
        id: number;
        name: string;
    } | null;
    linked_sale?: {
        id: number;
        reference_no: string;
    } | null;
    created_by_user?: {
        id: number;
        name: string;
    } | null;
}

export interface PreOrderStats {
    total: number;
    pending: number;
    confirmed: number;
    ready: number;
    delivered: number;
    cancelled: number;
    overdue: number;
}

export interface PreOrderFilters {
    search?: string;
    status?: PreOrderStatus | "";
    date_from?: string;
    date_to?: string;
    trashed?: "only" | "";
}

export interface PreOrderCan {
    create: boolean;
    manage: boolean;
}

export interface PreOrderPaginatedData {
    data: PreOrder[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface PreOrderIndexProps {
    preOrders: PreOrderPaginatedData;
    stats: PreOrderStats;
    filters: PreOrderFilters;
    can: PreOrderCan;
}

// ── Form payloads ─────────────────────────────────────────────────────────────

export interface PreOrderFormData {
    customer_id: number | null;
    customer_name_snapshot: string;
    customer_phone_snapshot: string;
    product_id: number | null;
    product_name_snapshot: string;
    booking_date: string;
    expected_delivery_date: string;
    total_amount: string;
    advance_amount: string;
    advance_payment_method: string;
    advance_transaction_id: string;
    note: string;
    [key: string]: string | number | null; // index signature for Inertia router
}

export interface UpdateStatusFormData {
    status: PreOrderStatus;
    note: string;
}

export interface ConvertToSaleFormData {
    sale_id: number | null;
}

// ── Customer / Product options for dropdowns ──────────────────────────────────

export interface CustomerOption {
    id: number;
    name: string;
    phone: string | null;
}

export interface ProductOption {
    id: number;
    name: string;
    sale_price: string;
}
