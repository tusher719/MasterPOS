import { ImageIcon, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    // Current image URL — pass existing URL on edit mode so preview shows immediately.
    value?: string | null;

    // Called when user picks a file. null = file cleared.
    onChange: (file: File | null) => void;

    // Called when user clicks the remove/clear button.
    onClear?: () => void;

    // File types accepted by the native file picker. Default: "image/*"
    accept?: string;

    // Max file size in MB. Shows error when exceeded. Default: 2
    maxSizeMB?: number;

    // When true, preview is rendered as a circle — suitable for profile photos.
    circular?: boolean;

    // Optional label shown above the drop zone.
    label?: string;

    // Optional hint text shown below the drop zone.
    hint?: string;

    // Upload progress 0–100. Parent drives this from axios onUploadProgress callback.
    // When > 0 and < 100, a progress bar is shown below the preview.
    progress?: number;

    // Disable all interaction.
    disabled?: boolean;

    // Error message from server-side validation.
    error?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageUploadInput({
    value,
    onChange,
    onClear,
    accept = "image/*",
    maxSizeMB = 2,
    circular = false,
    label,
    hint,
    progress = 0,
    disabled = false,
    error,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(value ?? null);
    const [dragging, setDragging] = useState(false);
    const [sizeError, setSizeError] = useState<string | null>(null);

    const shapeClass = circular ? "rounded-full" : "rounded-xl";
    const showProgress = progress > 0 && progress < 100;
    const displayError = error ?? sizeError;

    // Validate size and generate instant client-side preview via FileReader.
    const processFile = (file: File) => {
        setSizeError(null);

        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            setSizeError(
                `File too large — max ${maxSizeMB} MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB)`,
            );
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        onChange(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        // Reset so re-picking the same file fires onChange again.
        e.target.value = "";
    };

    const handleClear = () => {
        setPreview(null);
        setSizeError(null);
        onChange(null);
        onClear?.();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
    };

    const handleDragLeave = () => setDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    return (
        <div className="space-y-2">
            {label && (
                <p className="text-sm font-medium text-foreground">{label}</p>
            )}

            <div className="relative">
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    disabled={disabled}
                    onChange={handleInputChange}
                />

                {preview ? (
                    /* ── Preview state ─────────────────────────────────────── */
                    <div className="relative inline-block">
                        <img
                            src={preview}
                            alt="Upload preview"
                            className={`h-24 w-24 border-2 border-border object-contain p-1 ${shapeClass}`}
                        />

                        {/* Clear button — top-right corner */}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                title="Remove image"
                                className="absolute -right-2 -top-2 flex h-5 w-5 items-center
                                           justify-center rounded-full bg-red-500 text-white
                                           shadow hover:bg-red-600"
                            >
                                <X size={11} />
                            </button>
                        )}

                        {/* Change overlay on hover */}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className={`absolute inset-0 flex items-center justify-center
                                           bg-black/40 opacity-0 transition-opacity
                                           hover:opacity-100 ${shapeClass}`}
                                title="Change image"
                            >
                                <Upload size={18} className="text-white" />
                            </button>
                        )}

                        {/* Progress bar during upload */}
                        {showProgress && (
                            <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Drop zone state ───────────────────────────────────── */
                    <button
                        type="button"
                        onClick={() => !disabled && inputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        disabled={disabled}
                        className={`flex h-24 w-24 flex-col items-center justify-center gap-1.5
                                   border-2 border-dashed transition-colors
                                   ${shapeClass}
                                   ${
                                       dragging
                                           ? "border-indigo-400 bg-indigo-50"
                                           : displayError
                                             ? "border-red-300 bg-red-50"
                                             : "border-border bg-muted/40 hover:border-indigo-400 hover:bg-indigo-50/50"
                                   }
                                   ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    >
                        <ImageIcon
                            size={20}
                            className={
                                dragging
                                    ? "text-indigo-500"
                                    : "text-muted-foreground"
                            }
                        />
                        <span className="text-center text-[11px] leading-tight text-muted-foreground">
                            {dragging ? "Drop here" : "Click or drag"}
                        </span>
                    </button>
                )}
            </div>

            {hint && !displayError && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}

            {displayError && (
                <p className="text-xs text-red-500">{displayError}</p>
            )}
        </div>
    );
}
