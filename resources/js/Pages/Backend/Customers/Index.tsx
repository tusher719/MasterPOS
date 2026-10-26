import { Head, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomerTable from "./_components/CustomerTable";
import CustomerModal, { Customer } from "./_components/CustomerModal";
import { Users, UserCheck, UserX, Wallet } from "lucide-react";

interface Stats {
    total: number;
    active: number;
    inactive: number;
    total_balance: string;
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
    stats: Stats;
    filters: Filters;
    can: Can;
}

type ModalMode = "create" | "edit";

export default function CustomersIndex({
    customers,
    stats,
    filters,
    can,
}: Props) {
    const { props } = usePage<{
        auth: any;
        flash?: { success?: string; error?: string };
    }>();

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>("create");
    const [editing, setEditing] = useState<Customer | null>(null);

    // Flash toasts
    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    function openCreate() {
        setEditing(null);
        setModalMode("create");
        setModalOpen(true);
    }

    function openEdit(customer: Customer) {
        setEditing(customer);
        setModalMode("edit");
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditing(null);
    }

    return (
        <AuthenticatedLayout>
            <Head title="Customers" />

            <div className="space-y-5">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Customer Accounts
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage customer directories, store credit balances, and contacts
                        </p>
                    </div>
                    {can.create && (
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors shrink-0"
                        >
                            <span className="text-base font-bold leading-none">+</span>
                            Add Customer
                        </button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Total Customers</p>
                                <p className="text-xl font-bold text-foreground">
                                    {stats.total}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                                <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Active Accounts</p>
                                <p className="text-xl font-bold text-foreground">
                                    {stats.active}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-muted p-2.5 text-muted-foreground">
                                <UserX className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Inactive
                                </p>
                                <p className="text-xl font-bold text-foreground">
                                    {stats.inactive}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Total Balance
                                </p>
                                <div className="flex items-baseline gap-1 text-xl font-bold text-foreground">
                                    <span className="text-sm font-normal text-muted-foreground">৳</span>
                                    <span>
                                        {Number(stats.total_balance).toLocaleString(
                                            "en-BD",
                                            { minimumFractionDigits: 2 },
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <CustomerTable
                    customers={customers}
                    filters={filters}
                    can={can}
                    onEdit={openEdit}
                />
            </div>

            {/* Modal */}
            {modalOpen && (
                <CustomerModal
                    mode={modalMode}
                    customer={editing}
                    onClose={closeModal}
                />
            )}
        </AuthenticatedLayout>
    );
}
