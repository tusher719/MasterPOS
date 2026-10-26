import { Link, router } from "@inertiajs/react";
import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import {
    Copy,
    Eye,
    Filter,
    Pencil,
    RotateCcw,
    Search,
    ShoppingBag,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import TableActionDropdown, {
    TableActionItem,
} from "@/Components/Common/TableActionDropdown";
import { Customer } from "./CustomerModal";
import CustomerPreviewModal from "./CustomerPreviewModal";

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

    const [previewCustomer, setPreviewCustomer] = useState<Customer | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleOpenPreview = (customer: Customer) => {
        setPreviewCustomer(customer);
        setIsPreviewOpen(true);
    };

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
                    onSuccess: () => toast.success("Customer moved to trash."),
                    onError: () => toast.error("Failed to delete customer."),
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
                    {
                        preserveScroll: true,
                        onSuccess: () => toast.success("Customer restored successfully."),
                        onError: () => toast.error("Failed to restore customer."),
                    },
                );
            }
        });
    }

    function goToPage(url: string | null) {
        if (url) router.get(url, {}, { preserveState: true });
    }

    const getRowActions = (customer: Customer): TableActionItem[] => {
        const isDeleted = customer.deleted_at !== null;
        if (isDeleted) {
            return [
                {
                    label: "Preview Details",
                    icon: <Eye size={15} />,
                    onClick: () => handleOpenPreview(customer),
                },
                ...(can.restore
                    ? [
                          {
                              label: "Restore Customer",
                              icon: <RotateCcw size={15} />,
                              onClick: () => handleRestore(customer),
                          },
                      ]
                    : []),
            ];
        }

        return [
            {
                label: "Preview Details",
                icon: <Eye size={15} />,
                onClick: () => handleOpenPreview(customer),
            },
            ...(can.edit
                ? [
                      {
                          label: "Edit Account",
                          icon: <Pencil size={15} />,
                          onClick: () => onEdit(customer),
                      },
                  ]
                : []),
            ...(customer.phone
                ? [
                      {
                          label: "Copy Phone Number",
                          icon: <Copy size={15} />,
                          onClick: () => {
                              navigator.clipboard.writeText(customer.phone!);
                              toast.success(`Copied phone: ${customer.phone}`);
                          },
                      },
                  ]
                : []),
            {
                label: "View Customer Orders",
                icon: <ShoppingBag size={15} />,
                href: route("backend.pos.sales.index", {
                    search: customer.phone || customer.name,
                }),
                dividerBefore: true,
            },
            ...(can.delete
                ? [
                      {
                          label: "Move to Trash",
                          icon: <Trash2 size={15} />,
                          onClick: () => handleDelete(customer),
                          danger: true,
                          dividerBefore: true,
                      },
                  ]
                : []),
        ];
    };

    return (
        <>
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search */}
                    <form
                        onSubmit={handleSearch}
                        className="flex items-center gap-2 flex-1 max-w-md"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, phone, email, city..."
                                className="w-full rounded-xl border border-border bg-muted/30 py-2 pl-9 pr-3 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors shadow-xs"
                        >
                            Search
                        </button>
                    </form>

                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="h-4 w-4 text-muted-foreground" />

                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="rounded-xl border border-border bg-card py-1.5 pl-2.5 pr-7 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>

                        {can.restore && (
                            <button
                                onClick={handleTrashedToggle}
                                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    trashed
                                        ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                {trashed ? "Hide Trash" : "Show Trash"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">
                                    #
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Customer
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Contact
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    City
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Balance
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {customers.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-14 text-center text-sm text-muted-foreground"
                                    >
                                        No customer records found.
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
                                            className={`transition-colors ${
                                                isDeleted
                                                    ? "bg-rose-500/5 opacity-70"
                                                    : "hover:bg-muted/30"
                                            }`}
                                        >
                                            <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                                                {rowNum}
                                            </td>

                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenPreview(customer)}
                                                    className="font-semibold text-foreground hover:text-primary transition-colors text-left focus:outline-none"
                                                >
                                                    {customer.name}
                                                </button>
                                                {customer.email && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {customer.email}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                                                {customer.phone ?? (
                                                    <span className="text-muted-foreground/40 font-sans">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {customer.city
                                                    ? `${customer.city}, ${customer.country || "Bangladesh"}`
                                                    : customer.country || "Dhaka"}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-baseline gap-1 text-xs font-semibold text-foreground">
                                                    <span className="text-[10px] text-muted-foreground font-normal">৳</span>
                                                    <span>
                                                        {Number(
                                                            customer.opening_balance,
                                                        ).toLocaleString("en-BD", {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                {isDeleted ? (
                                                    <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                                        Deleted
                                                    </span>
                                                ) : customer.is_active ? (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground border border-border">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenPreview(customer)}
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                                        title="Quick preview"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    {can.edit && !isDeleted && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onEdit(customer)}
                                                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                                            title="Edit customer"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                    )}
                                                    <TableActionDropdown
                                                        actions={getRowActions(customer)}
                                                        triggerSize="sm"
                                                    />
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
                    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                            Showing {customers.from}–{customers.to} of{" "}
                            {customers.total} customers
                        </p>
                        <div className="flex gap-1 flex-wrap">
                            {customers.links.map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToPage(link.url)}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                                        link.active
                                            ? "bg-primary text-white shadow-xs"
                                            : link.url
                                              ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                                              : "cursor-not-allowed text-muted-foreground/40"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <CustomerPreviewModal
                opened={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                customer={previewCustomer}
                onEdit={onEdit}
            />
        </>
    );
}
