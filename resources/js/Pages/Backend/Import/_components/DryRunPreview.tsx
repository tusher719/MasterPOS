import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    XCircle,
} from "lucide-react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RowResult {
    row: number;
    status: "success" | "warning" | "error";
    data: Record<string, string>;
    errors: string[];
    warnings: string[];
}

interface DryRunSummary {
    total: number;
    success: number;
    warnings: number;
    errors: number;
}

interface Props {
    rows: RowResult[];
    summary: DryRunSummary;
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
    count,
    label,
    color,
    icon: Icon,
}: {
    count: number;
    label: string;
    color: string;
    icon: React.ElementType;
}) {
    const colors: Record<string, string> = {
        green: "bg-green-50 border-green-200 text-green-700",
        amber: "bg-amber-50 border-amber-200 text-amber-700",
        red: "bg-red-50 border-red-200 text-red-700",
        indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    };
    return (
        <div
            className={`rounded-xl border p-4 flex items-center gap-3 ${colors[color]}`}
        >
            <Icon className="h-5 w-5 shrink-0" />
            <div>
                <p className="text-2xl font-bold leading-none">{count}</p>
                <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
        </div>
    );
}

// ─── Row badge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RowResult["status"] }) {
    const cfg = {
        success: { cls: "bg-green-100 text-green-700", label: "OK" },
        warning: { cls: "bg-amber-100 text-amber-700", label: "Warning" },
        error: { cls: "bg-red-100 text-red-700", label: "Skipped" },
    }[status];

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}
        >
            {cfg.label}
        </span>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DryRunPreview({ rows, summary }: Props) {
    const [filter, setFilter] = useState<
        "all" | "success" | "warning" | "error"
    >("all");
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const toggleExpanded = (row: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(row) ? next.delete(row) : next.add(row);
            return next;
        });
    };

    const filtered = rows.filter(
        (r) => filter === "all" || r.status === filter,
    );

    // Primary data key to show in the row preview (first value of data object)
    const primaryValue = (r: RowResult) => Object.values(r.data)[0] ?? "—";
    const secondaryValue = (r: RowResult) => {
        const vals = Object.values(r.data);
        return vals[1] ?? "";
    };

    return (
        <div className="space-y-4">
            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard
                    count={summary.total}
                    label="Total rows"
                    color="indigo"
                    icon={CheckCircle2}
                />
                <SummaryCard
                    count={summary.success}
                    label="Will import"
                    color="green"
                    icon={CheckCircle2}
                />
                <SummaryCard
                    count={summary.warnings}
                    label="With warnings"
                    color="amber"
                    icon={AlertTriangle}
                />
                <SummaryCard
                    count={summary.errors}
                    label="Will skip"
                    color="red"
                    icon={XCircle}
                />
            </div>

            {/* ── Info banner ── */}
            {summary.warnings > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                    <strong>Note:</strong> Rows with warnings will still be
                    imported — warnings are informational only (e.g. category
                    not found).
                </div>
            )}
            {summary.errors > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    <strong>Note:</strong> Rows marked "Skipped" have errors
                    (e.g. duplicate SKU, missing required field) and will not be
                    imported.
                </div>
            )}

            {/* ── Filter pills ── */}
            <div className="flex gap-2 flex-wrap">
                {(["all", "success", "warning", "error"] as const).map((f) => {
                    const labels = {
                        all: "All",
                        success: "OK",
                        warning: "Warnings",
                        error: "Skipped",
                    };
                    const counts = {
                        all: summary.total,
                        success: summary.success,
                        warning: summary.warnings,
                        error: summary.errors,
                    };
                    const active = filter === f;
                    return (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={[
                                "rounded-full px-3 py-1 text-xs font-medium transition-all duration-150",
                                active
                                    ? f === "error"
                                        ? "bg-red-600 text-white"
                                        : f === "warning"
                                          ? "bg-amber-500 text-white"
                                          : f === "success"
                                            ? "bg-green-600 text-white"
                                            : "bg-indigo-600 text-white"
                                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                            ].join(" ")}
                        >
                            {labels[f]} ({counts[f]})
                        </button>
                    );
                })}
            </div>

            {/* ── Row list ── */}
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {filtered.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        No rows match this filter.
                    </div>
                ) : (
                    filtered.map((r) => {
                        const isOpen = expanded.has(r.row);
                        const hasDetail =
                            r.errors.length > 0 || r.warnings.length > 0;

                        return (
                            <div
                                key={r.row}
                                className="bg-card hover:bg-muted/30 transition-colors"
                            >
                                {/* Main row */}
                                <div
                                    className={`flex items-center gap-3 px-4 py-3 ${hasDetail ? "cursor-pointer" : ""}`}
                                    onClick={() =>
                                        hasDetail && toggleExpanded(r.row)
                                    }
                                >
                                    {/* Row number */}
                                    <span className="w-10 shrink-0 text-xs text-muted-foreground text-right">
                                        #{r.row}
                                    </span>

                                    {/* Name / identifier */}
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {primaryValue(r)}
                                        </p>
                                        {secondaryValue(r) && (
                                            <p className="truncate text-xs text-muted-foreground">
                                                {secondaryValue(r)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Status badge */}
                                    <StatusBadge status={r.status} />

                                    {/* Expand toggle */}
                                    {hasDetail && (
                                        <span className="text-muted-foreground">
                                            {isOpen ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </span>
                                    )}
                                </div>

                                {/* Expanded detail */}
                                {isOpen && hasDetail && (
                                    <div className="border-t border-border px-4 py-3 space-y-2 bg-muted/20">
                                        {r.errors.map((e, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-2 text-xs text-red-600"
                                            >
                                                <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                                <span>{e}</span>
                                            </div>
                                        ))}
                                        {r.warnings.map((w, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-2 text-xs text-amber-600"
                                            >
                                                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                                <span>{w}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Row count hint */}
            <p className="text-xs text-muted-foreground text-right">
                Showing {filtered.length} of {rows.length} rows
            </p>
        </div>
    );
}
