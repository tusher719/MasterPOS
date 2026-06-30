import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/shared/DataTable";
import { Head } from "@inertiajs/react";
import { LoginHistoryItem } from "@/types/log";

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
}

export default function Index({
    histories,
}: {
    histories: Paginated<LoginHistoryItem>;
}) {
    return (
        <AuthenticatedLayout>
            <Head title="Login History" />
            <div className="space-y-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Login History
                    </h1>
                    <p className="text-sm text-gray-500">
                        Record of who logged in, when, and from where
                    </p>
                </div>

                <DataTable<LoginHistoryItem>
                    columns={[
                        {
                            header: "User",
                            accessor: (h) => h.user?.name ?? "Deleted User",
                        },
                        {
                            header: "Email",
                            accessor: (h) => h.user?.email ?? "-",
                        },
                        {
                            header: "IP Address",
                            accessor: (h) => h.ip_address ?? "-",
                        },
                        {
                            header: "Device / Browser",
                            accessor: (h) => (
                                <span className="line-clamp-1 max-w-xs text-xs text-gray-500">
                                    {h.user_agent ?? "-"}
                                </span>
                            ),
                        },
                        {
                            header: "Time",
                            accessor: (h) => {
                                const date = new Date(
                                    h.logged_in_at,
                                ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                });
                                const time = new Date(
                                    h.logged_in_at,
                                ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true,
                                });
                                return `${date}, ${time}`;
                            },
                        },
                    ]}
                    data={histories.data}
                    links={histories.links}
                />
            </div>
        </AuthenticatedLayout>
    );
}
