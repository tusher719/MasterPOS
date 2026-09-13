import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, FileSpreadsheet, X, RotateCcw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    onFileSelected: (file: File) => Promise<void>;
    onTemplateDownload: () => void;
}

type FileStatus = 'idle' | 'uploading' | 'complete' | 'error';

interface FileEntry {
    file: File;
    status: FileStatus;
    progress: number;
    errorMsg?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtBadgeColor(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'xlsx' || ext === 'xls') return 'bg-emerald-100 text-emerald-700';
    if (ext === 'csv') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
}

function getExt(name: string): string {
    return (name.split('.').pop()?.toUpperCase()) ?? 'FILE';
}

const ACCEPTED = '.xlsx,.xls,.csv';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportUploader({ onFileSelected, onTemplateDownload }: Props) {
    const inputRef              = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [entry, setEntry]       = useState<FileEntry | null>(null);

    // ── Validate + kick off processing ──
    const processFile = useCallback(async (file: File) => {
        // Type check
        const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         'application/vnd.ms-excel', 'text/csv', 'application/csv'];
        const extOk   = /\.(xlsx|xls|csv)$/i.test(file.name);

        if (!extOk && !allowed.includes(file.type)) {
            setEntry({ file, status: 'error', progress: 0, errorMsg: 'Only .xlsx, .xls and .csv files are accepted.' });
            return;
        }

        if (file.size > MAX_BYTES) {
            setEntry({ file, status: 'error', progress: 0, errorMsg: `File too large (max 5 MB). Your file is ${formatBytes(file.size)}.` });
            return;
        }

        // Start upload animation
        setEntry({ file, status: 'uploading', progress: 0 });

        // Animate progress bar to ~85% while waiting for server response
        let pct = 0;
        const tick = setInterval(() => {
            pct = Math.min(pct + Math.random() * 12, 85);
            setEntry(prev => prev ? { ...prev, progress: Math.round(pct) } : prev);
        }, 120);

        try {
            await onFileSelected(file);
            clearInterval(tick);
            setEntry(prev => prev ? { ...prev, status: 'complete', progress: 100 } : prev);
        } catch {
            clearInterval(tick);
            setEntry(prev => prev ? { ...prev, status: 'error', progress: 0, errorMsg: 'Something went wrong. Please try again.' } : prev);
        }
    }, [onFileSelected]);

    // ── Input change ──
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = ''; // reset so same file can be re-picked
    };

    // ── Drag events ──
    const handleDragOver  = (e: DragEvent) => { e.preventDefault(); setDragging(true);  };
    const handleDragLeave = (e: DragEvent) => { e.preventDefault(); setDragging(false); };
    const handleDrop      = (e: DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const retryFile = () => {
        if (entry?.file) processFile(entry.file);
    };

    const removeFile = () => {
        setEntry(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    // ── Status helpers ──
    const statusIcon = (status: FileStatus) => {
        if (status === 'uploading') return <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />;
        if (status === 'complete')  return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        if (status === 'error')     return <AlertCircle className="h-4 w-4 text-red-500" />;
        return null;
    };

    const progressBarColor = (status: FileStatus) => {
        if (status === 'complete') return 'bg-emerald-500';
        if (status === 'error')    return 'bg-red-500';
        return 'bg-indigo-500';
    };

    const statusLabel = (status: FileStatus) => {
        if (status === 'uploading') return 'Analysing…';
        if (status === 'complete')  return 'Analysis complete';
        if (status === 'error')     return 'Failed';
        return '';
    };

    return (
        <div className="space-y-4">

            {/* ── Drop zone ── */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !entry && inputRef.current?.click()}
                className={[
                    'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-200',
                    dragging
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 scale-[1.01]'
                        : entry
                        ? 'border-border bg-muted/30 cursor-default'
                        : 'border-border bg-muted/20 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 cursor-pointer',
                ].join(' ')}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED}
                    onChange={handleChange}
                    className="hidden"
                />

                {/* Upload icon with animated ring when dragging */}
                <div className={[
                    'mb-3 flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200',
                    dragging ? 'bg-indigo-100 ring-4 ring-indigo-200 dark:bg-indigo-900/30' : 'bg-muted',
                ].join(' ')}>
                    <Upload className={`h-6 w-6 transition-colors duration-200 ${dragging ? 'text-indigo-600' : 'text-muted-foreground'}`} />
                </div>

                <p className="text-sm font-medium text-foreground">
                    {dragging
                        ? 'Drop your file here'
                        : entry
                        ? 'File uploaded — see results below'
                        : <><span className="text-indigo-600">Click to upload</span> or drag and drop</>
                    }
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    .xlsx, .xls or .csv · max 5 MB
                </p>

                {/* Template link */}
                {!entry && (
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onTemplateDownload(); }}
                        className="mt-3 text-xs text-indigo-600 hover:underline"
                    >
                        ↓ Download sample template
                    </button>
                )}
            </div>

            {/* ── File entry row (UntitledUI style) ── */}
            {entry && (
                <div className={[
                    'rounded-xl border p-4 transition-all duration-200',
                    entry.status === 'error'
                        ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                        : 'border-border bg-card',
                ].join(' ')}>
                    <div className="flex items-start gap-3">
                        {/* File type badge */}
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${getExtBadgeColor(entry.file.name)}`}>
                            {getExt(entry.file.name)}
                        </div>

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium text-foreground">{entry.file.name}</p>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {statusIcon(entry.status)}
                                    <span className={`text-xs font-medium ${
                                        entry.status === 'complete' ? 'text-emerald-600' :
                                        entry.status === 'error'   ? 'text-red-600'     :
                                        'text-muted-foreground'
                                    }`}>
                                        {statusLabel(entry.status)}
                                    </span>
                                </div>
                            </div>

                            <p className="mt-0.5 text-xs text-muted-foreground">{formatBytes(entry.file.size)}</p>

                            {/* Error message */}
                            {entry.status === 'error' && entry.errorMsg && (
                                <p className="mt-1 text-xs text-red-600">{entry.errorMsg}</p>
                            )}

                            {/* Progress bar */}
                            {entry.status !== 'idle' && (
                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${progressBarColor(entry.status)}`}
                                        style={{ width: `${entry.progress}%` }}
                                    />
                                </div>
                            )}

                            {/* Progress percent */}
                            {entry.status === 'uploading' && (
                                <p className="mt-1 text-right text-xs text-muted-foreground">{entry.progress}%</p>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex shrink-0 items-center gap-1">
                            {entry.status === 'error' && (
                                <button
                                    onClick={retryFile}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                                    title="Try again"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                onClick={removeFile}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                                title="Remove"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
