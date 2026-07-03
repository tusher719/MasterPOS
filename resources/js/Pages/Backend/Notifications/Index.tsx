import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import {
    Bell,
    CheckCheck,
    Trash2,
    Package,
    ShoppingCart,
    Receipt,
} from "lucide-react";
import { Notification } from "@/types/notification";

interface PaginatedNotifications {
    data: Notification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    // Renamed from `notifications` -> `notificationList` to avoid colliding
    // with the globally-shared `notifications` Inertia prop (unread_count +
    // latest) that the topbar bell dropdown reads on every page.
    notificationList: PaginatedNotifications;
    filter: "all" | "read" | "unread";
    unreadCount: number;
}

const iconMap: Record<string, React.ReactNode> = {
    package: <Package size={15} />,
    "shopping-cart": <ShoppingCart size={15} />,
    receipt: <Receipt size={15} />,
};

const getIcon = (icon: string) => iconMap[icon] ?? <Bell size={15} />;

export default function NotificationsIndex({
    notificationList,
    filter,
    unreadCount,
}: Props) {
    const handleMarkRead = (id: string) => {
        router.post(
            route("backend.notifications.read", id),
            {},
            { preserveScroll: true },
        );
    };

    const handleMarkAllRead = () => {
        router.post(
            route("backend.notifications.read-all"),
            {},
            { preserveScroll: true },
        );
    };

    const handleDelete = (id: string) => {
        router.delete(route("backend.notifications.destroy", id), {
            preserveScroll: true,
        });
    };

    const handleFilter = (value: string) => {
        router.get(
            route("backend.notifications.index"),
            { filter: value },
            { preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Notifications" />

            <div className="space-y-5">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Notifications
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {unreadCount > 0
                                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                                : "All caught up!"}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <CheckCheck size={16} />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-xs font-medium text-gray-500">
                            Total
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-800">
                            {notificationList.total}
                        </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-xs font-medium text-gray-500">
                            Unread
                        </p>
                        <p className="mt-1 text-2xl font-bold text-indigo-600">
                            {unreadCount}
                        </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-xs font-medium text-gray-500">
                            Read
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-400">
                            {notificationList.total - unreadCount}
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 w-fit">
                    {(["all", "unread", "read"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleFilter(tab)}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                                filter === tab
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Notification List */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    {notificationList.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Bell size={36} className="mb-3 opacity-30" />
                            <p className="text-sm font-medium">
                                No notifications found
                            </p>
                            <p className="text-xs mt-1">
                                {filter !== "all"
                                    ? "Try switching the filter above"
                                    : "You are all caught up!"}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notificationList.data.map((n: Notification) => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50 ${
                                        !n.read_at ? "bg-indigo-50/30" : ""
                                    }`}
                                >
                                    {/* Unread dot */}
                                    <div className="mt-2 flex w-2 shrink-0 justify-center">
                                        {!n.read_at && (
                                            <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                        )}
                                    </div>

                                    {/* Icon */}
                                    <div
                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                            !n.read_at
                                                ? "bg-indigo-100 text-indigo-600"
                                                : "bg-gray-100 text-gray-400"
                                        }`}
                                    >
                                        {getIcon(n.data.icon)}
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p
                                                className={`text-sm font-semibold ${
                                                    !n.read_at
                                                        ? "text-gray-800"
                                                        : "text-gray-600"
                                                }`}
                                            >
                                                {n.data.title}
                                            </p>
                                            {!n.read_at && (
                                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">
                                            {n.data.message}
                                        </p>
                                        <div className="mt-1.5 flex items-center gap-3">
                                            <span className="text-xs text-gray-400">
                                                {n.created_at}
                                            </span>
                                            <span className="text-xs capitalize text-gray-300">
                                                · {n.data.module}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex shrink-0 items-center gap-1">
                                        {!n.read_at && (
                                            <button
                                                onClick={() =>
                                                    handleMarkRead(n.id)
                                                }
                                                title="Mark as read"
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                                            >
                                                <CheckCheck size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(n.id)}
                                            title="Delete"
                                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {notificationList.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Page {notificationList.current_page} of{" "}
                            {notificationList.last_page}
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={!notificationList.prev_page_url}
                                onClick={() =>
                                    router.get(notificationList.prev_page_url!)
                                }
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                disabled={!notificationList.next_page_url}
                                onClick={() =>
                                    router.get(notificationList.next_page_url!)
                                }
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
