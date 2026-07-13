import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PartnerShowProps } from "@/types/partner";
import {
    PARTNER_STATUS_COLORS,
    PARTNER_TYPE_COLORS,
    PARTNER_TYPE_LABELS,
    getPartnerTypes,
} from "@/types/partner-colors";
import { Head, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Calendar,
    FileText,
    Mail,
    MapPin,
    Pencil,
    Phone,
    RotateCcw,
    ShieldAlert,
    Trash2,
    User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import EditPartnerModal from "./_components/EditPartnerModal";
import LinkedInvestmentsCard from "./_components/LinkedInvestmentsCard";
import LinkInvestmentModal from "./_components/LinkInvestmentModal";

export default function Show({
    partner,
    investmentOptions,
    can,
}: PartnerShowProps) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);

    const activeTypes = getPartnerTypes(partner);

    // -------------------------------------------------------------------------
    // Actions
    // -------------------------------------------------------------------------

    const handleDelete = () => {
        Swal.fire({
            title: "Delete Partner?",
            text: `"${partner.name}" will be soft-deleted and can be restored later.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("backend.partners.destroy", { partner: partner.id }),
                    {
                        onSuccess: () => {
                            toast.success("Partner deleted.");
                            router.visit(route("backend.partners.index"));
                        },
                        onError: () => toast.error("Failed to delete partner."),
                    },
                );
            }
        });
    };

    const handleRestore = () => {
        Swal.fire({
            title: "Restore Partner?",
            text: `"${partner.name}" will be restored.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#4f46e5",
            confirmButtonText: "Yes, restore it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route("backend.partners.restore", { id: partner.id }),
                    {},
                    {
                        onSuccess: () => toast.success("Partner restored."),
                        onError: () =>
                            toast.error("Failed to restore partner."),
                    },
                );
            }
        });
    };

    const handleForceDelete = () => {
        Swal.fire({
            title: "Permanently Delete?",
            text: `"${partner.name}" and all its linked data will be permanently removed. This cannot be undone.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, permanently delete!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("backend.partners.force-delete", { id: partner.id }),
                    {
                        onSuccess: () => {
                            toast.success("Partner permanently deleted.");
                            router.visit(route("backend.partners.index"));
                        },
                        onError: () =>
                            toast.error(
                                "Failed to permanently delete partner.",
                            ),
                    },
                );
            }
        });
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <AuthenticatedLayout>
            <Head title={`Partner — ${partner.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <a
                            href={route("backend.partners.index")}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                            title="Back to Partners"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {partner.name}
                                </h1>
                                {partner.code && (
                                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-mono font-medium text-indigo-700">
                                        {partner.code}
                                    </span>
                                )}
                            </div>
                            {/* Type badges */}
                            <div className="mt-1.5 flex flex-wrap gap-1">
                                {activeTypes.map((type) => (
                                    <span
                                        key={type}
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PARTNER_TYPE_COLORS[type]}`}
                                    >
                                        {PARTNER_TYPE_LABELS[type]}
                                    </span>
                                ))}
                                {activeTypes.length === 0 && (
                                    <span className="text-xs text-gray-400">
                                        No type assigned
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        {!partner.deleted_at && can.edit && (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit
                            </button>
                        )}
                        {!partner.deleted_at && can.delete && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        )}
                        {partner.deleted_at && can.restore && (
                            <button
                                onClick={handleRestore}
                                className="flex items-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Restore
                            </button>
                        )}
                        {partner.deleted_at && can.forceDelete && (
                            <button
                                onClick={handleForceDelete}
                                className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                            >
                                <ShieldAlert className="h-4 w-4" />
                                Permanently Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Deleted banner */}
                {partner.deleted_at && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        This partner has been deleted. Restore it to make it
                        active again.
                    </div>
                )}

                {/* Main content — 3 column layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left — main content (2 cols) */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Partner Info Card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-700">
                                Partner Information
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {/* Phone */}
                                    <div className="flex items-start gap-3">
                                        <Phone className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Phone
                                            </p>
                                            <p className="text-sm text-gray-800">
                                                {partner.phone ?? (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="flex items-start gap-3">
                                        <Mail className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Email
                                            </p>
                                            <p className="text-sm text-gray-800">
                                                {partner.email ? (
                                                    <a
                                                        href={`mailto:${partner.email}`}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        {partner.email}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="flex items-start gap-3 sm:col-span-2">
                                        <MapPin className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Address
                                            </p>
                                            <p className="text-sm text-gray-800 whitespace-pre-line">
                                                {partner.address ?? (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Linked User */}
                                    {partner.user && (
                                        <div className="flex items-start gap-3 sm:col-span-2">
                                            <User className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-400">
                                                    Linked System User
                                                </p>
                                                <p className="text-sm text-gray-800">
                                                    {partner.user.name}
                                                    {partner.user.email && (
                                                        <span className="ml-1 text-gray-400">
                                                            (
                                                            {partner.user.email}
                                                            )
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Note */}
                                {partner.note && (
                                    <div className="flex items-start gap-3 border-t border-gray-100 pt-4">
                                        <FileText className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Note
                                            </p>
                                            <p className="text-sm text-gray-700 whitespace-pre-line">
                                                {partner.note}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Linked Investments Card */}
                        <LinkedInvestmentsCard
                            partner={partner}
                            canEdit={can.edit && !partner.deleted_at}
                            onLinkClick={() => setShowLinkModal(true)}
                        />
                    </div>

                    {/* Right — sidebar (1 col) */}
                    <div className="space-y-4">
                        {/* Status Card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-700">
                                Status
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        Account Status
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PARTNER_STATUS_COLORS[partner.is_active ? "active" : "inactive"]}`}
                                    >
                                        {partner.is_active
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        Record
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${partner.deleted_at ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
                                    >
                                        {partner.deleted_at
                                            ? "Deleted"
                                            : "Active"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Partner Types Card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-700">
                                Partner Types
                            </div>
                            <div className="p-5 space-y-2">
                                {[
                                    {
                                        key: "capital",
                                        flag: partner.partner_type_capital,
                                    },
                                    {
                                        key: "working",
                                        flag: partner.partner_type_working,
                                    },
                                    {
                                        key: "product",
                                        flag: partner.partner_type_product,
                                    },
                                ].map(({ key, flag }) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-sm text-gray-500 capitalize">
                                            {PARTNER_TYPE_LABELS[key]}
                                        </span>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${flag ? PARTNER_TYPE_COLORS[key] : "bg-gray-100 text-gray-400"}`}
                                        >
                                            {flag ? "Yes" : "No"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Audit Card */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-700">
                                Audit
                            </div>
                            <div className="p-5 space-y-3 text-sm">
                                <div className="flex items-start gap-2">
                                    <Calendar className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Created
                                        </p>
                                        <p className="text-gray-700">
                                            {new Date(
                                                partner.created_at,
                                            ).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </p>
                                        {partner.created_by_user && (
                                            <p className="text-xs text-gray-400">
                                                by{" "}
                                                {partner.created_by_user.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {partner.updated_by_user && (
                                    <div className="flex items-start gap-2">
                                        <Calendar className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Last Updated
                                            </p>
                                            <p className="text-gray-700">
                                                {new Date(
                                                    partner.updated_at,
                                                ).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                by{" "}
                                                {partner.updated_by_user.name}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showEditModal && (
                <EditPartnerModal
                    partner={partner}
                    onClose={() => setShowEditModal(false)}
                />
            )}
            {showLinkModal && (
                <LinkInvestmentModal
                    partner={partner}
                    investmentOptions={investmentOptions}
                    onClose={() => setShowLinkModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}
