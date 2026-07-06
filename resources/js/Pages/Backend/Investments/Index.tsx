import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import InvestmentStatsCards from "./_components/InvestmentStatsCards";
import InvestmentTable from "./_components/InvestmentTable";
import InvestmentModal from "./_components/InvestmentModal";
import { Search, Plus, Filter, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import useFlashToast from "@/hooks/useFlashToast";

interface InvestmentType {
    id: number;
    name: string;
}

interface Investment {
    id: number;
    title: string;
    investor_name: string;
    amount: string;
    investment_date: string;
    reference: string | null;
    attachment: string | null;
    attachment_url: string | null;
    note: string | null;
    status: "active" | "withdrawn";
    investment_type: InvestmentType;
    creator: { id: number; name: string } | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Stats {
    today: string;
    this_week: string;
    this_month: string;
    total_active: string;
    total_withdrawn: string;
}

interface Props {
    investments: {
        data: Investment[];
        links: any[];
        meta: any;
    };
    stats: Stats;
    investmentTypes: InvestmentType[];
    filters: {
        search?: string;
        investment_type_id?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        amount_min?: string;
        amount_max?: string;
    };
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        restore: boolean;
    };
}

export default function Index({
    investments,
    stats,
    investmentTypes,
    filters,
    can,
}: Props) {
    useFlashToast();

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Investment | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filter state
    const [search, setSearch] = useState(filters.search ?? "");
    const [typeId, setTypeId] = useState(filters.investment_type_id ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? "");
    const [dateTo, setDateTo] = useState(filters.date_to ?? "");
    const [amountMin, setAmountMin] = useState(filters.amount_min ?? "");
    const [amountMax, setAmountMax] = useState(filters.amount_max ?? "");

    function applyFilters(overrides: Record<string, string> = {}) {
        router.get(
            route("backend.investments.index"),
            {
                search,
                investment_type_id: typeId,
                status,
                date_from: dateFrom,
                date_to: dateTo,
                amount_min: amountMin,
                amount_max: amountMax,
                ...overrides,
            },
            { preserveState: true, replace: true },
        );
    }

    function resetFilters() {
        setSearch("");
        setTypeId("");
        setStatus("");
        setDateFrom("");
        setDateTo("");
        setAmountMin("");
        setAmountMax("");
        router.get(route("backend.investments.index"), {}, { replace: true });
    }

    function openCreate() {
        setEditing(null);
        setShowModal(true);
    }

    function openEdit(investment: Investment) {
        setEditing(investment);
        setShowModal(true);
    }

    const hasActiveFilters =
        search ||
        typeId ||
        status ||
        dateFrom ||
        dateTo ||
        amountMin ||
        amountMax;

    return (
        <AuthenticatedLayout>
            <Head title="Investment Management" />

            <div className="space-y-5">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Investment Management
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Track and manage all capital investments
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Export button — stubbed for Step 16 */}
                        <button
                            disabled
                            title="Export (coming soon)"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
                        >
                            Export
                            <ChevronDown className="h-4 w-4" />
                        </button>

                        {can.create && (
                            <button
                                onClick={openCreate}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                <Plus className="h-4 w-4" />
                                Add Investment
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <InvestmentStatsCards stats={stats} />

                {/* Filter Bar */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search title, investor name, reference..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    applyFilters({ search })
                                }
                                className="w-full rounded-md border-gray-300 pl-9 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Type filter */}
                        <select
                            value={typeId}
                            onChange={(e) => {
                                setTypeId(e.target.value);
                                applyFilters({
                                    investment_type_id: e.target.value,
                                });
                            }}
                            className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">All Types</option>
                            {investmentTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>

                        {/* Status filter */}
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                applyFilters({ status: e.target.value });
                            }}
                            className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="withdrawn">Withdrawn</option>
                            <option value="trashed">Trashed</option>
                        </select>

                        {/* Toggle advanced filters */}
                        <button
                            onClick={() => setShowFilters((p) => !p)}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                                showFilters
                                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            {hasActiveFilters && (
                                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                                    !
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => applyFilters()}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Search
                        </button>

                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Advanced filters */}
                    {showFilters && (
                        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 md:grid-cols-4">
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
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Min Amount
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={amountMin}
                                    onChange={(e) =>
                                        setAmountMin(e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Max Amount
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={amountMax}
                                    onChange={(e) =>
                                        setAmountMax(e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Table */}
                <InvestmentTable
                    investments={investments}
                    can={can}
                    onEdit={(investment) => openEdit(investment as Investment)}
                />
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <InvestmentModal
                    investment={editing}
                    investmentTypes={investmentTypes}
                    onClose={() => setShowModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}
