import { router } from "@inertiajs/react";
import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import { Pencil, Trash2, RotateCcw, Search, Filter } from "lucide-react";

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string;
    opening_balance: string;
    is_active: boolean;
    deleted_at: string | null;
    created_at: string;
}

interface Filters {
    search?: string;
    status?: string;
    trashed?: string;
}

interface Can {
    create: boolean;
    edit: boolean;
    delete: boolean;
    restore: boolean;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
}

interface Props {
    customers: Paginated<Customer>;
    filters: Filters;
    can: Can;
    onEdit: (customer: Customer) => void;
}

export default function CustomerTable({
    customers,
    filters,
    can,
    onEdit,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [trashed, setTrashed] = useState(filters.trashed === "true");

    const applyFilters = useCallback(
        (
            overrides: Partial<{
                search: string;
                status: string;
                trashed: boolean;
            }>,
        ) => {
            const next = {
                search:
                    overrides.search !== undefined ? overrides.search : search,
                status:
                    overrides.status !== undefined ? overrides.status : status,
                trashed:
                    overrides.trashed !== undefined
                        ? overrides.trashed
                        : trashed,
            };
            router.get(
                route("backend.customers.index"),
                {
                    ...(next.search ? { search: next.search } : {}),
                    ...(next.status ? { status: next.status } : {}),
                    ...(next.trashed ? { trashed: "true" } : {}),
                },
                { preserveState: true, replace: true },
            );
        },
        [search, status, trashed],
    );

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters({ search });
    }

    function handleStatusChange(val: string) {
        setStatus(val);
        applyFilters({ status: val });
    }

    function handleTrashedToggle() {
        const next = !trashed;
        setTrashed(next);
        applyFilters({ trashed: next });
    }

    function handleDelete(customer: Customer) {
        Swal.fire({
            title: "Delete Customer?",
            text: `"${customer.name}" will be moved to trash.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
            confirmButtonColor: "#ef4444",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("backend.customers.destroy", customer.id), {
                    preserveScroll: true,
                });
            }
        });
    }

    function handleRestore(customer: Customer) {
        Swal.fire({
            title: "Restore Customer?",
            text: `"${customer.name}" will be restored.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, restore",
            confirmButtonColor: "#4f46e5",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route("backend.customers.restore", customer.id),
                    {},
                    { preserveScroll: true },
                );
            }
        });
    }

    function goToPage(url: string | null) {
        if (url) router.get(url, {}, { preserveState: true });
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                <form
                    onSubmit={handleSearch}
                    className="flex items-center gap-2"
                >
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search customers..."
                            className="rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 w-56"
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        Search
                    </button>
                </form>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />

                    <select
                        value={status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="rounded-md border border-gray-300 py-2 pl-2 pr-7 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    {can.restore && (
                        <button
                            onClick={handleTrashedToggle}
                            className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                                trashed
                                    ? "border-red-300 bg-red-50 text-red-600"
                                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            {trashed ? "Hide Trash" : "Show Trash"}
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                #
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Name
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Contact
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                City
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Balance
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                Status
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {customers.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-10 text-center text-gray-400"
                                >
                                    No customers found.
                                </td>
                            </tr>
                        ) : (
                            customers.data.map((customer, index) => {
                                const isDeleted = customer.deleted_at !== null;
                                const rowNum =
                                    (customers.current_page - 1) * 15 +
                                    index +
                                    1;

                                return (
                                    <tr
                                        key={customer.id}
                                        className={
                                            isDeleted
                                                ? "bg-red-50 opacity-70"
                                                : "hover:bg-gray-50"
                                        }
                                    >
                                        <td className="px-4 py-3 text-gray-500">
                                            {rowNum}
                                        </td>

                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-800">
                                                {customer.name}
                                            </p>
                                            {customer.email && (
                                                <p className="text-xs text-gray-400">
                                                    {customer.email}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {customer.phone ?? (
                                                <span className="text-gray-300">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {customer.city
                                                ? `${customer.city}, ${customer.country}`
                                                : customer.country}
                                        </td>

                                        <td className="px-4 py-3 text-gray-700">
                                            ৳
                                            {Number(
                                                customer.opening_balance,
                                            ).toLocaleString("en-BD", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </td>

                                        <td className="px-4 py-3">
                                            {isDeleted ? (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                                                    Deleted
                                                </span>
                                            ) : customer.is_active ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {isDeleted ? (
                                                    can.restore && (
                                                        <button
                                                            onClick={() =>
                                                                handleRestore(
                                                                    customer,
                                                                )
                                                            }
                                                            title="Restore"
                                                            className="rounded-md p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </button>
                                                    )
                                                ) : (
                                                    <>
                                                        {can.edit && (
                                                            <button
                                                                onClick={() =>
                                                                    onEdit(
                                                                        customer,
                                                                    )
                                                                }
                                                                title="Edit"
                                                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        customer,
                                                                    )
                                                                }
                                                                title="Delete"
                                                                className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {customers.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-500">
                        Showing {customers.from}–{customers.to} of{" "}
                        {customers.total} customers
                    </p>
                    <div className="flex gap-1">
                        {customers.links.map((link, i) => (
                            <button
                                key={i}
                                onClick={() => goToPage(link.url)}
                                disabled={!link.url}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                                    link.active
                                        ? "bg-indigo-600 text-white"
                                        : link.url
                                          ? "text-gray-600 hover:bg-gray-100"
                                          : "cursor-not-allowed text-gray-300"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
