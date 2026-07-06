import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ExpenseStatsCards from "./_components/ExpenseStatsCards";
import ExpenseTable from "./_components/ExpenseTable";
import ExpenseModal from "./_components/ExpenseModal";
import useFlashToast from "@/hooks/useFlashToast";

interface ExpenseCategory {
    id: number;
    name: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface Creator {
    id: number;
    name: string;
}

interface Expense {
    id: number;
    reference_no: string;
    title: string;
    expense_category_id: number;
    payment_method_id: number | null;
    amount: string;
    expense_date: string;
    reference: string | null;
    attachment: string | null;
    attachment_url: string | null;
    attachment_mime: string | null;
    note: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at?: string;
    category: ExpenseCategory;
    payment_method: PaymentMethod | null;
    creator: Creator;
}

interface PaginatedExpenses {
    data: Expense[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Stats {
    today: number;
    this_month: number;
    this_year: number;
    all_time: number;
}

interface Filters {
    search?: string;
    category_id?: string;
    payment_method_id?: string;
    date_from?: string;
    date_to?: string;
    amount_min?: string;
    amount_max?: string;
    trashed?: boolean;
}

interface Can {
    create: boolean;
    edit: boolean;
    delete: boolean;
    restore: boolean;
}

interface Props {
    expenses: PaginatedExpenses;
    stats: Stats;
    categories: ExpenseCategory[];
    paymentMethods: PaymentMethod[];
    filters: Filters;
    can: Can;
}

export default function ExpensesIndex({
    expenses,
    stats,
    categories,
    paymentMethods,
    filters,
    can,
}: Props) {
    useFlashToast();

    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Local filter state
    const [search, setSearch] = useState(filters.search ?? "");
    const [categoryId, setCategoryId] = useState(filters.category_id ?? "");
    const [paymentMethodId, setPaymentMethodId] = useState(
        filters.payment_method_id ?? "",
    );
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? "");
    const [dateTo, setDateTo] = useState(filters.date_to ?? "");
    const [amountMin, setAmountMin] = useState(filters.amount_min ?? "");
    const [amountMax, setAmountMax] = useState(filters.amount_max ?? "");
    const [trashed, setTrashed] = useState(filters.trashed ?? false);

    function applyFilters() {
        router.get(
            route("backend.expenses.index"),
            {
                search: search || undefined,
                category_id: categoryId || undefined,
                payment_method_id: paymentMethodId || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                amount_min: amountMin || undefined,
                amount_max: amountMax || undefined,
                trashed: trashed || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    function resetFilters() {
        setSearch("");
        setCategoryId("");
        setPaymentMethodId("");
        setDateFrom("");
        setDateTo("");
        setAmountMin("");
        setAmountMax("");
        setTrashed(false);
        router.get(route("backend.expenses.index"));
    }

    function openCreate() {
        setEditingExpense(null);
        setShowModal(true);
    }

    function openEdit(expense: Expense): void {
        setEditingExpense(expense);
        setShowModal(true);
    }

    const activeFilterCount = [
        search,
        categoryId,
        paymentMethodId,
        dateFrom,
        dateTo,
        amountMin,
        amountMax,
        trashed,
    ].filter(Boolean).length;

    return (
        <AuthenticatedLayout>
            <Head title="Expenses" />

            <div className="space-y-6">
                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Expenses
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Track and manage business expenses
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters((v) => !v)}
                            className="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                                />
                            </svg>
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        {can.create && (
                            <button
                                onClick={openCreate}
                                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Add Expense
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <ExpenseStatsCards stats={stats} />

                {/* Filters panel */}
                {showFilters && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Search */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Search
                                </label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && applyFilters()
                                    }
                                    placeholder="Reference, title, transaction ref…"
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Category
                                </label>
                                <select
                                    value={categoryId}
                                    onChange={(e) =>
                                        setCategoryId(e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">All categories</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment method */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Payment Method
                                </label>
                                <select
                                    value={paymentMethodId}
                                    onChange={(e) =>
                                        setPaymentMethodId(e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">All methods</option>
                                    {paymentMethods.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date from */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Date From
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) =>
                                        setDateFrom(e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Date to */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Date To
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Amount min */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Min Amount
                                </label>
                                <input
                                    type="number"
                                    value={amountMin}
                                    onChange={(e) =>
                                        setAmountMin(e.target.value)
                                    }
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Amount max */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Max Amount
                                </label>
                                <input
                                    type="number"
                                    value={amountMax}
                                    onChange={(e) =>
                                        setAmountMax(e.target.value)
                                    }
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Trash toggle */}
                            <div className="flex items-end">
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                    <div
                                        onClick={() => setTrashed((v) => !v)}
                                        className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            trashed
                                                ? "bg-indigo-600"
                                                : "bg-gray-200"
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                trashed
                                                    ? "translate-x-6"
                                                    : "translate-x-1"
                                            }`}
                                        />
                                    </div>
                                    Show Trashed
                                </label>
                            </div>
                        </div>

                        {/* Filter actions */}
                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                onClick={resetFilters}
                                className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Reset
                            </button>
                            <button
                                onClick={applyFilters}
                                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm text-white hover:bg-indigo-700"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <ExpenseTable
                    expenses={expenses}
                    can={can}
                    trashed={trashed}
                    onEdit={(expense) => openEdit(expense as Expense)}
                />
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <ExpenseModal
                    expense={editingExpense}
                    categories={categories}
                    paymentMethods={paymentMethods}
                    onClose={() => setShowModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}
