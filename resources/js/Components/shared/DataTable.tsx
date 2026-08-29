import { Link } from "@inertiajs/react";
import { ReactNode } from "react";

interface Column<T> {
    header: string;
    accessor: (row: T) => ReactNode;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    links?: PaginationLink[];
}

export default function DataTable<T>({
    columns,
    data,
    links,
}: DataTableProps<T>) {
    return (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                    <tr>
                        {columns.map((col, i) => (
                            <th
                                key={i}
                                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-6 text-center text-sm text-muted-foreground"
                            >
                                No records found
                            </td>
                        </tr>
                    ) : (
                        data.map((row, i) => (
                            <tr key={i} className="hover:bg-muted/40">
                                {columns.map((col, j) => (
                                    <td
                                        key={j}
                                        className="px-4 py-3 text-sm text-foreground"
                                    >
                                        {col.accessor(row)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {links && links.length > 3 && (
                <div className="flex flex-wrap gap-1 border-t border-border px-4 py-3">
                    {links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? "#"}
                            preserveScroll
                            className={`rounded px-3 py-1 text-sm ${
                                link.active
                                    ? "bg-indigo-600 text-white"
                                    : "text-foreground hover:bg-muted"
                            } ${!link.url ? "pointer-events-none opacity-40" : ""}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
