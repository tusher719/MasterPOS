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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Suppliers
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Manage your supplier directory and opening balances.
                        </p>
                    </div>
                    {can.create && (
                        <button
                            onClick={() => {
                                setEditingSupplier(null);
                                setShowModal(true);
                            }}
                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
                        >
                            <Plus size={16} />
                            Add Supplier
                        </button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/50 p-2.5 text-indigo-600 dark:text-indigo-400">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Total Suppliers
                                </p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                                    {stats.total}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 p-2.5 text-emerald-600 dark:text-emerald-400">
                                <UserCheck size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                                    {stats.active}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2.5 text-slate-400 dark:text-slate-500">
                                <UserX size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Inactive
                                </p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                                    {stats.inactive}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/50 p-2.5 text-amber-500 dark:text-amber-400">
                                <Wallet size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Total Payable
                                </p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
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
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search name, company, email, phone..."
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Status filter */}
                    <select
                        value={status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-3 pr-8 text-sm text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    {/* Trashed toggle */}
                    {can.restore && (
                        <button
                            onClick={handleTrashedToggle}
                            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                                trashed
                                    ? "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                        >
                            {trashed ? "Showing Deleted" : "Show Deleted"}
                        </button>
                    )}

                    {/* Search button */}
                    <button
                        onClick={() => applyFilters({ search })}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
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
