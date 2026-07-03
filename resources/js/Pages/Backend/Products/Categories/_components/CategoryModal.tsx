import { useEffect, useRef, useState } from "react";
import { useForm } from "@inertiajs/react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    image: string | null;
    description: string | null;
    sort_order: number;
    is_active: boolean;
}

interface Parent {
    id: number;
    name: string;
}

interface Props {
    open: boolean;
    editing: Category | null;
    parents: Parent[];
    onClose: () => void;
}

export default function CategoryModal({
    open,
    editing,
    parents,
    onClose,
}: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<{
            name: string;
            parent_id: string;
            description: string;
            sort_order: string;
            is_active: boolean;
            image: File | null;
        }>({
            name: "",
            parent_id: "",
            description: "",
            sort_order: "0",
            is_active: true,
            image: null,
        });

    useEffect(() => {
        if (!open) return;
        clearErrors();
        setPreview(editing?.image ?? null);
        setData({
            name: editing?.name ?? "",
            parent_id: editing?.parent_id?.toString() ?? "",
            description: editing?.description ?? "",
            sort_order: editing?.sort_order?.toString() ?? "0",
            is_active: editing?.is_active ?? true,
            image: null,
        });
    }, [open, editing]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData("image", file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const submit = () => {
        const options = {
            forceFormData: true,
            onSuccess: () => {
                toast.success(
                    editing ? "Category updated." : "Category created.",
                );
                reset();
                onClose();
            },
            onError: () => toast.error("Please fix the errors below."),
        };

        if (editing) {
            post(
                route("backend.product-categories.update", editing.id) +
                    "?_method=PUT",
                options,
            );
        } else {
            post(route("backend.product-categories.store"), options);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-gray-800">
                        {editing ? "Edit Category" : "Add Category"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Category name"
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Parent */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Parent Category
                        </label>
                        <select
                            value={data.parent_id}
                            onChange={(e) =>
                                setData("parent_id", e.target.value)
                            }
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">— Top level —</option>
                            {parents
                                .filter((p) => p.id !== editing?.id)
                                .map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                        </select>
                        {errors.parent_id && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.parent_id}
                            </p>
                        )}
                    </div>

                    {/* Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Image
                        </label>
                        <div className="flex items-center gap-3">
                            {preview && (
                                <img
                                    src={preview}
                                    alt="preview"
                                    className="h-12 w-12 rounded-md object-cover border border-gray-100"
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                {preview ? "Change Image" : "Upload Image"}
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpg,image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleFile}
                            />
                        </div>
                        {errors.image && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.image}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            rows={2}
                            className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Optional description"
                        />
                    </div>

                    {/* Sort Order + Status */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sort Order
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={data.sort_order}
                                onChange={(e) =>
                                    setData("sort_order", e.target.value)
                                }
                                className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                            <button
                                type="button"
                                onClick={() =>
                                    setData("is_active", !data.is_active)
                                }
                                className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    data.is_active
                                        ? "bg-indigo-600"
                                        : "bg-gray-200"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                        data.is_active
                                            ? "translate-x-6"
                                            : "translate-x-1"
                                    }`}
                                />
                            </button>
                            <span className="text-sm text-gray-600">
                                Active
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {processing
                            ? "Saving..."
                            : editing
                              ? "Update"
                              : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
}
