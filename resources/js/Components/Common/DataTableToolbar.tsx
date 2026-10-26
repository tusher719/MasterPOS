import { Search, X, SlidersHorizontal, RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";

interface Props {
    search: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
    totalCount?: number;
    filteredCount?: number;
    filters?: React.ReactNode;
    actions?: React.ReactNode;
    onRefresh?: () => void;
    loading?: boolean;
    className?: string;
}

export default function DataTableToolbar({
    search,
    onSearchChange,
    placeholder = "Search records...",
    totalCount,
    filteredCount,
    filters,
    actions,
    onRefresh,
    loading = false,
    className = "",
}: Props) {
    const [localSearch, setLocalSearch] = useState(search);

    // Sync from parent
    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    // Debounce 300ms
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== search) {
                onSearchChange(localSearch);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearch, search, onSearchChange]);

    return (
        <div className={`flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs md:flex-row md:items-center md:justify-between ${className}`}>
            {/* Search Input & Count Badge */}
            <div className="flex flex-1 items-center gap-2.5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        placeholder={placeholder}
                        className="w-full rounded-xl border border-border bg-muted/30 pl-9 pr-8 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                    {localSearch && (
                        <button
                            type="button"
                            onClick={() => {
                                setLocalSearch("");
                                onSearchChange("");
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            title="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {totalCount !== undefined && (
                    <span className="hidden sm:inline-flex items-center rounded-lg bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
                        {filteredCount !== undefined && filteredCount !== totalCount
                            ? `${filteredCount} of ${totalCount}`
                            : `${totalCount} records`}
                    </span>
                )}
            </div>

            {/* Filter controls & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
                {filters}

                {onRefresh && (
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-xl border border-border bg-card p-2 text-muted-foreground shadow-xs transition hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`} />
                    </button>
                )}

                {actions}
            </div>
        </div>
    );
}
