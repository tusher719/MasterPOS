export interface LoginHistoryItem {
    id: number;
    ip_address: string | null;
    user_agent: string | null;
    logged_in_at: string;
    user: { id: number; name: string; email: string } | null;
}

export interface ActivityLogItem {
    id: number;
    module: string;
    action: string;
    description: string | null;
    created_at: string;
    user: { id: number; name: string } | null;
}
