export interface Role {
    id: number;
    name: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: "active" | "inactive";
    avatar: string | null;
    roles: Role[];
    created_at: string;
    // Nullable — null means user has never been seen after this feature was added
    last_seen_at: string | null;
}

export interface PaginatedUsers {
    data: User[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
}
