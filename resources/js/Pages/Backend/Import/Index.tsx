import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowLeftRight,
    BarChart2,
    CheckCircle2,
    ChevronRight,
    Clock,
    CreditCard,
    Download,
    FileDown,
    FileSpreadsheet,
    History,
    Info,
    Package,
    Receipt,
    Ruler,
    Tag,
    Truck,
    Upload,
    Users,
    XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DryRunPreview from "./_components/DryRunPreview";
import ImportUploader from "./_components/ImportUploader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleCan {
    import: boolean;
    export: boolean;
}

interface RecentLog {
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

interface DryRunSummary {
    total: number;
    success: number;
    warnings: number;
    errors: number;
}

interface Props {
    recentLogs: RecentLog[];
    can: Record<string, ModuleCan>;
}

// ─── Module config ────────────────────────────────────────────────────────────

const MODULES = [
    {
        key: "products",
        label: "Products",
        icon: Package,
        color: "indigo",
        description:
            "Import product catalogue with pricing, stock levels, and categories. Export for backup or bulk editing.",
        importTips:
            "Required: name, sku, sale_price. Optional: category, unit, stock_qty, barcode.",
        exportTips:
            "Exports all active and inactive products with full pricing and stock data.",
    },
    {
        key: "categories",
        label: "Categories",
        icon: Tag,
        color: "violet",
        description:
            "Import product categories with optional parent-child hierarchy. Export for reference.",
        importTips: "Required: name. Optional: parent_category, is_active.",
        exportTips: "Exports all categories with their parent relationships.",
    },
    {
        key: "units",
        label: "Units",
        icon: Ruler,
        color: "blue",
        description:
            "Import measurement units (kg, pcs, litre). Export for reference.",
        importTips: "Required: name, abbreviation. Optional: is_active.",
        exportTips: "Exports all units with abbreviations.",
    },
    {
        key: "customers",
        label: "Customers",
        icon: Users,
        color: "emerald",
        description:
            "Bulk import customers from another system. Export for CRM or marketing tools.",
        importTips:
            "Required: name. Optional: email, phone, address, opening_balance. Duplicate emails are skipped.",
        exportTips: "Exports customers with contact info and opening balance.",
    },
    {
        key: "suppliers",
        label: "Suppliers",
        icon: Truck,
        color: "amber",
        description:
            "Import supplier contacts in bulk. Export for vendor management.",
        importTips:
            "Required: name. Optional: company, email, phone, opening_balance. Duplicate emails are skipped.",
        exportTips: "Exports suppliers with company and contact details.",
    },
    {
        key: "expense_categories",
        label: "Expense Categories",
        icon: Receipt,
        color: "rose",
        description:
            "Import expense categories with color codes. Export for reference.",
        importTips:
            "Required: name. Optional: color (hex, e.g. #ef4444), is_active.",
        exportTips: "Exports all expense categories with color codes.",
    },
    {
        key: "payment_methods",
        label: "Payment Methods",
        icon: CreditCard,
        color: "cyan",
        description: "Import payment method configurations. Export for backup.",
        importTips:
            "Required: name. Optional: type, charge_enabled, charge_type, charge_value.",
        exportTips: "Exports payment methods with charge configurations.",
    },
] as const;

type ModuleKey = (typeof MODULES)[number]["key"];

// Static color maps — Tailwind purge safe
const ICON_BG: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    emerald:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
};

const BORDER_ACCENT: Record<string, string> = {
    indigo: "border-l-indigo-500",
    violet: "border-l-violet-500",
    blue: "border-l-blue-500",
    emerald: "border-l-emerald-500",
    amber: "border-l-amber-500",
    rose: "border-l-rose-500",
    cyan: "border-l-cyan-500",
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

const FILE_ICON_COLORS: Record<string, string> = {
    excel: "bg-emerald-100 text-emerald-700",
    csv: "bg-blue-100 text-blue-700",
    pdf: "bg-red-100 text-red-700",
    file: "bg-gray-100 text-gray-600",
};

// ─── Tooltip component ────────────────────────────────────────────────────────

function Tooltip({
    content,
    children,
}: {
    content: string;
    children: React.ReactNode;
}) {
    const [show, setShow] = useState(false);

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground shadow-lg">
                    {content}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
                </div>
            )}
        </div>
    );
}

// ─── Mini stat bar (replaces chart for simplicity + no extra dep) ─────────────

function MiniStatBar({
    logs,
    moduleKey,
}: {
    logs: RecentLog[];
    moduleKey: string;
}) {
    const moduleLogs = logs.filter((l) => l.module === moduleKey);
    const imports = moduleLogs.filter((l) => l.type === "import").length;
    const exports = moduleLogs.filter((l) => l.type === "export").length;

    if (imports === 0 && exports === 0) return null;

    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-2 mt-2">
            <BarChart2 className="h-3.5 w-3.5 shrink-0" />
            <span>Recent:</span>
            {imports > 0 && (
                <span className="text-indigo-600 font-medium">
                    {imports} import{imports > 1 ? "s" : ""}
                </span>
            )}
            {imports > 0 && exports > 0 && <span>·</span>}
            {exports > 0 && (
                <span className="text-emerald-600 font-medium">
                    {exports} export{exports > 1 ? "s" : ""}
                </span>
            )}
        </div>
    );
}

// ─── Recent log row ───────────────────────────────────────────────────────────

function RecentLogRow({ log }: { log: RecentLog }) {
    const sc = STATUS_CONFIG[log.status];
    const StatusIcon = sc.Icon;
    const iconCls = FILE_ICON_COLORS[log.file_icon] ?? FILE_ICON_COLORS.file;

    return (
        <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors">
            {/* File type badge */}
            <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${iconCls}`}
            >
                {log.format || "FILE"}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p
                        className="truncate text-sm font-medium text-foreground max-w-[280px]"
                        title={log.filename}
                    >
                        {log.filename}
                    </p>
                    <span
                        className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                            log.type === "import"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-emerald-100 text-emerald-700"
                        }`}
                    >
                        {log.type === "import" ? "↑ Import" : "↓ Export"}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground">
                    {log.module_label} · {log.imported_by} ·{" "}
                    {log.created_at_human}
                </p>
            </div>

            {/* Rows (import only) */}
            {log.type === "import" && (
                <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-foreground">
                        {log.imported_rows}/{log.total_rows}
                    </p>
                    <p className="text-xs text-muted-foreground">rows</p>
                </div>
            )}

            {/* Progress bar (import only) */}
            {log.type === "import" && (
                <div className="w-20 shrink-0">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${log.success_rate}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 text-right">
                        {log.success_rate}%
                    </p>
                </div>
            )}

            {/* Status badge */}
            <span
                className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${sc.cls}`}
            >
                <StatusIcon className="h-3 w-3" />
                {sc.label}
            </span>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ImportIndex({ recentLogs, can }: Props) {
    const [activeModule, setActiveModule] = useState<ModuleKey | null>(null);
    const [dryRunRows, setDryRunRows] = useState<RowResult[]>([]);
    const [dryRunSummary, setDryRunSummary] = useState<DryRunSummary | null>(
        null,
    );
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [committing, setCommitting] = useState(false);
    const [exporting, setExporting] = useState<string | null>(null);
    const [expandedInfo, setExpandedInfo] = useState<string | null>(null);

    const openImport = (moduleKey: ModuleKey) => {
        setActiveModule(moduleKey);
        setDryRunRows([]);
        setDryRunSummary(null);
        setPendingFile(null);
    };

    const closeImport = () => {
        setActiveModule(null);
        setDryRunRows([]);
        setDryRunSummary(null);
        setPendingFile(null);
    };

    const handleDryRun = async (file: File) => {
        setPendingFile(file);
        setDryRunRows([]);
        setDryRunSummary(null);

        const fd = new FormData();
        fd.append("module", activeModule!);
        fd.append("file", file);

        try {
            const res = await window.axios.post(
                route("backend.import.dry-run"),
                fd,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                },
            );
            setDryRunRows(res.data.results);
            setDryRunSummary(res.data.summary);
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message ??
                    "Could not parse the file. Check the format and try again.",
            );
        }
    };

    const handleCommit = async () => {
        if (!pendingFile || !activeModule) return;
        setCommitting(true);

        const fd = new FormData();
        fd.append("module", activeModule);
        fd.append("file", pendingFile);

        try {
            const res = await window.axios.post(
                route("backend.import.commit"),
                fd,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                },
            );
            toast.success(res.data.message);
            closeImport();
            router.reload({ only: ["recentLogs"] });
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message ??
                    "Import failed. Please try again.",
            );
        } finally {
            setCommitting(false);
        }
    };

    const handleExport = (moduleKey: string, format: "xlsx" | "csv") => {
        const key = moduleKey + format;
        setExporting(key);
        window.location.href =
            route("backend.import.export") +
            `?module=${moduleKey}&format=${format}`;
        setTimeout(() => setExporting(null), 2000);
    };

    const handleTemplate = (moduleKey: string) => {
        window.location.href =
            route("backend.import.template") + `?module=${moduleKey}`;
    };

    const activeModuleConfig = MODULES.find((m) => m.key === activeModule);
    const importCount = recentLogs.filter((l) => l.type === "import").length;
    const exportCount = recentLogs.filter((l) => l.type === "export").length;

    return (
        <AuthenticatedLayout>
            <Head title="Import / Export" />

            <div className="space-y-6">
                {/* ── Page header ── */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <ArrowLeftRight className="h-6 w-6 text-indigo-500" />
                            Import / Export
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground max-w-xl">
                            Bulk import data from Excel or CSV files, or export
                            existing records for backup, reporting, or migration
                            to another system. Always download the sample
                            template first.
                        </p>
                    </div>
                    <button
                        onClick={() =>
                            router.visit(route("backend.import.history"))
                        }
                        className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
                    >
                        <History className="h-4 w-4 text-indigo-500" />
                        View History
                    </button>
                </div>

                {/* ── Summary pills ── */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                        <Upload className="h-3.5 w-3.5 text-indigo-500" />
                        {importCount} recent import
                        {importCount !== 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                        <Download className="h-3.5 w-3.5 text-emerald-500" />
                        {exportCount} recent export
                        {exportCount !== 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                        <Info className="h-3.5 w-3.5" />
                        Always preview before confirming import
                    </div>
                </div>

                {/* ── Module cards ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {MODULES.map((mod) => {
                        const Icon = mod.icon;
                        const modCan = can[mod.key] ?? {
                            import: false,
                            export: false,
                        };
                        const iconCls =
                            ICON_BG[mod.color] ?? "bg-gray-100 text-gray-600";
                        const border =
                            BORDER_ACCENT[mod.color] ?? "border-l-gray-400";
                        const isInfoOpen = expandedInfo === mod.key;

                        return (
                            <div
                                key={mod.key}
                                className={`rounded-xl border border-border border-l-4 ${border} bg-card p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow`}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`rounded-lg p-2.5 ${iconCls}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span className="font-semibold text-foreground">
                                            {mod.label}
                                        </span>
                                    </div>
                                    {/* Info toggle */}
                                    <button
                                        onClick={() =>
                                            setExpandedInfo(
                                                isInfoOpen ? null : mod.key,
                                            )
                                        }
                                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                        title="Show tips"
                                    >
                                        <Info className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {mod.description}
                                </p>

                                {/* Expanded tips */}
                                {isInfoOpen && (
                                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 space-y-2">
                                        {modCan.import && (
                                            <div>
                                                <p className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                                                    <Upload className="h-3 w-3 text-indigo-500" />{" "}
                                                    Import tips
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {mod.importTips}
                                                </p>
                                            </div>
                                        )}
                                        {modCan.export && (
                                            <div>
                                                <p className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                                                    <Download className="h-3 w-3 text-emerald-500" />{" "}
                                                    Export tips
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {mod.exportTips}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex flex-col gap-2 mt-auto">
                                    {/* Import button */}
                                    {modCan.import && (
                                        <button
                                            onClick={() =>
                                                openImport(mod.key as ModuleKey)
                                            }
                                            className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-all duration-150 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Import
                                            <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                                        </button>
                                    )}

                                    {/* Export buttons */}
                                    {modCan.export && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    handleExport(
                                                        mod.key,
                                                        "xlsx",
                                                    )
                                                }
                                                disabled={
                                                    exporting ===
                                                    mod.key + "xlsx"
                                                }
                                                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 transition-all dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
                                            >
                                                <FileSpreadsheet className="h-4 w-4" />
                                                {exporting === mod.key + "xlsx"
                                                    ? "…"
                                                    : "Excel"}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleExport(mod.key, "csv")
                                                }
                                                disabled={
                                                    exporting ===
                                                    mod.key + "csv"
                                                }
                                                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60 transition-all dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                                            >
                                                <Download className="h-4 w-4" />
                                                {exporting === mod.key + "csv"
                                                    ? "…"
                                                    : "CSV"}
                                            </button>
                                        </div>
                                    )}

                                    {/* Template download with tooltip */}
                                    {modCan.import && (
                                        <Tooltip content="Download a blank template with the correct column headers. Fill it in and upload to import.">
                                            <button
                                                onClick={() =>
                                                    handleTemplate(mod.key)
                                                }
                                                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                            >
                                                <FileDown className="h-3.5 w-3.5 shrink-0" />
                                                Download sample template
                                            </button>
                                        </Tooltip>
                                    )}
                                </div>

                                {/* Mini activity stat */}
                                <MiniStatBar
                                    logs={recentLogs}
                                    moduleKey={mod.key}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* ── Recent activity ── */}
                {recentLogs.length > 0 && (
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border px-5 py-3">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">
                                    Recent Activity
                                </span>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    {recentLogs.length}
                                </span>
                            </div>
                            <button
                                onClick={() =>
                                    router.visit(
                                        route("backend.import.history"),
                                    )
                                }
                                className="text-xs text-indigo-600 hover:underline"
                            >
                                View all →
                            </button>
                        </div>
                        <div className="divide-y divide-border">
                            {recentLogs.map((log) => (
                                <RecentLogRow
                                    key={`${log.type}-${log.id}`}
                                    log={log}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {recentLogs.length === 0 && (
                    <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                            <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            No activity yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Import or export data to see recent activity here.
                        </p>
                    </div>
                )}
            </div>

            {/* ── Import slide-over panel ── */}
            {activeModule && activeModuleConfig && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={closeImport}
                    />
                    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-card shadow-2xl">
                        {/* Panel header */}
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`rounded-lg p-2 ${ICON_BG[activeModuleConfig.color]}`}
                                >
                                    <activeModuleConfig.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-foreground">
                                        Import {activeModuleConfig.label}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Upload an Excel or CSV file to preview
                                        before importing.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeImport}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Tips banner */}
                        <div className="border-b border-border bg-muted/30 px-6 py-3">
                            <p className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                    Tip:{" "}
                                </span>
                                {activeModuleConfig.importTips}
                            </p>
                        </div>

                        {/* Panel body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <ImportUploader
                                onFileSelected={handleDryRun}
                                onTemplateDownload={() =>
                                    handleTemplate(activeModule)
                                }
                            />
                            {dryRunSummary && (
                                <DryRunPreview
                                    rows={dryRunRows}
                                    summary={dryRunSummary}
                                />
                            )}
                        </div>

                        {/* Panel footer */}
                        {dryRunSummary &&
                            dryRunSummary.success + dryRunSummary.warnings >
                                0 && (
                                <div className="border-t border-border px-6 py-4 flex items-center justify-between gap-3 bg-card">
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-foreground">
                                            {dryRunSummary.success +
                                                dryRunSummary.warnings}
                                        </span>{" "}
                                        rows will import,{" "}
                                        <span className="font-semibold text-red-600">
                                            {dryRunSummary.errors}
                                        </span>{" "}
                                        will skip.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={closeImport}
                                            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCommit}
                                            disabled={committing}
                                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                                        >
                                            {committing
                                                ? "Importing…"
                                                : "Confirm Import"}
                                        </button>
                                    </div>
                                </div>
                            )}
                    </div>
                </>
            )}
        </AuthenticatedLayout>
    );
}
