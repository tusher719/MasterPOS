import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ExpenseModal from "./_components/ExpenseModal";
import useFlashToast from "@/hooks/useFlashToast";
import { confirmAction } from "@/lib/confirm";
import { toast } from "sonner";

interface ExpenseCategory {
    id: number;
    name: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface User {
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
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    category: ExpenseCategory;
    payment_method: PaymentMethod | null;
    creator: User;
    updater: User | null;
}

interface Can {
    edit: boolean;
    delete: boolean;
}

interface Props {
    expense: Expense;
    can: Can;
    categories: ExpenseCategory[];
    paymentMethods: PaymentMethod[];
}

function formatAmount(value: string | number): string {
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value));
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function formatDateTime(value: string): string {
    return new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function isImage(mime: string | null): boolean {
    return !!mime && mime.startsWith("image/");
}

function isPdf(mime: string | null): boolean {
    return mime === "application/pdf";
}

interface DetailRowProps {
    label: string;
    children: React.ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
    return (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start">
            <span className="w-44 shrink-0 text-sm font-medium text-gray-500">
                {label}
            </span>
            <span className="text-sm text-gray-800">{children}</span>
        </div>
    );
}

export default function ExpenseShow({
    expense,
    can,
    categories,
    paymentMethods,
}: Props) {
    useFlashToast();

    const [showEditModal, setShowEditModal] = useState(false);

    async function handleDelete() {
        const ok = await confirmAction({
            title: "Delete Expense?",
            text: `"${expense.title}" will be moved to trash.`,
            confirmButtonText: "Yes, delete",
        });
        if (!ok) return;

        router.delete(route("backend.expenses.destroy", expense.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Expense moved to trash.");
                router.visit(route("backend.expenses.index"));
            },
            onError: () => toast.error("Failed to delete expense."),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Expense — ${expense.reference_no}`} />

            <div className="space-y-6">
                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("backend.expenses.index")}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Expense Detail
                            </h1>
                            <p className="mt-0.5 font-mono text-sm text-indigo-600">
                                {expense.reference_no}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    {!expense.deleted_at && (
                        <div className="flex items-center gap-2">
                            {can.edit && (
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                    Edit
                                </button>
                            )}
                            {can.delete && (
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
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
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Trashed banner */}
                {expense.deleted_at && (
                    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                        <svg
                            className="h-5 w-5 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                            />
                        </svg>
                        <p className="text-sm text-red-700">
                            This expense was deleted on{" "}
                            {formatDateTime(expense.deleted_at)}.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left — main details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Core info card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    Expense Information
                                </h2>
                            </div>
                            <div className="space-y-4 px-5 py-5">
                                <DetailRow label="Title">
                                    <span className="font-medium">
                                        {expense.title}
                                    </span>
                                </DetailRow>

                                <DetailRow label="Category">
                                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                                        {expense.category.name}
                                    </span>
                                </DetailRow>

                                <DetailRow label="Amount">
                                    <span className="text-lg font-bold text-gray-900">
                                        ৳ {formatAmount(expense.amount)}
                                    </span>
                                </DetailRow>

                                <DetailRow label="Expense Date">
                                    {formatDate(expense.expense_date)}
                                </DetailRow>

                                <DetailRow label="Payment Method">
                                    {expense.payment_method ? (
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                            {expense.payment_method.name}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">—</span>
                                    )}
                                </DetailRow>

                                <DetailRow label="Transaction Ref">
                                    {expense.reference ? (
                                        <span className="font-mono text-sm text-gray-700">
                                            {expense.reference}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">—</span>
                                    )}
                                </DetailRow>

                                <DetailRow label="Note">
                                    {expense.note ? (
                                        <span className="whitespace-pre-wrap text-gray-700">
                                            {expense.note}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">—</span>
                                    )}
                                </DetailRow>
                            </div>
                        </div>

                        {/* Attachment card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    Attachment
                                </h2>
                            </div>
                            <div className="px-5 py-5">
                                {expense.attachment_url ? (
                                    <div className="space-y-3">
                                        {/* Image preview */}
                                        {isImage(expense.attachment_mime) && (
                                            <img
                                                src={expense.attachment_url}
                                                alt="Expense attachment"
                                                className="max-h-64 rounded-lg border border-gray-200 object-contain"
                                            />
                                        )}

                                        {/* PDF icon */}
                                        {isPdf(expense.attachment_mime) && (
                                            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                                <svg
                                                    className="h-8 w-8 text-red-500"
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
                                                <span className="text-sm text-gray-600">
                                                    PDF Document
                                                </span>
                                            </div>
                                        )}

                                        {/* Doc icon */}
                                        {!isImage(expense.attachment_mime) &&
                                            !isPdf(expense.attachment_mime) && (
                                                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                                    <svg
                                                        className="h-8 w-8 text-blue-500"
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
                                                    <span className="text-sm text-gray-600">
                                                        Document
                                                    </span>
                                                </div>
                                            )}

                                        {/* Download link */}
                                        <a
                                            href={expense.attachment_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                />
                                            </svg>
                                            Download Attachment
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">
                                        No attachment uploaded.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right — meta info */}
                    <div className="space-y-6">
                        {/* System info card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    System Info
                                </h2>
                            </div>
                            <div className="space-y-4 px-5 py-5">
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        Reference No
                                    </p>
                                    <p className="mt-1 font-mono text-sm text-indigo-600">
                                        {expense.reference_no}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        Created By
                                    </p>
                                    <p className="mt-1 text-sm text-gray-700">
                                        {expense.creator.name}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        Created At
                                    </p>
                                    <p className="mt-1 text-sm text-gray-700">
                                        {formatDateTime(expense.created_at)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        Last Updated
                                    </p>
                                    <p className="mt-1 text-sm text-gray-700">
                                        {expense.updater
                                            ? `${expense.updater.name} — ${formatDateTime(expense.updated_at)}`
                                            : formatDateTime(
                                                  expense.updated_at,
                                              )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick stats card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    Quick Info
                                </h2>
                            </div>
                            <div className="px-5 py-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Category
                                    </span>
                                    <span className="text-xs font-medium text-gray-700">
                                        {expense.category.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Payment
                                    </span>
                                    <span className="text-xs font-medium text-gray-700">
                                        {expense.payment_method?.name ?? "—"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Attachment
                                    </span>
                                    <span className="text-xs font-medium text-gray-700">
                                        {expense.attachment ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                    <span className="text-sm font-medium text-gray-600">
                                        Total
                                    </span>
                                    <span className="text-base font-bold text-gray-900">
                                        ৳ {formatAmount(expense.amount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Back link */}
                        <Link
                            href={route("backend.expenses.index")}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
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
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            Back to Expenses
                        </Link>
                    </div>
                </div>
            </div>

            {/* Edit modal */}
            {showEditModal && (
                <ExpenseModal
                    expense={expense}
                    categories={categories}
                    paymentMethods={paymentMethods}
                    onClose={() => setShowEditModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}
