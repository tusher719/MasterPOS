// resources/js/Components/GlobalSearch/GlobalSearchModal.tsx

import { router } from "@inertiajs/react";
import {
    Building2,
    Clock,
    Package,
    Search,
    ShoppingCart,
    TrendingUp,
    Truck,
    Users,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ResultType =
    | "product"
    | "customer"
    | "supplier"
    | "sale"
    | "investment"
    | "partner";

interface SearchResult {
    id: number;
    title: string;
    subtitle: string;
    url: string;
    type: ResultType;
}

interface SearchResults {
    products?: SearchResult[];
    customers?: SearchResult[];
    suppliers?: SearchResult[];
    sales?: SearchResult[];
    investments?: SearchResult[];
    partners?: SearchResult[];
}

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RECENT_KEY = "mbs_recent_searches";
const MAX_RECENT = 8;
const DEBOUNCE_MS = 300;

// Category display config — label + icon
const CATEGORY_CONFIG: Record<
    string,
    { label: string; icon: React.ElementType }
> = {
    products: { label: "Products", icon: Package },
    customers: { label: "Customers", icon: Users },
    suppliers: { label: "Suppliers", icon: Truck },
    sales: { label: "Sales", icon: ShoppingCart },
    investments: { label: "Investments", icon: TrendingUp },
    partners: { label: "Partners", icon: Building2 },
};

// ─── Recent searches helpers ──────────────────────────────────────────────────

function loadRecent(): string[] {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveRecent(terms: string[]): void {
    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(terms));
    } catch {
        // localStorage unavailable — fail silently
    }
}

function addToRecent(term: string): string[] {
    const trimmed = term.trim();
    if (!trimmed) return loadRecent();
    const existing = loadRecent().filter(
        (t) => t.toLowerCase() !== trimmed.toLowerCase(),
    );
    const updated = [trimmed, ...existing].slice(0, MAX_RECENT);
    saveRecent(updated);
    return updated;
}

function removeFromRecent(term: string): string[] {
    const updated = loadRecent().filter((t) => t !== term);
    saveRecent(updated);
    return updated;
}

// ─── Flatten results for keyboard navigation ──────────────────────────────────

function flattenResults(results: SearchResults): SearchResult[] {
    return Object.values(results).flat() as SearchResult[];
}

// ─── Result icon ──────────────────────────────────────────────────────────────

function ResultIcon({ type }: { type: ResultType }) {
    const config = Object.values(CATEGORY_CONFIG).find(() => true); // fallback
    const icons: Record<ResultType, React.ElementType> = {
        product: Package,
        customer: Users,
        supplier: Truck,
        sale: ShoppingCart,
        investment: TrendingUp,
        partner: Building2,
    };
    const Icon = icons[type] ?? Search;
    return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon size={14} />
        </span>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GlobalSearchModal({
    isOpen,
    onClose,
}: GlobalSearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResults>({});
    const [loading, setLoading] = useState(false);
    const [recent, setRecent] = useState<string[]>([]);
    const [activeIdx, setActiveIdx] = useState(-1); // keyboard nav index

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Flattened list for keyboard nav
    const flat = flattenResults(results);

    // ── Load recent on open ──────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            setRecent(loadRecent());
            setQuery("");
            setResults({});
            setActiveIdx(-1);
            // Focus input after mount
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // ── Escape to close ──────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    // ── Debounced search ─────────────────────────────────────────────────────
    const doSearch = useCallback((q: string) => {
        if (q.trim().length < 2) {
            setResults({});
            setLoading(false);
            return;
        }

        setLoading(true);

        fetch(route("backend.search") + "?q=" + encodeURIComponent(q.trim()), {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
            credentials: "same-origin",
        })
            .then((r) => r.json())
            .then((data) => {
                setResults(data.results ?? {});
                setActiveIdx(-1);
            })
            .catch(() => setResults({}))
            .finally(() => setLoading(false));
    }, []);

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        setActiveIdx(-1);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(val), DEBOUNCE_MS);
    };

    // ── Navigate to a result ─────────────────────────────────────────────────
    const navigate = useCallback(
        (url: string, term: string) => {
            const updated = addToRecent(term);
            setRecent(updated);
            onClose();
            router.visit(url);
        },
        [onClose],
    );

    // ── Use a recent term ────────────────────────────────────────────────────
    const handleRecentClick = (term: string) => {
        setQuery(term);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        doSearch(term);
        inputRef.current?.focus();
    };

    const handleRemoveRecent = (term: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setRecent(removeFromRecent(term));
    };

    const handleClearAllRecent = () => {
        saveRecent([]);
        setRecent([]);
    };

    // ── Keyboard navigation ──────────────────────────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!flat.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && activeIdx >= 0) {
            e.preventDefault();
            const item = flat[activeIdx];
            if (item) navigate(item.url, item.title);
        }
    };

    // ── Backdrop click ───────────────────────────────────────────────────────
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    // ── Helpers ──────────────────────────────────────────────────────────────
    const hasResults = Object.values(results).some(
        (arr) => arr && arr.length > 0,
    );
    const showRecent = !query && recent.length > 0;
    const showEmpty = query.length >= 2 && !loading && !hasResults;

    // Build flat index lookup for keyboard highlight
    let globalIdx = 0;
    const categoryIndexMap: Record<string, number> = {};
    for (const [key, items] of Object.entries(results)) {
        if (items && items.length > 0) {
            categoryIndexMap[key] = globalIdx;
            globalIdx += items.length;
        }
    }

    if (!isOpen) return null;

    return (
        // ── Backdrop ─────────────────────────────────────────────────────────
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 pt-[10vh] backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            {/* ── Modal panel ───────────────────────────────────────────────── */}
            <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card/95 shadow-2xl backdrop-blur-sm">
                {/* ── Search input row ─────────────────────────────────────── */}
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    {loading ? (
                        // Spinner when loading
                        <svg
                            className="h-5 w-5 animate-spin shrink-0 text-muted-foreground"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                            />
                        </svg>
                    ) : (
                        <Search
                            size={18}
                            className="shrink-0 text-muted-foreground"
                        />
                    )}

                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleQueryChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Search products, customers, sales..."
                        className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                        autoComplete="off"
                        spellCheck={false}
                    />

                    {/* Shortcut hint + close button */}
                    <div className="flex items-center gap-2 shrink-0">
                        {!query && (
                            <span className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
                                ESC
                            </span>
                        )}
                        {query && (
                            <button
                                onClick={() => {
                                    setQuery("");
                                    setResults({});
                                    setActiveIdx(-1);
                                    inputRef.current?.focus();
                                }}
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                <X size={15} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Body ─────────────────────────────────────────────────── */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {/* Recent Searches — shown when input is empty */}
                    {showRecent && (
                        <div className="px-4 py-3">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Recent Searches
                                </span>
                                <button
                                    onClick={handleClearAllRecent}
                                    className="text-[11px] text-muted-foreground hover:text-foreground"
                                >
                                    Clear all
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {recent.map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => handleRecentClick(term)}
                                        className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground transition hover:bg-muted/70"
                                    >
                                        <Clock
                                            size={11}
                                            className="text-muted-foreground"
                                        />
                                        {term}
                                        <span
                                            onClick={(e) =>
                                                handleRemoveRecent(term, e)
                                            }
                                            className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-border hover:text-foreground"
                                        >
                                            <X size={10} />
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tip — shown on empty input with no recent */}
                    {!query && !showRecent && (
                        <div className="px-4 py-8 text-center">
                            <Search
                                size={28}
                                className="mx-auto mb-3 text-muted-foreground/40"
                            />
                            <p className="text-sm text-muted-foreground">
                                Search across products, customers, sales, and
                                more
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground/60">
                                Type at least 2 characters to search
                            </p>
                        </div>
                    )}

                    {/* Empty state */}
                    {showEmpty && (
                        <div className="px-4 py-10 text-center">
                            <Search
                                size={28}
                                className="mx-auto mb-3 text-muted-foreground/30"
                            />
                            <p className="text-sm font-medium text-foreground">
                                No results for &ldquo;{query}&rdquo;
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Try a different search term
                            </p>
                        </div>
                    )}

                    {/* Results — grouped by category */}
                    {hasResults && (
                        <div className="py-2">
                            {Object.entries(CATEGORY_CONFIG).map(
                                ([key, config]) => {
                                    const items =
                                        results[key as keyof SearchResults];
                                    if (!items || items.length === 0)
                                        return null;

                                    const Icon = config.icon;
                                    const startIdx = categoryIndexMap[key] ?? 0;

                                    return (
                                        <div key={key} className="mb-1">
                                            {/* Category header */}
                                            <div className="flex items-center gap-2 px-4 py-1.5">
                                                <Icon
                                                    size={12}
                                                    className="text-muted-foreground"
                                                />
                                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {config.label}
                                                </span>
                                                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                    {items.length}
                                                </span>
                                            </div>

                                            {/* Result rows */}
                                            {items.map((item, i) => {
                                                const flatI = startIdx + i;
                                                const isHighlighted =
                                                    flatI === activeIdx;

                                                return (
                                                    <button
                                                        key={`${key}-${item.id}`}
                                                        onClick={() =>
                                                            navigate(
                                                                item.url,
                                                                item.title,
                                                            )
                                                        }
                                                        onMouseEnter={() =>
                                                            setActiveIdx(flatI)
                                                        }
                                                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                            isHighlighted
                                                                ? "bg-muted/70"
                                                                : "hover:bg-muted/40"
                                                        }`}
                                                    >
                                                        <ResultIcon
                                                            type={item.type}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium text-foreground">
                                                                {item.title}
                                                            </p>
                                                            <p className="truncate text-xs text-muted-foreground">
                                                                {item.subtitle}
                                                            </p>
                                                        </div>
                                                        {isHighlighted && (
                                                            <span className="shrink-0 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                                ↵
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer hint ───────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-t border-border px-4 py-2">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">
                                ↑
                            </kbd>
                            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">
                                ↓
                            </kbd>
                            navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">
                                ↵
                            </kbd>
                            open
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">
                                ESC
                            </kbd>
                            close
                        </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground/50">
                        Master Business Suite
                    </span>
                </div>
            </div>
        </div>
    );
}
