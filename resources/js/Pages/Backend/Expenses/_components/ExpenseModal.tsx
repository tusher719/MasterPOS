import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

interface ExpenseCategory {
    id: number;
    name: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface Expense {
    id: number;
    reference_no: string;
    title: string;
    expense_category_id: number;
    payment_method_id: number | null;
    amount: string;
    expense_date: string;
    reference: string | null;
    attachment: string | null;
    attachment_url: string | null;
    attachment_mime: string | null;
    note: string | null;
}

interface Props {
    expense: Expense | null;
    categories: ExpenseCategory[];
    paymentMethods: PaymentMethod[];
    onClose: () => void;
}

interface FormData {
    title: string;
    expense_category_id: string;
    payment_method_id: string;
    amount: string;
    expense_date: string;
    reference: string;
    note: string;
}

interface FormErrors {
    title?: string;
    expense_category_id?: string;
    payment_method_id?: string;
    amount?: string;
    expense_date?: string;
    reference?: string;
    attachment?: string;
    note?: string;
}

const defaultForm: FormData = {
    title: "",
    expense_category_id: "",
    payment_method_id: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    reference: "",
    note: "",
};

export default function ExpenseModal({
    expense,
    categories,
    paymentMethods,
    onClose,
}: Props) {
    const isEditing = expense !== null;

    const [form, setForm] = useState<FormData>(defaultForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [processing, setProcessing] = useState(false);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [removeAttachment, setRemoveAttachment] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Populate form when editing
    useEffect(() => {
        if (expense) {
            setForm({
                title: expense.title,
                expense_category_id: String(expense.expense_category_id),
                payment_method_id: expense.payment_method_id
                    ? String(expense.payment_method_id)
                    : "",
                amount: expense.amount,
                expense_date: expense.expense_date.split("T")[0],
                reference: expense.reference ?? "",
                note: expense.note ?? "",
            });
            setPreviewUrl(expense.attachment_url ?? null);
        } else {
            setForm(defaultForm);
            setPreviewUrl(null);
        }
        setErrors({});
        setAttachmentFile(null);
        setRemoveAttachment(false);
    }, [expense]);

    function handleChange(
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setAttachmentFile(file);
        setRemoveAttachment(false);

        if (file) {
            if (file.type.startsWith("image/")) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }
        }
        if (errors.attachment) {
            setErrors((prev) => ({ ...prev, attachment: undefined }));
        }
    }

    function handleRemoveAttachment() {
        setAttachmentFile(null);
        setRemoveAttachment(true);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function validate(): boolean {
        const errs: FormErrors = {};

        if (!form.title.trim()) errs.title = "Title is required.";
        if (!form.expense_category_id)
            errs.expense_category_id = "Category is required.";
        if (!form.amount || Number(form.amount) <= 0)
            errs.amount = "Amount must be greater than zero.";
        if (!form.expense_date) errs.expense_date = "Expense date is required.";

        if (attachmentFile) {
            const allowed = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];
            if (!allowed.includes(attachmentFile.type)) {
                errs.attachment =
                    "File must be jpeg, png, gif, pdf, doc, or docx.";
            } else if (attachmentFile.size > 2 * 1024 * 1024) {
                errs.attachment = "File size must not exceed 2MB.";
            }
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setProcessing(true);

        // Use FormData to support file upload
        const payload = new FormData();
        payload.append("title", form.title);
        payload.append("expense_category_id", form.expense_category_id);
        payload.append("payment_method_id", form.payment_method_id);
        payload.append("amount", form.amount);
        payload.append("expense_date", form.expense_date);
        payload.append("reference", form.reference);
        payload.append("note", form.note);

        if (attachmentFile) {
            payload.append("attachment", attachmentFile);
        }
        if (isEditing && removeAttachment) {
            payload.append("remove_attachment", "1");
        }

        if (isEditing) {
            payload.append("_method", "PUT");
            router.post(
                route("backend.expenses.update", expense!.id),
                payload,
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success("Expense updated successfully.");
                        onClose();
                    },
                    onError: (errs) => {
                        setErrors(errs as FormErrors);
                        toast.error("Please fix the errors below.");
                    },
                    onFinish: () => setProcessing(false),
                },
            );
        } else {
            router.post(route("backend.expenses.store"), payload, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Expense recorded successfully.");
                    onClose();
                },
                onError: (errs) => {
                    setErrors(errs as FormErrors);
                    toast.error("Please fix the errors below.");
                },
                onFinish: () => setProcessing(false),
            });
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-gray-800">
                        {isEditing ? "Edit Expense" : "Add New Expense"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
                        {/* Title */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g. Office Rent — July 2026"
                                className={`w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                    errors.title ? "border-red-300" : ""
                                }`}
                            />
                            {errors.title && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* Category + Payment method */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Category{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="expense_category_id"
                                    value={form.expense_category_id}
                                    onChange={handleChange}
                                    className={`w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                        errors.expense_category_id
                                            ? "border-red-300"
                                            : ""
                                    }`}
                                >
                                    <option value="">Select category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.expense_category_id && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.expense_category_id}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Payment Method
                                </label>
                                <select
                                    name="payment_method_id"
                                    value={form.payment_method_id}
                                    onChange={handleChange}
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">Select method</option>
                                    {paymentMethods.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Amount + Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Amount (৳){" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={form.amount}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0.01"
                                    step="0.01"
                                    className={`w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                        errors.amount ? "border-red-300" : ""
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
                                    Expense Date{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="expense_date"
                                    value={form.expense_date}
                                    onChange={handleChange}
                                    className={`w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                        errors.expense_date
                                            ? "border-red-300"
                                            : ""
                                    }`}
                                />
                                {errors.expense_date && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.expense_date}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Transaction reference */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Transaction / Reference No
                            </label>
                            <input
                                type="text"
                                name="reference"
                                value={form.reference}
                                onChange={handleChange}
                                placeholder="e.g. TXN-123456, Cheque #001"
                                className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Attachment */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Attachment
                                <span className="ml-1 text-xs font-normal text-gray-400">
                                    (jpeg, png, gif, pdf, doc, docx — max 2MB)
                                </span>
                            </label>

                            {/* Existing attachment preview */}
                            {isEditing &&
                                expense?.attachment &&
                                !removeAttachment &&
                                !attachmentFile && (
                                    <div className="mb-2 flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                                        {expense.attachment_mime?.startsWith(
                                            "image/",
                                        ) ? (
                                            <img
                                                src={expense.attachment_url!}
                                                alt="attachment"
                                                className="h-10 w-10 rounded object-cover"
                                            />
                                        ) : (
                                            <svg
                                                className="h-8 w-8 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                        )}
                                        <span className="flex-1 truncate text-xs text-gray-600">
                                            {expense.attachment
                                                .split("/")
                                                .pop()}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleRemoveAttachment}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}

                            {/* New file preview */}
                            {attachmentFile && previewUrl && (
                                <div className="mb-2">
                                    <img
                                        src={previewUrl}
                                        alt="preview"
                                        className="h-20 w-20 rounded-md object-cover border border-gray-200"
                                    />
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".jpeg,.jpg,.png,.gif,.pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="w-full rounded-md border border-gray-300 text-sm text-gray-600 file:mr-3 file:rounded-l-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:text-gray-700 hover:file:bg-gray-200"
                            />
                            {errors.attachment && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.attachment}
                                </p>
                            )}
                        </div>

                        {/* Note */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Note
                            </label>
                            <textarea
                                name="note"
                                value={form.note}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Additional details about this expense…"
                                className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {processing
                                ? isEditing
                                    ? "Updating…"
                                    : "Saving…"
                                : isEditing
                                  ? "Update Expense"
                                  : "Save Expense"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
