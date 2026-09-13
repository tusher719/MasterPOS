import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowLeftRight,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Download,
    Eye,
    FileText,
    Filter,
    TrendingUp,
    Upload,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
    id: number;
    module: string;
    module_label: string;
    type: "import" | "export";
    format: string;
    file_icon: "excel" | "csv" | "pdf" | "file";
    filename: string;
    total_rows: number;
    imported_rows: number;
    skipped_rows: number;
    failed_rows: number;
    status: "completed" | "partial" | "failed";
    success_rate: number;
    imported_by: string;
    created_at: string;
    created_at_human: string;
}

interface RowResult {
    row: number;
    status: "success" | "warning" | "error";
    data: Record<string, string>;
    errors: string[];
    warnings: string[];
}

interface PaginatedLogs {
    data: LogEntry[];
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
    logs: PaginatedLogs;
    filters: { type: string; module: string | null };
    modules: Record<string, string>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FILE_ICON_COLORS: Record<string, string> = {
    excel: "bg-emerald-100 text-emerald-700",
    csv: "bg-blue-100 text-blue-700",
    pdf: "bg-red-100 text-red-700",
    file: "bg-gray-100 text-gray-600",
};

const STATUS_CONFIG = {
    completed: {
        label: "Completed",
        cls: "bg-green-100 text-green-700",
        Icon: CheckCircle2,
    },
    partial: {
        label: "Partial",
        cls: "bg-amber-100 text-amber-700",
        Icon: AlertTriangle,
    },
    failed: { label: "Failed", cls: "bg-red-100 text-red-700", Icon: XCircle },
};

// ─── File badge ───────────────────────────────────────────────────────────────

function FileBadge({ icon, format }: { icon: string; format: string }) {
    const cls = FILE_ICON_COLORS[icon] ?? FILE_ICON_COLORS.file;
    return (
        <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${cls}`}
        >
            {format || icon.toUpperCase()}
        </div>
    );
}

// ─── Row preview panel ────────────────────────────────────────────────────────

function RowPreviewPanel({
    log,
    onClose,
}: {
    log: LogEntry;
    onClose: () => void;
}) {
    const [rows, setRows] = useState<RowResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<
        "all" | "success" | "warning" | "error"
    >("all");
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    // useEffect — correct way to fetch on mount
    useEffect(() => {
        setLoading(true);
        window.axios
            .get(route("backend.import.history.show", log.id))
            .then((res) => {
                setRows(res.data.row_results ?? []);
            })
            .catch(() => {
                setRows([]);
            })
            .finally(() => setLoading(false));
    }, [log.id]);

    const toggle = (row: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(row) ? next.delete(row) : next.add(row);
            return next;
        });
    };

    const summary = {
        total: rows.length,
        success: rows.filter((r) => r.status === "success").length,
        warnings: rows.filter((r) => r.status === "warning").length,
        errors: rows.filter((r) => r.status === "error").length,
    };

    const filtered =
        filter === "all" ? rows : rows.filter((r) => r.status === filter);
    const primaryVal = (r: RowResult) => Object.values(r.data)[0] ?? "—";

    const filterBtns = [
        {
            key: "all",
            label: "All",
            count: summary.total,
            active: "bg-indigo-600 text-white",
        },
        {
            key: "success",
            label: "OK",
            count: summary.success,
            active: "bg-green-600 text-white",
        },
        {
            key: "warning",
            label: "Warnings",
            count: summary.warnings,
            active: "bg-amber-500 text-white",
        },
        {
            key: "error",
            label: "Skipped",
            count: summary.errors,
            active: "bg-red-600 text-white",
        },
    ] as const;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-xl flex-col bg-card shadow-2xl border-l border-border">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                    <FileBadge icon={log.file_icon} format={log.format} />
                    <div className="flex-1 min-w-0">
                        <p
                            className="truncate text-sm font-semibold text-foreground"
                            title={log.filename}
                        >
                            {log.filename}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {log.module_label} · {log.imported_by} ·{" "}
                            {log.created_at}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                    >
                        <XCircle className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-24">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                            <p className="text-sm text-muted-foreground">
                                Loading row details…
                            </p>
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-24">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                                No row details
                            </p>
                            <p className="text-xs text-muted-foreground text-center max-w-[240px]">
                                Row details are only available for imports done
                                after the history feature was enabled.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Summary strip */}
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    {
                                        label: "Total",
                                        val: summary.total,
                                        color: "bg-indigo-50 text-indigo-700 border-indigo-100",
                                    },
                                    {
                                        label: "Imported",
                                        val: summary.success + summary.warnings,
                                        color: "bg-green-50 text-green-700 border-green-100",
                                    },
                                    {
                                        label: "Warnings",
                                        val: summary.warnings,
                                        color: "bg-amber-50 text-amber-700 border-amber-100",
                                    },
                                    {
                                        label: "Skipped",
                                        val: summary.errors,
                                        color: "bg-red-50 text-red-700 border-red-100",
                                    },
                                ].map(({ label, val, color }) => (
                                    <div
                                        key={label}
                                        className={`rounded-xl border p-3 text-center ${color}`}
                                    >
                                        <p className="text-xl font-bold leading-none">
                                            {val}
                                        </p>
                                        <p className="text-xs mt-1">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Filter pills */}
                            <div className="flex gap-1.5 flex-wrap">
                                {filterBtns.map(
                                    ({ key, label, count, active }) => (
                                        <button
                                            key={key}
                                            onClick={() => setFilter(key)}
                                            className={[
                                                "rounded-full px-3 py-1 text-xs font-medium transition-all",
                                                filter === key
                                                    ? active
                                                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                                            ].join(" ")}
                                        >
                                            {label} ({count})
                                        </button>
                                    ),
                                )}
                            </div>

                            {/* Rows */}
                            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                                {filtered.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No rows match this filter.
                                    </p>
                                ) : (
                                    filtered.map((r) => {
                                        const isOpen = expanded.has(r.row);
                                        const hasDetail =
                                            r.errors.length > 0 ||
                                            r.warnings.length > 0;
                                        const badgeCls = {
                                            success:
                                                "bg-green-100 text-green-700",
                                            warning:
                                                "bg-amber-100 text-amber-700",
                                            error: "bg-red-100 text-red-700",
                                        }[r.status];
                                        const badgeLbl = {
                                            success: "OK",
                                            warning: "Warning",
                                            error: "Skipped",
                                        }[r.status];

                                        return (
                                            <div
                                                key={r.row}
                                                className="bg-card"
                                            >
                                                <div
                                                    className={`flex items-center gap-3 px-4 py-3 ${hasDetail ? "cursor-pointer hover:bg-muted/30" : "hover:bg-muted/10"} transition-colors`}
                                                    onClick={() =>
                                                        hasDetail &&
                                                        toggle(r.row)
                                                    }
                                                >
                                                    <span className="w-8 shrink-0 text-xs text-muted-foreground text-right tabular-nums">
                                                        #{r.row}
                                                    </span>
                                                    <p className="flex-1 truncate text-sm text-foreground">
                                                        {primaryVal(r)}
                                                    </p>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}
                                                    >
                                                        {badgeLbl}
                                                    </span>
                                                    {hasDetail &&
                                                        (isOpen ? (
                                                            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        ) : (
                                                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        ))}
                                                </div>
                                                {isOpen && hasDetail && (
                                                    <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-1.5">
                                                        {r.errors.map(
                                                            (e, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex items-start gap-2 text-xs text-red-600"
                                                                >
                                                                    <XCircle className="h-3.5 w-3.5 mt-px shrink-0" />
                                                                    {e}
                                                                </div>
                                                            ),
                                                        )}
                                                        {r.warnings.map(
                                                            (w, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex items-start gap-2 text-xs text-amber-600"
                                                                >
                                                                    <AlertTriangle className="h-3.5 w-3.5 mt-px shrink-0" />
                                                                    {w}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <p className="text-xs text-right text-muted-foreground">
                                {filtered.length} of {rows.length} rows
                            </p>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function History({ logs, filters, modules }: Props) {
    const [activeType, setActiveType] = useState<"import" | "export">(
        (filters.type as any) ?? "import",
    );
    const [moduleFilter, setModuleFilter] = useState<string>(
        filters.module ?? "",
    );
    const [previewLog, setPreviewLog] = useState<LogEntry | null>(null);

    const applyFilters = (type: "import" | "export", mod: string) => {
        router.get(
            route("backend.import.history"),
            { type, module: mod || undefined },
            { preserveState: true, replace: true },
        );
    };

    const meta = logs.meta ?? {};
    const items = logs.data ?? [];

    return (
        <AuthenticatedLayout>
            <Head title="Import / Export History" />

            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Clock className="h-6 w-6 text-indigo-500" />
                            Import / Export History
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track all import and export activity across modules.
                        </p>
                    </div>
                    <button
                        onClick={() =>
                            router.visit(route("backend.import.index"))
                        }
                        className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
                    >
                        <ArrowLeftRight className="h-4 w-4" />
                        Back to Import / Export
                    </button>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Type tabs */}
                    <div className="flex rounded-xl border border-border bg-muted p-1 gap-1">
                        {(["import", "export"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    setActiveType(t);
                                    applyFilters(t, moduleFilter);
                                }}
                                className={[
                                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                                    activeType === t
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                ].join(" ")}
                            >
                                {t === "import" ? (
                                    <Upload className="h-4 w-4" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                {t === "import" ? "Imports" : "Exports"}
                            </button>
                        ))}
                    </div>

                    {/* Module filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                        <select
                            value={moduleFilter}
                            onChange={(e) => {
                                setModuleFilter(e.target.value);
                                applyFilters(activeType, e.target.value);
                            }}
                            className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">All modules</option>
                            {Object.entries(modules).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table card */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <TrendingUp className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                                No {activeType} history yet
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {activeType === "import"
                                    ? "Import a file to see records here."
                                    : "Export data to see download history here."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                                            File
                                        </th>
                                        {activeType === "import" && (
                                            <>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                                    Rows
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                                    Progress
                                                </th>
                                            </>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                            Date
                                        </th>
                                        {activeType === "import" && (
                                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                                                Details
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {items.map((log) => {
                                        const sc = STATUS_CONFIG[log.status];
                                        const StatusIcon = sc.Icon;
                                        return (
                                            <tr
                                                key={log.id}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                {/* File */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <FileBadge
                                                            icon={log.file_icon}
                                                            format={log.format}
                                                        />
                                                        <div className="min-w-0">
                                                            <p
                                                                className="truncate text-sm font-medium text-foreground max-w-[200px]"
                                                                title={
                                                                    log.filename
                                                                }
                                                            >
                                                                {log.filename}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {
                                                                    log.module_label
                                                                }{" "}
                                                                ·{" "}
                                                                {
                                                                    log.imported_by
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Rows — import only */}
                                                {activeType === "import" && (
                                                    <td className="px-4 py-4 text-xs whitespace-nowrap">
                                                        <span className="font-medium text-green-600">
                                                            {log.imported_rows}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {" "}
                                                            / {log.total_rows}
                                                        </span>
                                                        {log.skipped_rows >
                                                            0 && (
                                                            <span className="ml-1 text-red-500">
                                                                (
                                                                {
                                                                    log.skipped_rows
                                                                }{" "}
                                                                skipped)
                                                            </span>
                                                        )}
                                                    </td>
                                                )}

                                                {/* Progress — import only */}
                                                {activeType === "import" && (
                                                    <td className="px-4 py-4">
                                                        <div className="w-20">
                                                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full bg-indigo-500 transition-all"
                                                                    style={{
                                                                        width: `${log.success_rate}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-0.5 text-right tabular-nums">
                                                                {
                                                                    log.success_rate
                                                                }
                                                                %
                                                            </p>
                                                        </div>
                                                    </td>
                                                )}

                                                {/* Status */}
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${sc.cls}`}
                                                    >
                                                        <StatusIcon className="h-3 w-3" />
                                                        {sc.label}
                                                    </span>
                                                </td>

                                                {/* Date */}
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <p className="text-xs text-foreground">
                                                        {log.created_at}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                                                        {log.created_at_human}
                                                    </p>
                                                </td>

                                                {/* Details — import only */}
                                                {activeType === "import" && (
                                                    <td className="px-4 py-4 text-right">
                                                        <button
                                                            onClick={() =>
                                                                setPreviewLog(
                                                                    log,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted hover:border-indigo-300 transition-all"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            Preview
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {(meta.last_page ?? 1) > 1 && (
                                <div className="flex items-center justify-between border-t border-border px-5 py-3">
                                    <p className="text-xs text-muted-foreground">
                                        Showing {meta.from}–{meta.to} of{" "}
                                        {meta.total}
                                    </p>
                                    <div className="flex gap-1">
                                        {logs.links
                                            ?.filter(
                                                (l) =>
                                                    l.label !==
                                                        "&laquo; Previous" &&
                                                    l.label !== "Next &raquo;",
                                            )
                                            .map((link, i) => (
                                                <button
                                                    key={i}
                                                    disabled={!link.url}
                                                    onClick={() =>
                                                        link.url &&
                                                        router.visit(link.url, {
                                                            preserveState: true,
                                                        })
                                                    }
                                                    className={[
                                                        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                                                        link.active
                                                            ? "bg-indigo-600 text-white"
                                                            : "border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed",
                                                    ].join(" ")}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Row preview panel */}
            {previewLog && (
                <RowPreviewPanel
                    log={previewLog}
                    onClose={() => setPreviewLog(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
