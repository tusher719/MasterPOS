import { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { X, Upload, Paperclip, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

interface InvestmentType {
    id: number;
    name: string;
}

interface Investment {
    id: number;
    title: string;
    investor_name: string;
    amount: string;
    investment_date: string;
    reference: string | null;
    attachment: string | null;
    attachment_url: string | null;
    note: string | null;
    status: "active" | "withdrawn";
    investment_type_id?: number;
    investment_type: InvestmentType;
}

interface Props {
    investment: Investment | null;
    investmentTypes: InvestmentType[];
    onClose: () => void;
}

interface FormData {
    investment_type_id: string;
    title: string;
    investor_name: string;
    amount: string;
    investment_date: string;
    reference: string;
    note: string;
    status: "active" | "withdrawn";
    attachment: File | null;
}

interface ImageMeta {
    width: number;
    height: number;
}

const empty: FormData = {
    investment_type_id: "",
    title: "",
    investor_name: "",
    amount: "",
    investment_date: "",
    reference: "",
    note: "",
    status: "active",
    attachment: null,
};

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp)$/i;

function isImageFilename(name: string | null | undefined): boolean {
    return !!name && IMAGE_EXT_RE.test(name);
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function InvestmentModal({
    investment,
    investmentTypes,
    onClose,
}: Props) {
    const isEditing = !!investment;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<FormData>(empty);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [processing, setProcessing] = useState(false);
    const [removeAttachment, setRemoveAttachment] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [newImageMeta, setNewImageMeta] = useState<ImageMeta | null>(null);
    const [existingImageMeta, setExistingImageMeta] =
        useState<ImageMeta | null>(null);

    // Populate form when editing
    useEffect(() => {
        if (investment) {
            setForm({
                investment_type_id: String(
                    investment.investment_type_id ??
                        investment.investment_type?.id ??
                        "",
                ),
                title: investment.title,
                investor_name: investment.investor_name,
                amount: investment.amount,
                investment_date: investment.investment_date?.slice(0, 10) ?? "",
                reference: investment.reference ?? "",
                note: investment.note ?? "",
                status: investment.status,
                attachment: null,
            });
        } else {
            setForm(empty);
        }
        setErrors({});
        setRemoveAttachment(false);
        setPreviewUrl(null);
        setNewImageMeta(null);
        setExistingImageMeta(null);
    }, [investment]);

    function set<K extends keyof FormData>(key: K, value: FormData[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        set("attachment", file);
        setRemoveAttachment(false);
        setNewImageMeta(null);
        if (file && file.type.startsWith("image/")) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
    }

    function handleRemoveNewFile() {
        set("attachment", null);
        setPreviewUrl(null);
        setNewImageMeta(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleRemoveExistingAttachment() {
        setRemoveAttachment(true);
    }

    function handleSubmit() {
        setProcessing(true);
        setErrors({});

        const data = new FormData();
        data.append("investment_type_id", form.investment_type_id);
        data.append("title", form.title);
        data.append("investor_name", form.investor_name);
        data.append("amount", form.amount);
        data.append("investment_date", form.investment_date);
        data.append("reference", form.reference);
        data.append("note", form.note);
        data.append("status", form.status);

        if (form.attachment) {
            data.append("attachment", form.attachment);
        }

        if (isEditing && removeAttachment) {
            data.append("remove_attachment", "1");
        }

        if (isEditing) {
            data.append("_method", "PUT");
        }

        router.post(
            isEditing
                ? route("backend.investments.update", investment!.id)
                : route("backend.investments.store"),
            data,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        isEditing
                            ? "Investment updated successfully."
                            : "Investment created successfully.",
                    );
                    onClose();
                },
                onError: (errs) => {
                    setErrors(errs as any);
                    setProcessing(false);
                },
                onFinish: () => setProcessing(false),
            },
        );
    }

    const existingAttachmentUrl = investment?.attachment_url ?? null;
    const existingAttachmentName =
        investment?.attachment?.split("/").pop() ?? null;
    const existingIsImage = isImageFilename(existingAttachmentName);
    const showExistingAttachment =
        isEditing && existingAttachmentUrl && !removeAttachment;
    const hasNewFile = !!form.attachment;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-xl mx-4 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-gray-800">
                        {isEditing ? "Edit Investment" : "Add Investment"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-5 py-4 space-y-4">
                    {/* Investment Type */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Investment Type{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.investment_type_id}
                            onChange={(e) =>
                                set("investment_type_id", e.target.value)
                            }
                            className={`w-full rounded-md border text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                errors.investment_type_id
                                    ? "border-red-300"
                                    : "border-gray-300"
                            }`}
                        >
                            <option value="">Select type...</option>
                            {investmentTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                        {errors.investment_type_id && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.investment_type_id}
                            </p>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            placeholder="e.g. Initial Capital Injection"
                            className={`w-full rounded-md border text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                errors.title
                                    ? "border-red-300"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.title && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    {/* Investor Name */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Investor Name{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.investor_name}
                            onChange={(e) =>
                                set("investor_name", e.target.value)
                            }
                            placeholder="e.g. Md. Rahim Uddin"
                            className={`w-full rounded-md border text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                errors.investor_name
                                    ? "border-red-300"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.investor_name && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.investor_name}
                            </p>
                        )}
                    </div>

                    {/* Amount + Date (2 cols) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Amount <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.amount}
                                onChange={(e) => set("amount", e.target.value)}
                                placeholder="0.00"
                                className={`w-full rounded-md border text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                    errors.amount
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                            />
                            {errors.amount && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.amount}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Investment Date{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.investment_date}
                                onChange={(e) =>
                                    set("investment_date", e.target.value)
                                }
                                className={`w-full rounded-md border text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                    errors.investment_date
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                            />
                            {errors.investment_date && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.investment_date}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Reference + Status (2 cols) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Transaction Reference
                            </label>
                            <input
                                type="text"
                                value={form.reference}
                                onChange={(e) =>
                                    set("reference", e.target.value)
                                }
                                placeholder="e.g. TRX-20250706"
                                className={`w-full rounded-md border text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                    errors.reference
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                            />
                            {errors.reference && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.reference}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.status}
                                onChange={(e) =>
                                    set(
                                        "status",
                                        e.target.value as
                                            | "active"
                                            | "withdrawn",
                                    )
                                }
                                className={`w-full rounded-md border text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                    errors.status
                                        ? "border-red-300"
                                        : "border-gray-300"
                                }`}
                            >
                                <option value="active">Active</option>
                                <option value="withdrawn">Withdrawn</option>
                            </select>
                            {errors.status && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.status}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Note
                        </label>
                        <textarea
                            rows={3}
                            value={form.note}
                            onChange={(e) => set("note", e.target.value)}
                            placeholder="Optional notes about this investment..."
                            className={`w-full rounded-md border text-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none ${
                                errors.note
                                    ? "border-red-300"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.note && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.note}
                            </p>
                        )}
                    </div>

                    {/* Attachment */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Attachment
                        </label>
                        <p className="mb-2 text-xs text-gray-400">
                            Accepted: jpg, png, gif, webp, pdf, doc, docx, xlsx
                            — max 5MB
                        </p>

                        {/* Existing + New preview (side by side when both present) */}
                        {(showExistingAttachment || hasNewFile) && (
                            <div
                                className={`mb-2 grid gap-3 ${
                                    showExistingAttachment && hasNewFile
                                        ? "grid-cols-2"
                                        : "grid-cols-1"
                                }`}
                            >
                                {/* Current / existing attachment */}
                                {showExistingAttachment && (
                                    <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
                                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                            {hasNewFile
                                                ? "Current"
                                                : "Current File"}
                                        </p>
                                        {existingIsImage ? (
                                            <img
                                                src={existingAttachmentUrl!}
                                                alt="Current attachment"
                                                onLoad={(e) =>
                                                    setExistingImageMeta({
                                                        width: e.currentTarget
                                                            .naturalWidth,
                                                        height: e.currentTarget
                                                            .naturalHeight,
                                                    })
                                                }
                                                className="mb-1.5 h-24 w-full rounded border border-gray-200 object-contain bg-white"
                                            />
                                        ) : (
                                            <div className="mb-1.5 flex h-24 w-full items-center justify-center rounded border border-gray-200 bg-white">
                                                <FileText className="h-8 w-8 text-gray-300" />
                                            </div>
                                        )}
                                        <p className="truncate text-xs text-gray-600">
                                            {existingAttachmentName}
                                        </p>
                                        {existingIsImage && existingImageMeta && (
                                            <p className="text-[11px] text-gray-400">
                                                {existingImageMeta.width}×
                                                {existingImageMeta.height}px
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={
                                                handleRemoveExistingAttachment
                                            }
                                            className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-600"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Remove
                                        </button>
                                    </div>
                                )}

                                {/* New file selected */}
                                {hasNewFile && (
                                    <div className="rounded-md border border-indigo-200 bg-indigo-50 p-2">
                                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
                                            New File
                                        </p>
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="New attachment preview"
                                                onLoad={(e) =>
                                                    setNewImageMeta({
                                                        width: e.currentTarget
                                                            .naturalWidth,
                                                        height: e.currentTarget
                                                            .naturalHeight,
                                                    })
                                                }
                                                className="mb-1.5 h-24 w-full rounded border border-indigo-200 object-contain bg-white"
                                            />
                                        ) : (
                                            <div className="mb-1.5 flex h-24 w-full items-center justify-center rounded border border-indigo-200 bg-white">
                                                <FileText className="h-8 w-8 text-indigo-300" />
                                            </div>
                                        )}
                                        <p className="truncate text-xs text-indigo-700">
                                            {form.attachment!.name}
                                        </p>
                                        <p className="text-[11px] text-indigo-400">
                                            {formatBytes(form.attachment!.size)}
                                            {previewUrl && newImageMeta && (
                                                <>
                                                    {" "}
                                                    · {newImageMeta.width}×
                                                    {newImageMeta.height}px
                                                </>
                                            )}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleRemoveNewFile}
                                            className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-600"
                                        >
                                            <X className="h-3 w-3" />
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Upload button */}
                        {!hasNewFile && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500 hover:bg-gray-100 hover:border-gray-400"
                            >
                                <Upload className="h-4 w-4" />
                                {showExistingAttachment
                                    ? "Click to replace file"
                                    : "Click to upload file"}
                            </button>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xlsx"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {errors.attachment && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.attachment}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing
                            ? isEditing
                                ? "Saving..."
                                : "Creating..."
                            : isEditing
                              ? "Save Changes"
                              : "Add Investment"}
                    </button>
                </div>
            </div>
        </div>
    );
}
