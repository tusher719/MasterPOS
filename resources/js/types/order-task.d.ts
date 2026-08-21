// ─── Enum types ───────────────────────────────────────────────────────────────

export type OrderTaskSource =
    | "facebook"
    | "instagram"
    | "whatsapp"
    | "phone"
    | "website"
    | "other";

export type OrderTaskPriority = "urgent" | "normal" | "flexible";

export type OrderTaskAssignmentType = "assigned" | "open";

export type OrderTaskStatus =
    | "pending"
    | "claimed"
    | "in_progress"
    | "ready"
    | "converted_to_sale"
    | "cancelled";

// ─── Core model ───────────────────────────────────────────────────────────────

export interface OrderTask {
    id: number;
    title: string;
    customer_name_snapshot: string;
    customer_phone_snapshot: string | null;
    source: OrderTaskSource;
    priority: OrderTaskPriority;
    due_date: string | null; // YYYY-MM-DD
    note: string | null;
    assignment_type: OrderTaskAssignmentType;
    assigned_to: number | null;
    claimed_by: number | null;
    claimed_at: string | null;
    status: OrderTaskStatus;
    linked_sale_id: number | null;
    created_by: number;
    completed_by: number | null;
    completed_at: string | null;
    started_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Eager loaded relations
    assigned_to_user: { id: number; name: string } | null;
    claimed_by_user: { id: number; name: string } | null;
    created_by_user: { id: number; name: string } | null;
    completed_by_user: { id: number; name: string } | null;
    linked_sale: { id: number; reference_no: string } | null;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface OrderTaskStats {
    total: number;
    pending: number;
    in_progress: number;
    ready: number;
    overdue: number;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface OrderTaskFilters {
    search?: string;
    status?: OrderTaskStatus | "";
    priority?: OrderTaskPriority | "";
    source?: OrderTaskSource | "";
    assignment_type?: OrderTaskAssignmentType | "";
    my_tasks?: boolean;
    overdue?: boolean;
}

// ─── Can (permissions) ────────────────────────────────────────────────────────

export interface OrderTaskCan {
    create: boolean;
    assign: boolean;
    claim: boolean;
    complete: boolean;
    delete: boolean;
}

// ─── Staff option for assign dropdown ────────────────────────────────────────

export interface StaffOption {
    id: number;
    name: string;
}

// ─── Form data ────────────────────────────────────────────────────────────────

export interface CreateOrderTaskFormData {
    title: string;
    customer_name_snapshot: string;
    customer_phone_snapshot: string;
    source: OrderTaskSource | "";
    priority: OrderTaskPriority;
    due_date: string;
    note: string;
    assignment_type: OrderTaskAssignmentType;
    assigned_to: number | "";
}

export interface UpdateStatusFormData {
    status: "in_progress" | "ready" | "cancelled";
    note: string;
}

export interface AssignFormData {
    assigned_to: number | "";
    assignment_type: OrderTaskAssignmentType;
}

export interface ConvertToSaleFormData {
    linked_sale_id: number | "";
}

// ─── Page props ───────────────────────────────────────────────────────────────

export interface OrderTaskIndexProps {
    tasks: {
        data: OrderTask[];
        meta?: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
            from: number | null;
            to: number | null;
        };
        links?: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
    stats: OrderTaskStats;
    staffList: StaffOption[];
    filters: OrderTaskFilters;
    can: OrderTaskCan;
}
