import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Search, Plus, Users, UserCheck, UserX, Wallet } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import SupplierTable from "./_components/SupplierTable";
import SupplierModal from "./_components/SupplierModal";
import useFlashToast from "@/hooks/useFlashToast";

type TableSupplier = React.ComponentProps<typeof SupplierTable> extends {
    onEdit: (supplier: infer T) => any;
}
    ? T
    : never;

interface SupplierData {
    id: number;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    opening_balance: string;
    is_active: boolean;
    deleted_at: string | null;
}

interface Props {
    suppliers: {
        data: TableSupplier[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    stats: {
        total: number;
        active: number;
        inactive: number;
        total_payable: number;
    };
    filters: {
        search?: string;
        status?: string;
        trashed?: boolean;
    };
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        restore: boolean;
    };
}

export default function SuppliersIndex({
    suppliers,
    stats,
    filters,
    can,
}: Props) {
    useFlashToast();

    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<SupplierData | null>(
        null,
    );

    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [trashed, setTrashed] = useState(filters.trashed ?? false);

    const applyFilters = (
        overrides: Record<string, string | boolean | undefined> = {},
    ) => {
        const params: Record<string, string> = {};
        const merged = {
            search,
            status,
            trashed,
            ...overrides,
        };
        if (merged.search) params.search = merged.search as string;
        if (merged.status) params.status = merged.status as string;
        if (merged.trashed) params.trashed = "1";

        router.get(route("backend.suppliers.index"), params, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") applyFilters({ search });
    };

    const handleStatusChange = (val: string) => {
        setStatus(val);
        applyFilters({ status: val });
    };

    const handleTrashedToggle = () => {
        const next = !trashed;
        setTrashed(next);
        applyFilters({ trashed: next });
    };

    const handleEdit = (
        supplier: TableSupplier & { address?: string | null },
    ) => {
        setEditingSupplier({
            id: supplier.id,
            name: supplier.name,
            company: supplier.company ?? null,
            email: supplier.email ?? null,
            phone: supplier.phone ?? null,
            address: supplier.address ?? null,
            city: supplier.city ?? null,
            country: supplier.country ?? null,
            opening_balance: supplier.opening_balance,
            is_active: supplier.is_active,
            deleted_at: supplier.deleted_at ?? null,
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSupplier(null);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Suppliers" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Suppliers
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage your supplier directory and opening balances.
                        </p>
                    </div>
                    {can.create && (
                        <button
                            onClick={() => {
                                setEditingSupplier(null);
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus size={16} />
                            Add Supplier
                        </button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-indigo-50 p-2">
                                <Users size={18} className="text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">
                                    Total Suppliers
                                </p>
                                <p className="text-xl font-bold text-gray-800">
                                    {stats.total}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-50 p-2">
                                <UserCheck
                                    size={18}
                                    className="text-green-600"
                                />
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
                            <div className="rounded-lg bg-gray-50 p-2">
                                <UserX size={18} className="text-gray-400" />
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
                                <Wallet size={18} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">
                                    Total Payable
                                </p>
                                <p className="text-xl font-bold text-gray-800">
                                    ৳{Number(stats.total_payable).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search name, company, email, phone..."
                            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Status filter */}
                    <select
                        value={status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    {/* Trashed toggle */}
                    {can.restore && (
                        <button
                            onClick={handleTrashedToggle}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                                trashed
                                    ? "border-red-300 bg-red-50 text-red-600"
                                    : "border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            {trashed ? "Showing Deleted" : "Show Deleted"}
                        </button>
                    )}

                    {/* Search button */}
                    <button
                        onClick={() => applyFilters({ search })}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                    >
                        Search
                    </button>
                </div>

                {/* Table */}
                <SupplierTable
                    suppliers={suppliers}
                    filters={filters}
                    canEdit={can.edit}
                    canDelete={can.delete}
                    canRestore={can.restore}
                    onEdit={handleEdit}
                />
            </div>

            {/* Modal */}
            <SupplierModal
                show={showModal}
                onClose={handleCloseModal}
                supplier={editingSupplier}
            />
        </AuthenticatedLayout>
    );
}
