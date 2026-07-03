export interface NotificationData {
    title: string;
    message: string;
    icon: string;
    module: string;
    reference_id: number;
    url: string;
}

export interface Notification {
    id: string;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
}

export interface NotificationShared {
    unread_count: number;
    latest: Notification[];
}
