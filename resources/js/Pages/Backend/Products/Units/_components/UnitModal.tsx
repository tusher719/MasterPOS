import { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Unit {
    id: number;
    name: string;
    short_code: string;
    is_active: boolean;
}

interface Props {
    open: boolean;
    editing: Unit | null;
    onClose: () => void;
}

export default function UnitModal({ open, editing, onClose }: Props) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: "",
            short_code: "",
            is_active: true,
        });

    useEffect(() => {
        if (!open) return;
        clearErrors();
        setData({
            name: editing?.name ?? "",
            short_code: editing?.short_code ?? "",
            is_active: editing?.is_active ?? true,
        });
    }, [open, editing]);

    const submit = () => {
        const options = {
            onSuccess: () => {
                toast.success(editing ? "Unit updated." : "Unit created.");
                reset();
                onClose();
            },
            onError: () => toast.error("Please fix the errors below."),
        };

        if (editing) {
            put(route("backend.units.update", editing.id), options);
        } else {
            post(route("backend.units.store"), options);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm bg-white rounded-lg shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-gray-800">
                        {editing ? "Edit Unit" : "Add Unit"}
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
                            placeholder="e.g. Kilogram"
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Short Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Short Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.short_code}
                            onChange={(e) =>
                                setData(
                                    "short_code",
                                    e.target.value.toLowerCase(),
                                )
                            }
                            className="w-full rounded-md border-gray-300 font-mono text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="e.g. kg"
                            maxLength={20}
                        />
                        {errors.short_code && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.short_code}
                            </p>
                        )}
                    </div>

                    {/* Status toggle */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                setData("is_active", !data.is_active)
                            }
                            className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                data.is_active ? "bg-indigo-600" : "bg-gray-200"
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
                        <span className="text-sm text-gray-600">Active</span>
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
