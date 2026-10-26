import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/shared/DataTable";
import { Head, router } from "@inertiajs/react";
import { ActivityLogItem } from "@/types/log";

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
}

const actionColor: Record<string, string> = {
    created: "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400",
    updated: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    deleted: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export default function Index({
    logs,
    modules,
    filters,
}: {
    logs: Paginated<ActivityLogItem>;
    modules: string[];
    filters: { module?: string };
}) {
    const filterByModule = (module: string) => {
        router.get(
            route("backend.activity-logs.index"),
            module ? { module } : {},
            { preserveState: true },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Activity Log" />
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Activity Log
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            History of who did what action in the system
                        </p>
                    </div>
                    <select
                        value={filters.module ?? ""}
                        onChange={(e) => filterByModule(e.target.value)}
                        className="rounded-md border-border bg-input text-foreground text-sm focus:border-primary focus:ring-primary"
                    >
                        <option value="">All Module</option>
                        {modules.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>

                <DataTable<ActivityLogItem>
                    columns={[
                        {
                            header: "User",
                            accessor: (l) => l.user?.name ?? "System",
                        },
                        {
                            header: "Module",
                            accessor: (l) => (
                                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground capitalize">
                                    {l.module}
                                </span>
                            ),
                        },
                        {
                            header: "Action",
                            accessor: (l) => (
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${actionColor[l.action] ?? "bg-muted text-muted-foreground"}`}
                                >
                                    {l.action}
                                </span>
                            ),
                        },
                        {
                            header: "Description",
                            accessor: (l) => l.description ?? "-",
                        },
                        {
                            header: "Time",
                            accessor: (l) => {
                                const date = new Date(
                                    l.created_at,
                                ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                });
                                const time = new Date(
                                    l.created_at,
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
                    data={logs.data}
                    links={logs.links}
                />
            </div>
        </AuthenticatedLayout>
    );
}
