import { router } from "@inertiajs/react";
import axios from "axios";
import { AlertTriangle, Package, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SearchResult {
    id: number;
    name: string;
    sku: string;
    sale_price: string;
    stock_qty: string;
    low_stock_threshold: string;
    is_low_stock: boolean;
    is_active: boolean;
    category_name: string | null;
    primary_image: string | null;
}

interface Props {
    onClear?: () => void;
}

export default function ProductAutocomplete({ onClear }: Props) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cancelRef = useRef<AbortController | null>(null);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length < 2) {
            setResults([]);
            setOpen(false);
            setLoading(false);
            return;
        }

        setLoading(true);

        debounceRef.current = setTimeout(async () => {
            if (cancelRef.current) cancelRef.current.abort();
            cancelRef.current = new AbortController();

            try {
                const res = await axios.get(route("backend.products.search"), {
                    params: { q: query.trim() },
                    signal: cancelRef.current.signal,
                });
                setResults(res.data);
                setOpen(res.data.length > 0);
                setActiveIdx(-1);
            } catch (err: any) {
                if (axios.isCancel(err)) return;
                setResults([]);
                setOpen(false);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleSelect = (product: SearchResult) => {
        setOpen(false);
        setQuery("");
        router.visit(route("backend.products.edit", product.id));
    };

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setOpen(false);
        setActiveIdx(-1);
        inputRef.current?.focus();
        onClear?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || results.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, -1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIdx >= 0 && results[activeIdx]) {
                handleSelect(results[activeIdx]);
            }
        } else if (e.key === "Escape") {
            setOpen(false);
            setActiveIdx(-1);
        }
    };

    const fmt = (val: string | number) =>
        "৳" + Number(val).toLocaleString("en-BD", { minimumFractionDigits: 2 });

    return (
        <div className="relative w-full max-w-sm">
            {/* Input */}
            <div className="relative">
                <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (results.length > 0) setOpen(true);
                    }}
                    placeholder="Search products…"
                    className="w-full rounded-md border border-border bg-input py-2 pl-9 pr-8
                               text-sm text-foreground placeholder:text-muted-foreground
                               focus:border-indigo-500 focus:outline-none focus:ring-1
                               focus:ring-indigo-500"
                    autoComplete="off"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2
                                   text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label="Clear search"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Loading indicator under input */}
            {loading && (
                <div className="absolute right-9 top-1/2 -translate-y-1/2">
                    <span
                        className="block h-3.5 w-3.5 animate-spin rounded-full
                                     border-2 border-border border-t-indigo-500"
                    />
                </div>
            )}

            {/* Dropdown */}
            {open && results.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute left-0 top-full z-50 mt-1 w-80 overflow-hidden
                               rounded-lg border border-border bg-card shadow-lg"
                >
                    <ul role="listbox">
                        {results.map((product, idx) => (
                            <li
                                key={product.id}
                                role="option"
                                aria-selected={idx === activeIdx}
                                onMouseDown={() => handleSelect(product)}
                                onMouseEnter={() => setActiveIdx(idx)}
                                className={`flex cursor-pointer items-center gap-3 px-3 py-2.5
                                            transition-colors
                                            ${
                                                idx === activeIdx
                                                    ? "bg-muted"
                                                    : "hover:bg-muted/60"
                                            }
                                            ${
                                                idx !== 0
                                                    ? "border-t border-border"
                                                    : ""
                                            }`}
                            >
                                {/* Thumbnail */}
                                <div
                                    className="flex h-10 w-10 flex-shrink-0 items-center
                                                justify-center overflow-hidden rounded-md
                                                border border-border bg-muted"
                                >
                                    {product.primary_image ? (
                                        <img
                                            src={product.primary_image}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <Package
                                            size={18}
                                            className="text-muted-foreground"
                                        />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="truncate text-sm font-medium text-foreground">
                                            {product.name}
                                        </span>
                                        {!product.is_active && (
                                            <span
                                                className="flex-shrink-0 rounded px-1 py-px
                                                             text-[10px] font-medium
                                                             bg-muted text-muted-foreground"
                                            >
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        className="mt-0.5 flex items-center gap-2
                                                    text-xs text-muted-foreground"
                                    >
                                        <span className="font-mono">
                                            {product.sku}
                                        </span>
                                        {product.category_name && (
                                            <>
                                                <span>·</span>
                                                <span className="truncate">
                                                    {product.category_name}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Price + Stock */}
                                <div className="flex-shrink-0 text-right">
                                    <div className="text-sm font-medium text-foreground">
                                        {fmt(product.sale_price)}
                                    </div>
                                    <div
                                        className={`mt-0.5 flex items-center justify-end
                                                     gap-1 text-xs
                                                     ${
                                                         product.is_low_stock
                                                             ? "text-amber-600 dark:text-amber-400"
                                                             : "text-muted-foreground"
                                                     }`}
                                    >
                                        {product.is_low_stock && (
                                            <AlertTriangle size={10} />
                                        )}
                                        <span>
                                            {Number(product.stock_qty)} in stock
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Footer hint */}
                    <div className="border-t border-border bg-muted/40 px-3 py-1.5">
                        <p className="text-[11px] text-muted-foreground">
                            ↑↓ navigate · Enter to open · Esc to close
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
