import { Head, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CustomerTable from "./_components/CustomerTable";
import CustomerModal from "./_components/CustomerModal";
import { Users, UserCheck, UserX, Wallet } from "lucide-react";

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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Customers
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Manage your customer accounts
                        </p>
                    </div>
                    {can.create && (
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                            <span className="text-lg leading-none">+</span>
                            Add Customer
                        </button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-indigo-50 p-2">
                                <Users className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {stats.total}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-50 p-2">
                                <UserCheck className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Active</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {stats.active}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-gray-100 p-2">
                                <UserX className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">
                                    Inactive
                                </p>
                                <p className="text-xl font-bold text-gray-800">
                                    {stats.inactive}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-50 p-2">
                                <Wallet className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">
                                    Total Balance
                                </p>
                                <p className="text-xl font-bold text-gray-800">
                                    ৳
                                    {Number(stats.total_balance).toLocaleString(
                                        "en-BD",
                                        { minimumFractionDigits: 2 },
                                    )}
                                </p>
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
