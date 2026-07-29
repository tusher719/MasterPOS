import axios from "axios";
import { AlertTriangle, Loader2, ShieldAlert, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DeleteEntityType =
    | "investment"
    | "partner"
    | "sale"
    | "purchase"
    | "distribution"
    | "category"
    | "unit"
    | "expense-category"
    | "supplier"
    | "customer"
    | "user";

interface Dependency {
    label: string;
    count: number;
    blocking: boolean;
}

interface PreviewData {
    can_delete: boolean;
    entity_label: string;
    dependencies: Dependency[];
    warnings: string[];
}

interface Props {
    /** Entity type slug — matches backend resolveModel() */
    entityType: DeleteEntityType;
    /** Entity primary key */
    entityId: number;
    /** Called when user confirms delete */
    onConfirm: () => void;
    /** Called when modal closes (cancel or backdrop) */
    onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ConfirmDeleteModal({
    entityType,
    entityId,
    onConfirm,
    onClose,
}: Props) {
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    // Fetch dependency preview from backend
    useEffect(() => {
        setLoading(true);
        setFetchError(false);

        axios
            .get<PreviewData>(
                route("backend.delete-preview", {
                    type: entityType,
                    id: entityId,
                }),
            )
            .then((res) => setPreview(res.data))
            .catch(() => setFetchError(true))
            .finally(() => setLoading(false));
    }, [entityType, entityId]);

    const hasBlockingDeps =
        preview?.dependencies.some((d) => d.blocking) ?? false;

    const canDelete = preview?.can_delete && !hasBlockingDeps;

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-red-500" />
                        <h2 className="text-base font-semibold text-gray-800">
                            Confirm Delete
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                            <span className="ml-2 text-sm text-gray-500">
                                Checking dependencies…
                            </span>
                        </div>
                    )}

                    {/* Fetch error */}
                    {!loading && fetchError && (
                        <div className="flex items-center gap-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            Failed to load dependency information. Please try
                            again.
                        </div>
                    )}

                    {/* Preview loaded */}
                    {!loading && !fetchError && preview && (
                        <div className="space-y-4">
                            {/* Entity label */}
                            <p className="text-sm text-gray-700">
                                You are about to delete{" "}
                                <span className="font-medium">
                                    {preview.entity_label}
                                </span>
                                .
                            </p>

                            {/* Dependencies table */}
                            {preview.dependencies.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Related Records
                                    </p>
                                    <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
                                        {preview.dependencies.map((dep, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between px-3 py-2"
                                            >
                                                <span className="text-sm text-gray-700">
                                                    {dep.label}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {dep.count.toLocaleString()}
                                                    </span>
                                                    {dep.blocking ? (
                                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                                            Blocking
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                                            Preserved
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Warnings */}
                            {preview.warnings.length > 0 && (
                                <div className="space-y-2">
                                    {preview.warnings.map((w, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800"
                                        >
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                            {w}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Blocked state */}
                            {!canDelete && (
                                <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-3 text-sm text-red-700">
                                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="font-medium">
                                            Delete blocked
                                        </p>
                                        <p className="mt-0.5 text-xs">
                                            Resolve blocking dependencies before
                                            deleting this record.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>

                    {!loading && !fetchError && canDelete && (
                        <button
                            onClick={() => {
                                onClose();
                                onConfirm();
                            }}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
