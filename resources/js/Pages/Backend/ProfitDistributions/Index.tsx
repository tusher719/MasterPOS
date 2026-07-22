import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { toast } from "sonner";
import { PlusCircle, Search, RotateCcw } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ProfitDistributionStatsCards from "./_components/ProfitDistributionStatsCards";
import ProfitDistributionTable from "./_components/ProfitDistributionTable";
import { confirmAction } from "@/lib/confirm";
import useFlashToast from "@/hooks/useFlashToast";
import type {
    Distribution,
    DistributionStats,
    DistributionPermissions,
    DistributionSourceType,
} from "@/types/profit-distribution";

interface PaginatedDistributions {
    data: Distribution[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    distributions: PaginatedDistributions;
    stats: DistributionStats;
    filters: {
        search?: string;
        status?: string;
        year?: string;
        source_type?: string; // Gap 1.3
    };
    can: DistributionPermissions;
}

// Gap 1.3 — source type filter button config
const SOURCE_TYPE_OPTIONS: {
    value: DistributionSourceType | "";
    label: string;
}[] = [
    { value: "", label: "All Types" },
    { value: "investment_based", label: "Legacy" },
    { value: "partner_based", label: "Partner-based" },
];

export default function Index({ distributions, stats, filters, can }: Props) {
    useFlashToast();

    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [year, setYear] = useState(filters.year ?? "");
    const [sourceType, setSourceType] = useState(
        filters.source_type ?? "",
    ); // Gap 1.3
    const [processing, setProcessing] = useState<number | null>(null);

    const data = distributions.data ?? [];
    const meta = distributions.meta ?? {};
    const links = distributions.links ?? [];

    const statsForCards = {
        ...stats,
        total: stats.total ?? 0,
    };

    // -----------------------------------------------------------------------
    // Filter
    // -----------------------------------------------------------------------

    function applyFilters(overrides: Record<string, string> = {}) {
        router.get(
            route("backend.profit-distributions.index"),
            { search, status, year, source_type: sourceType, ...overrides },
            { preserveState: true, replace: true },
        );
    }

    function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") applyFilters({ search });
    }

    function resetFilters() {
        setSearch("");
        setStatus("");
        setYear("");
        setSourceType(""); // Gap 1.3
        router.get(route("backend.profit-distributions.index"));
    }

    // -----------------------------------------------------------------------
    // Delete
    // -----------------------------------------------------------------------

    function handleDelete(distribution: Distribution) {
        confirmAction({
            title: "Delete Distribution?",
            text: `"${distribution.distribution_no} — ${distribution.title}" will be moved to trash.`,
            confirmButtonText: "Yes, delete",
        }).then((ok) => {
            if (!ok) return;

            setProcessing(distribution.id);
            router.delete(
                route("backend.profit-distributions.destroy", distribution.id),
                {
                    onSuccess: () => toast.success("Distribution deleted."),
                    onError: () =>
                        toast.error("Failed to delete distribution."),
                    onFinish: () => setProcessing(null),
                },
            );
        });
    }

    // -----------------------------------------------------------------------
    // Restore
    // -----------------------------------------------------------------------

    function handleRestore(distribution: Distribution) {
        confirmAction({
            title: "Restore Distribution?",
            text: `"${distribution.distribution_no}" will be restored from trash.`,
            confirmButtonText: "Yes, restore",
        }).then((ok) => {
            if (!ok) return;

            setProcessing(distribution.id);
            router.post(
                route("backend.profit-distributions.restore", distribution.id),
                {},
                {
                    onSuccess: () => toast.success("Distribution restored."),
                    onError: () =>
                        toast.error("Failed to restore distribution."),
                    onFinish: () => setProcessing(null),
                },
            );
        });
    }

    // -----------------------------------------------------------------------
    // Pagination
    // -----------------------------------------------------------------------

    function goToPage(url: string | null) {
        if (!url) return;
        router.get(url, {}, { preserveState: true });
    }

    // -----------------------------------------------------------------------
    // Year options — last 5 years
    // -----------------------------------------------------------------------

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

    // Gap 1.3 — any active filter check (includes sourceType)
    const hasActiveFilter = !!(search || status || year || sourceType);

    return (
        <AuthenticatedLayout>
            <Head title="Profit Distributions" />

            <div className="space-y-6">
                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Profit Distributions
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage investor profit distributions by period.
                        </p>
                    </div>
                    {can.create && (
<a
                            href={route("backend.profit-distributions.create")}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <PlusCircle size={16} />
                            New Distribution
                        </a>
                    )}
                </div>

                {/* Stats cards */}
                <ProfitDistributionStatsCards stats={stats} />

                {/* Filters */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder="Search by number or title…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Status filter */}
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                applyFilters({ status: e.target.value });
                            }}
                            className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="approved">Approved</option>
                            <option value="distributed">Distributed</option>
                        </select>

                        {/* Year filter */}
                        <select
                            value={year}
                            onChange={(e) => {
                                setYear(e.target.value);
                                applyFilters({ year: e.target.value });
                            }}
                            className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">All Years</option>
                            {yearOptions.map((y) => (
                                <option key={y} value={String(y)}>
                                    {y}
                                </option>
                            ))}
                        </select>

                        {/* Search button */}
                        <button
                            onClick={() => applyFilters({ search })}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Search
                        </button>

                        {/* Reset */}
                        {hasActiveFilter && (
                            <button
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                <RotateCcw size={14} />
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Gap 1.3 — Source type button group */}
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium">
                            Type:
                        </span>
                        <div className="flex rounded-md border border-gray-200 overflow-hidden">
                            {SOURCE_TYPE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setSourceType(opt.value);
                                        applyFilters({
                                            source_type: opt.value,
                                        });
                                    }}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-gray-200 last:border-r-0 ${
                                        sourceType === opt.value
                                            ? opt.value === "investment_based"
                                                ? "bg-gray-600 text-white"
                                                : opt.value === "partner_based"
                                                  ? "bg-indigo-600 text-white"
                                                  : "bg-gray-700 text-white"
                                            : "bg-white text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <ProfitDistributionTable
                    distributions={data}
                    can={can}
                    processing={processing}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                />

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                            Showing {meta.from}–{meta.to} of {meta.total}{" "}
                            results
                        </span>
                        <div className="flex gap-1">
                            {links.map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToPage(link.url)}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`rounded-md px-3 py-1.5 text-sm border ${
                                        link.active
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : link.url
                                              ? "border-gray-300 hover:bg-gray-50"
                                              : "border-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
