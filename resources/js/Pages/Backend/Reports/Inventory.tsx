import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Package,
    DollarSign,
    AlertTriangle,
    XCircle,
    CheckCircle,
    ArrowLeft,
} from "lucide-react";
import ExportBar from "./_components/ExportBar";

interface InventoryRow {
    id: number;
    name: string;
    sku: string | null;
    category_name: string | null;
    unit_name: string | null;
    stock_qty: number;
    low_stock_threshold: number;
    cost_price: string;
    sale_price: string;
    stock_value: string;
    is_active: number | boolean;
}

interface Summary {
    total_products: number;
    total_stock_qty: number;
    total_stock_value: number;
    low_stock_count: number;
    out_of_stock: number;
    active_count: number;
}

interface Props {
    rows: InventoryRow[];
    summary: Summary;
    can: { export: boolean };
}

function fmt(val: string | number): string {
    return Number(val).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function stockStatus(row: InventoryRow): {
    label: string;
    badge: string;
    icon: React.ReactNode;
} {
    if (row.stock_qty <= 0) {
        return {
            label: "Out of Stock",
            badge: "bg-red-100 text-red-600",
            icon: <XCircle className="h-3.5 w-3.5" />,
        };
    }
    if (row.stock_qty <= row.low_stock_threshold) {
        return {
            label: "Low Stock",
            badge: "bg-amber-100 text-amber-700",
            icon: <AlertTriangle className="h-3.5 w-3.5" />,
        };
    }
    return {
        label: "In Stock",
        badge: "bg-green-100 text-green-700",
        icon: <CheckCircle className="h-3.5 w-3.5" />,
    };
}

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

import { useState, useMemo } from "react";

export default function InventoryReport({ rows, summary, can }: Props) {
    const [search, setSearch] = useState("");
    const [stockFilter, setStockFilter] = useState<StockFilter>("all");
    const [sortField, setSortField] = useState<keyof InventoryRow>("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    // Client-side filter + sort — inventory has no date range
    const filtered = useMemo(() => {
        let data = [...rows];

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter(
                (r) =>
                    r.name.toLowerCase().includes(q) ||
                    (r.sku ?? "").toLowerCase().includes(q) ||
                    (r.category_name ?? "").toLowerCase().includes(q),
            );
        }

        // Stock filter
        if (stockFilter === "out_of_stock") {
            data = data.filter((r) => r.stock_qty <= 0);
        } else if (stockFilter === "low_stock") {
            data = data.filter(
                (r) => r.stock_qty > 0 && r.stock_qty <= r.low_stock_threshold,
            );
        } else if (stockFilter === "in_stock") {
            data = data.filter((r) => r.stock_qty > r.low_stock_threshold);
        }

        // Sort
        data.sort((a, b) => {
            const av = a[sortField] ?? "";
            const bv = b[sortField] ?? "";
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });

        return data;
    }, [rows, search, stockFilter, sortField, sortDir]);

    function toggleSort(field: keyof InventoryRow) {
        if (sortField === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDir("asc");
        }
    }

    function SortIcon({ field }: { field: keyof InventoryRow }) {
        if (sortField !== field)
            return <span className="ml-1 text-gray-300">↕</span>;
        return (
            <span className="ml-1 text-indigo-500">
                {sortDir === "asc" ? "↑" : "↓"}
            </span>
        );
    }

    // Filters has no date range for inventory — current snapshot
    const dummyFilters = { from: "", to: "" };

    return (
        <AuthenticatedLayout>
            <Head title="Inventory Report" />

            <div className="space-y-4 print:space-y-3">
                {/* Back + heading */}
                <div className="flex items-center gap-3 print:hidden">
                    <Link
                        href={route("backend.reports.index")}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Reports
                    </Link>
                    <span className="text-gray-300">/</span>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Inventory Report
                    </h1>
                </div>

                {/* Print-only title */}
                <div className="hidden print:block">
                    <h1 className="text-xl font-bold text-gray-800">
                        Inventory Report
                    </h1>
                    <p className="text-sm text-gray-500">
                        Snapshot as of today
                    </p>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <KpiCard
                        label="Total Products"
                        value={String(summary.total_products)}
                        icon={<Package className="h-4 w-4 text-indigo-600" />}
                        accent="border-l-indigo-500"
                        plain
                    />
                    <KpiCard
                        label="Active Products"
                        value={String(summary.active_count)}
                        icon={
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        }
                        accent="border-l-green-500"
                        plain
                    />
                    <KpiCard
                        label="Total Stock Qty"
                        value={String(summary.total_stock_qty)}
                        icon={<Package className="h-4 w-4 text-blue-600" />}
                        accent="border-l-blue-500"
                        plain
                    />
                    <KpiCard
                        label="Stock Value"
                        value={fmt(summary.total_stock_value)}
                        icon={<DollarSign className="h-4 w-4 text-green-600" />}
                        accent="border-l-green-600"
                    />
                    <KpiCard
                        label="Low Stock"
                        value={String(summary.low_stock_count)}
                        icon={
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        }
                        accent="border-l-amber-500"
                        plain
                    />
                    <KpiCard
                        label="Out of Stock"
                        value={String(summary.out_of_stock)}
                        icon={<XCircle className="h-4 w-4 text-red-500" />}
                        accent="border-l-red-500"
                        plain
                    />
                </div>

                {/* Client-side filter bar */}
                <div
                    className="print:hidden flex flex-wrap items-center gap-3
                                rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search product, SKU, category…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm
                                   focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                                   focus:outline-none min-w-[220px]"
                    />

                    {/* Stock status filter pills */}
                    {(
                        [
                            { key: "all", label: "All" },
                            { key: "in_stock", label: "In Stock" },
                            { key: "low_stock", label: "Low Stock" },
                            { key: "out_of_stock", label: "Out of Stock" },
                        ] as { key: StockFilter; label: string }[]
                    ).map((opt) => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => setStockFilter(opt.key)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition
                                ${
                                    stockFilter === opt.key
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}

                    <div className="ml-auto">
                        <ExportBar
                            canExport={can.export}
                            reportType="inventory"
                            filters={dummyFilters}
                            rowCount={filtered.length}
                        />
                    </div>
                </div>

                {/* Print-only record count */}
                <div className="hidden print:block text-sm text-gray-500">
                    {filtered.length} products
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        #
                                    </th>
                                    <SortTh
                                        field="name"
                                        label="Product"
                                        onClick={toggleSort}
                                        sortField={sortField}
                                        sortDir={sortDir}
                                    />
                                    <SortTh
                                        field="sku"
                                        label="SKU"
                                        onClick={toggleSort}
                                        sortField={sortField}
                                        sortDir={sortDir}
                                    />
                                    <SortTh
                                        field="category_name"
                                        label="Category"
                                        onClick={toggleSort}
                                        sortField={sortField}
                                        sortDir={sortDir}
                                    />
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Unit
                                    </th>
                                    <SortTh
                                        field="stock_qty"
                                        label="Stock Qty"
                                        onClick={toggleSort}
                                        sortField={sortField}
                                        sortDir={sortDir}
                                        align="right"
                                    />
                                    <SortTh
                                        field="cost_price"
                                        label="Cost Price"
                                        onClick={toggleSort}
                                        sortField={sortField}
                                        sortDir={sortDir}
                                        align="right"
                                    />
                                    <SortTh
                                        field="sale_price"
                                        label="Sale Price"
                                        onClick={toggleSort}
                                        sortField={sortField}
                                        sortDir={sortDir}
                                        align="right"
                                    />
                                    <SortTh
                                        field="stock_value"
                                        label="Stock Value"
                                        onClick={toggleSort}
                                        sortField={sortField}
                                        sortDir={sortDir}
                                        align="right"
                                    />
                                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                                        Active
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={11}
                                            className="py-12 text-center text-sm text-gray-400"
                                        >
                                            No products match the current
                                            filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((row, idx) => {
                                        const status = stockStatus(row);
                                        return (
                                            <tr
                                                key={row.id}
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-2.5 text-gray-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-2.5 font-medium text-gray-800">
                                                    {row.name}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-500">
                                                    {row.sku ?? (
                                                        <span className="text-gray-300">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-600">
                                                    {row.category_name ?? (
                                                        <span className="text-gray-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-500">
                                                    {row.unit_name ?? "—"}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <span
                                                        className={`font-semibold
                                                        ${
                                                            row.stock_qty <= 0
                                                                ? "text-red-500"
                                                                : row.stock_qty <=
                                                                    row.low_stock_threshold
                                                                  ? "text-amber-600"
                                                                  : "text-gray-800"
                                                        }`}
                                                    >
                                                        {row.stock_qty}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-gray-600">
                                                    {fmt(row.cost_price)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-gray-600">
                                                    {fmt(row.sale_price)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                                                    {fmt(row.stock_value)}
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1
                                                        rounded-full px-2 py-0.5 text-xs font-medium
                                                        ${status.badge}`}
                                                    >
                                                        {status.icon}
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    {row.is_active ? (
                                                        <span
                                                            className="rounded-full bg-green-100
                                                                         px-2 py-0.5 text-xs
                                                                         font-medium text-green-700"
                                                        >
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="rounded-full bg-gray-100
                                                                         px-2 py-0.5 text-xs
                                                                         font-medium text-gray-500"
                                                        >
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>

                            {/* Footer totals */}
                            {filtered.length > 0 && (
                                <tfoot>
                                    <tr
                                        className="border-t-2 border-gray-200 bg-gray-50
                   font-semibold text-gray-700"
                                    >
                                        <td
                                            colSpan={5}
                                            className="px-4 py-3 text-right text-xs
                                    uppercase tracking-wide text-gray-500"
                                        >
                                            Totals ({filtered.length} products)
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {fmt(
                                                filtered.reduce(
                                                    (s, r) =>
                                                        s + Number(r.stock_qty),
                                                    0,
                                                ),
                                            )}
                                        </td>
                                        <td colSpan={2} />
                                        <td className="px-4 py-3 text-right">
                                            {fmt(
                                                filtered.reduce(
                                                    (s, r) =>
                                                        s +
                                                        Number(r.stock_value),
                                                    0,
                                                ),
                                            )}
                                        </td>
                                        <td colSpan={2} />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// ── Sortable th ───────────────────────────────────────────────────────────────

function SortTh({
    field,
    label,
    onClick,
    sortField,
    sortDir,
    align = "left",
}: {
    field: keyof InventoryRow;
    label: string;
    onClick: (f: keyof InventoryRow) => void;
    sortField: keyof InventoryRow;
    sortDir: "asc" | "desc";
    align?: "left" | "right";
}) {
    const active = sortField === field;
    return (
        <th
            className={`px-4 py-3 font-medium text-gray-500 cursor-pointer
                        select-none hover:text-gray-700 text-${align}`}
            onClick={() => onClick(field)}
        >
            {label}
            <span
                className={`ml-1 ${active ? "text-indigo-500" : "text-gray-300"}`}
            >
                {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
            </span>
        </th>
    );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    accent: string;
    plain?: boolean;
}

function KpiCard({ label, value, icon, accent }: KpiProps) {
    return (
        <div
            className={`rounded-lg border border-gray-200 bg-white p-4 border-l-4 ${accent}`}
        >
            <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                    {label}
                </span>
                {icon}
            </div>
            <p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
    );
}
