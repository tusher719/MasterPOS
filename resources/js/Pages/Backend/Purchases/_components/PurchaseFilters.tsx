// resources/js/Pages/Backend/Purchases/_components/PurchaseFilters.tsx

import React from "react";
import { Search, X } from "lucide-react";

interface Supplier {
    id: number;
    name: string;
}

interface Filters {
    search?: string;
    supplier_id?: string | number;
    purchase_status?: string;
    payment_status?: string;
    date_from?: string;
    date_to?: string;
    trashed?: boolean;
}

interface Props {
    filters: Filters;
    suppliers: Supplier[];
    onFilterChange: (key: keyof Filters, value: string | boolean) => void;
    onClearFilters: () => void;
}

const PURCHASE_STATUSES = [
    { value: "draft", label: "Draft" },
    { value: "ordered", label: "Ordered" },
    { value: "received", label: "Received" },
    { value: "partial_received", label: "Partial Received" },
    { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUSES = [
    { value: "paid", label: "Paid" },
    { value: "partial", label: "Partial" },
    { value: "due", label: "Due" },
];

export default function PurchaseFilters({
    filters,
    suppliers,
    onFilterChange,
    onClearFilters,
}: Props) {
    // Check if any filter is active
    const hasActiveFilters = !!(
        filters.search ||
        filters.supplier_id ||
        filters.purchase_status ||
        filters.payment_status ||
        filters.date_from ||
        filters.date_to ||
        filters.trashed
    );

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap">
                {/* Search */}
                <div className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search reference or supplier…"
                        value={filters.search ?? ""}
                        onChange={(e) =>
                            onFilterChange("search", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm
                                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                {/* Supplier */}
                <div className="min-w-[160px]">
                    <select
                        value={filters.supplier_id ?? ""}
                        onChange={(e) =>
                            onFilterChange("supplier_id", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm
                                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">All Suppliers</option>
                        {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Purchase Status */}
                <div className="min-w-[160px]">
                    <select
                        value={filters.purchase_status ?? ""}
                        onChange={(e) =>
                            onFilterChange("purchase_status", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm
                                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">All Statuses</option>
                        {PURCHASE_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Payment Status */}
                <div className="min-w-[140px]">
                    <select
                        value={filters.payment_status ?? ""}
                        onChange={(e) =>
                            onFilterChange("payment_status", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm
                                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">All Payments</option>
                        {PAYMENT_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date From */}
                <div className="min-w-[140px]">
                    <input
                        type="date"
                        value={filters.date_from ?? ""}
                        onChange={(e) =>
                            onFilterChange("date_from", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm
                                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                {/* Date To */}
                <div className="min-w-[140px]">
                    <input
                        type="date"
                        value={filters.date_to ?? ""}
                        onChange={(e) =>
                            onFilterChange("date_to", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm
                                   focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                {/* Trash Toggle */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            onFilterChange("trashed", !filters.trashed)
                        }
                        className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors
                                    ${filters.trashed ? "bg-indigo-600" : "bg-gray-200"}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
                                        ${filters.trashed ? "translate-x-6" : "translate-x-1"}`}
                        />
                    </button>
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                        Show Deleted
                    </span>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onClearFilters}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300
                                   bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50
                                   transition-colors whitespace-nowrap"
                    >
                        <X className="h-4 w-4" />
                        Clear Filters
                    </button>
                )}
            </div>
        </div>
    );
}
