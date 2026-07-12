import useFlashToast from "@/hooks/useFlashToast";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { confirmAction } from "@/lib/confirm";
import { Head, Link, router } from "@inertiajs/react";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import {
    ArrowLeft,
    Calendar,
    Clock,
    DollarSign,
    Download,
    FileText,
    Hash,
    Pencil,
    RotateCcw,
    StickyNote,
    Tag,
    Trash2,
    User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";
import InvestmentModal from "./_components/InvestmentModal";

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
    is_attachment_image: boolean;
    attachment_extension: string | null;
    note: string | null;
    status: "active" | "withdrawn";
    investment_type_id: number;
    investment_type: InvestmentType;
    creator: { id: number; name: string } | null;
    updater: { id: number; name: string } | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    investment: Investment;
    investmentTypes: InvestmentType[];
    can: {
        edit: boolean;
        delete: boolean;
        restore: boolean;
    };
}

function formatCurrency(value: string | number): string {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function Show({ investment, investmentTypes, can }: Props) {
    useFlashToast();

    const [showEditModal, setShowEditModal] = useState(false);
    const [investmentDate, setInvestmentDate] = useState<string | null>(
        investment.investment_date
            ? dayjs(investment.investment_date).format("YYYY-MM-DD")
            : null,
    );

    function handleDateChange(value: string | null) {
        if (!value) return;
        setInvestmentDate(value);
        router.put(
            route("backend.investments.update", investment.id),
            { investment_date: value },
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Investment date updated."),
                onError: () => toast.error("Could not update investment date."),
            },
        );
    }

    async function handleDelete() {
        const ok = await confirmAction({
            title: "Delete Investment",
            text: `Are you sure you want to delete "${investment.title}"? This action can be undone.`,
            confirmButtonText: "Yes, Delete",
        });
        if (!ok) return;

        router.delete(route("backend.investments.destroy", investment.id), {
            onSuccess: () => router.visit(route("backend.investments.index")),
        });
    }

    async function handleRestore() {
        const ok = await confirmAction({
            title: "Restore Investment",
            text: `Restore "${investment.title}"?`,
            confirmButtonText: "Yes, Restore",
        });
        if (!ok) return;

        router.post(
            route("backend.investments.restore", investment.id),
            {},
            {
                onSuccess: () =>
                    toast.success("Investment restored successfully."),
            },
        );
    }

    const isActive = investment.status === "active";
    const isTrashed = !!investment.deleted_at;
    const fileName = investment.attachment
        ? investment.attachment.split("/").pop()
        : null;

    return (
        <AuthenticatedLayout>
            <Head title={`Investment — ${investment.title}`} />

            <div className="space-y-5">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("backend.investments.index")}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {investment.title}
                            </h1>
                            <p className="mt-0.5 text-sm text-gray-500">
                                Investment Details
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isTrashed ? (
                            can.restore && (
                                <button
                                    onClick={handleRestore}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Restore
                                </button>
                            )
                        ) : (
                            <>
                                {can.edit && (
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Edit
                                    </button>
                                )}
                                {can.delete && (
                                    <button
                                        onClick={handleDelete}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Trashed banner */}
                {isTrashed && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        This investment has been deleted. Restore it to make it
                        active again.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Core Info Card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    Investment Information
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {/* Title */}
                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <Tag className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Title
                                        </p>
                                        <p className="mt-0.5 text-sm font-medium text-gray-800">
                                            {investment.title}
                                        </p>
                                    </div>
                                </div>

                                {/* Investor Name */}
                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <User className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Investor Name
                                        </p>
                                        <p className="mt-0.5 text-sm font-medium text-gray-800">
                                            {investment.investor_name}
                                        </p>
                                    </div>
                                </div>

                                {/* Investment Type */}
                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <Tag className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Investment Type
                                        </p>
                                        <p className="mt-0.5 text-sm font-medium text-gray-800">
                                            {investment.investment_type?.name ??
                                                "—"}
                                        </p>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-green-50 p-1.5">
                                        <DollarSign className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Amount
                                        </p>
                                        <p className="mt-0.5 text-lg font-bold text-green-700">
                                            ৳{" "}
                                            {formatCurrency(investment.amount)}
                                        </p>
                                    </div>
                                </div>

                                {/* Investment Date — inline editable when permitted */}
                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <Calendar className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Investment Date
                                        </p>
                                        {can.edit && !isTrashed ? (
                                            <DatePickerInput
                                                clearable
                                                value={investmentDate}
                                                onChange={handleDateChange}
                                                valueFormat="DD MMM YYYY"
                                                firstDayOfWeek={6}
                                                weekendDays={[5]}
                                                getDayProps={(date) => {
                                                    const isFriday =
                                                        new Date(
                                                            date,
                                                        ).getDay() === 5;
                                                    return {
                                                        style: {
                                                            color: isFriday
                                                                ? "#ef4444"
                                                                : "#1f2937",
                                                            fontWeight: isFriday
                                                                ? 600
                                                                : 400,
                                                        },
                                                    };
                                                }}
                                                placeholder="Pick date"
                                                className="mt-1 max-w-[220px]"
                                                styles={{
                                                    input: {
                                                        borderRadius:
                                                            "0.375rem",
                                                        borderColor: "#d1d5db",
                                                        fontSize: "0.875rem",
                                                        fontWeight: 500,
                                                        padding:
                                                            "0.25rem 0.5rem",
                                                    },
                                                }}
                                            />
                                        ) : (
                                            <p className="mt-0.5 text-sm font-medium text-gray-800">
                                                {formatDate(
                                                    investment.investment_date,
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <Hash className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Status
                                        </p>
                                        <span
                                            className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                isActive
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-amber-100 text-amber-700"
                                            }`}
                                        >
                                            {isActive ? "Active" : "Withdrawn"}
                                        </span>
                                    </div>
                                </div>

                                {/* Transaction Reference */}
                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <Hash className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Transaction Reference
                                        </p>
                                        <p className="mt-0.5 text-sm font-medium text-gray-800 font-mono">
                                            {investment.reference ?? (
                                                <span className="text-gray-400 font-sans">
                                                    —
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="flex items-start gap-3 px-5 py-4">
                                    <div className="mt-0.5 rounded-md bg-indigo-50 p-1.5">
                                        <StickyNote className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Note
                                        </p>
                                        <p className="mt-0.5 text-sm text-gray-700 whitespace-pre-wrap">
                                            {investment.note ?? (
                                                <span className="text-gray-400">
                                                    No note provided.
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attachment Card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    Attachment
                                </h2>
                            </div>
                            <div className="px-5 py-4">
                                {investment.attachment_url ? (
                                    <div className="space-y-3">
                                        {/* Image preview */}
                                        {investment.is_attachment_image && (
                                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                                <img
                                                    src={
                                                        investment.attachment_url
                                                    }
                                                    alt="Investment attachment"
                                                    className="max-h-64 w-full object-contain bg-gray-50"
                                                />
                                            </div>
                                        )}

                                        {/* File info + download */}
                                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-md bg-white border border-gray-200 p-2">
                                                    <FileText className="h-5 w-5 text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 break-all">
                                                        {fileName}
                                                    </p>
                                                    <p className="text-xs text-gray-400 uppercase">
                                                        {
                                                            investment.attachment_extension
                                                        }{" "}
                                                        file
                                                    </p>
                                                </div>
                                            </div>
                                            <a
                                                href={investment.attachment_url}
                                                download
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                Download
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">
                                        No attachment uploaded.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar — Meta Info */}
                    <div className="space-y-5">
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <h2 className="text-sm font-semibold text-gray-700">
                                    Record Info
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {/* Created By */}
                                <div className="px-5 py-4">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        Created By
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-800">
                                        {investment.creator?.name ?? "—"}
                                    </p>
                                </div>

                                {/* Created At */}
                                <div className="px-5 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Created At
                                        </p>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-700">
                                        {formatDateTime(investment.created_at)}
                                    </p>
                                </div>

                                {/* Updated At */}
                                <div className="px-5 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Last Updated
                                        </p>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-700">
                                        {formatDateTime(investment.updated_at)}
                                    </p>
                                    {investment.updater && (
                                        <p className="mt-0.5 text-xs text-gray-400">
                                            by {investment.updater.name}
                                        </p>
                                    )}
                                </div>

                                {/* Deleted At */}
                                {isTrashed && (
                                    <div className="px-5 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                            <p className="text-xs font-medium text-red-400 uppercase tracking-wide">
                                                Deleted At
                                            </p>
                                        </div>
                                        <p className="mt-1 text-sm text-red-600">
                                            {formatDateTime(
                                                investment.deleted_at!,
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick actions */}
                        {!isTrashed && (
                            <div className="rounded-lg border border-gray-200 bg-white">
                                <div className="border-b border-gray-100 px-5 py-4">
                                    <h2 className="text-sm font-semibold text-gray-700">
                                        Actions
                                    </h2>
                                </div>
                                <div className="px-5 py-4 space-y-2">
                                    {can.edit && (
                                        <button
                                            onClick={() =>
                                                setShowEditModal(true)
                                            }
                                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit Investment
                                        </button>
                                    )}
                                    {can.delete && (
                                        <button
                                            onClick={handleDelete}
                                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete Investment
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <InvestmentModal
                    investment={investment}
                    investmentTypes={investmentTypes}
                    onClose={() => setShowEditModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}
