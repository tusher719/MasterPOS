// ─── Enum types ───────────────────────────────────────────────────────────────

export type TaskStatus = "pending" | "in_progress" | "done" | "cancelled";
export type TaskItemStatus = "pending" | "ready" | "cancelled";

// ─── Core interfaces ──────────────────────────────────────────────────────────

export interface TaskItem {
    id: number;
    task_id: number;
    product_id: number;
    variant_id: number | null;
    quantity: string; // decimal serialized as string
    unit_cost: string | null;
    subtotal: number | null; // computed accessor
    note: string | null;
    status: TaskItemStatus;
    created_at: string;
    updated_at: string;
    product?: {
        id: number;
        name: string;
        sku: string;
    };
    variant?: {
        id: number;
        sku: string;
        attributes: Record<string, string>;
    } | null;
}

export interface ProductPlanningTask {
    id: number;
    title: string;
    note: string | null;
    status: TaskStatus;
    due_date: string | null;
    created_by: number;
    assigned_to: number | null;
    completed_by: number | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    items: TaskItem[];
    created_by_user?: { id: number; name: string } | null;
    assigned_to_user?: { id: number; name: string } | null;
    completed_by_user?: { id: number; name: string } | null;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface TaskStats {
    total: number;
    pending: number;
    in_progress: number;
    done: number;
    cancelled: number;
    overdue: number;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface TaskFilters {
    search?: string;
    status?: string;
    assigned_to?: string;
    trashed?: boolean;
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export interface TaskCan {
    create: boolean;
    edit: boolean;
    delete: boolean;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface TaskPaginatedData {
    data: ProductPlanningTask[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

// ─── Page props ───────────────────────────────────────────────────────────────

export interface TaskIndexProps {
    tasks: TaskPaginatedData;
    stats: TaskStats;
    staffOptions: { id: number; name: string }[];
    products: ProductOption[];
    filters: TaskFilters;
    can: TaskCan;
}

// ─── Product option for item rows ─────────────────────────────────────────────

export interface ProductOption {
    id: number;
    name: string;
    sku: string;
    cost_price: string;
    has_variants: boolean;
    active_variants: VariantOption[];
}

export interface VariantOption {
    id: number;
    sku: string;
    attributes: Record<string, string>;
    cost_price_override: string | null;
}

// ─── Form data ────────────────────────────────────────────────────────────────

export interface TaskItemFormData {
    id?: number;
    product_id: number | "";
    variant_id: number | null;
    quantity: string;
    unit_cost: string;
    note: string;
    status: TaskItemStatus;
}

export interface TaskFormData {
    title: string;
    note: string;
    due_date: string;
    assigned_to: number | "";
    items: TaskItemFormData[];
}

export interface UpdateStatusFormData {
    status: TaskStatus;
    note: string;
}
