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
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((col, i) => (
                            <th
                                key={i}
                                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-6 text-center text-sm text-gray-400"
                            >
                                কোনো তথ্য পাওয়া যায়নি
                            </td>
                        </tr>
                    ) : (
                        data.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                {columns.map((col, j) => (
                                    <td
                                        key={j}
                                        className="px-4 py-3 text-sm text-gray-700"
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
                <div className="flex flex-wrap gap-1 border-t border-gray-100 px-4 py-3">
                    {links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? "#"}
                            preserveScroll
                            className={`rounded px-3 py-1 text-sm ${
                                link.active
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                            } ${!link.url ? "pointer-events-none opacity-40" : ""}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
