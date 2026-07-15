import type {
    AssignmentCan,
    PartnerProductAssignment,
    ProductOption,
} from "@/types/partner.d";
import { router } from "@inertiajs/react";
import { Calendar, CheckCircle, Clock, Package, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import CreateProductAssignmentModal from "./CreateProductAssignmentModal";
import EditProductAssignmentModal from "./EditProductAssignmentModal";

interface Props {
    partnerId: number;
    assignments: PartnerProductAssignment[];
    products: ProductOption[];
    can: AssignmentCan;
}

export default function ProductAssignmentsPanel({
    partnerId,
    assignments,
    products,
    can,
}: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] =
        useState<PartnerProductAssignment | null>(null);

    // Separate pending vs approved vs historical
    const pending = assignments.filter((a) => a.is_pending);
    const active = assignments.filter(
        (a) => a.is_approved && a.is_currently_active,
    );
    const historical = assignments.filter(
        (a) => a.is_approved && !a.is_currently_active,
    );

    const handleApprove = (assignment: PartnerProductAssignment) => {
        Swal.fire({
            title: "Approve Assignment?",
            html: `Approve product assignment for <strong>${assignment.product?.name ?? "this product"}</strong>?<br/><br/>Once approved, this assignment will be used in profit calculations.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, Approve",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#4f46e5",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route("backend.partners.product-assignments.approve", {
                        partner: partnerId,
                        assignment: assignment.id,
                    }),
                    {},
                    {
                        onSuccess: () =>
                            toast.success("Assignment approved successfully."),
                        onError: () =>
                            toast.error("Failed to approve assignment."),
                    },
                );
            }
        });
    };

    const handleDelete = (assignment: PartnerProductAssignment) => {
        Swal.fire({
            title: "Delete Assignment?",
            text: "This pending assignment will be permanently deleted.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#ef4444",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("backend.partners.product-assignments.destroy", {
                        partner: partnerId,
                        assignment: assignment.id,
                    }),
                    {
                        onSuccess: () => toast.success("Assignment deleted."),
                        onError: () =>
                            toast.error("Failed to delete assignment."),
                    },
                );
            }
        });
    };

    const formatDate = (date: string | null) =>
        date
            ? new Date(date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
              })
            : "Ongoing";

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <span className="text-sm font-medium text-gray-700">
                    Product Assignments
                </span>
                {can.create && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700"
                    >
                        <Plus size={13} />
                        Add Assignment
                    </button>
                )}
            </div>

            <div className="p-5 space-y-5">
                {/* Pending assignments */}
                {pending.length > 0 && (
                    <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-600">
                            Pending Approval ({pending.length})
                        </p>
                        <div className="space-y-2">
                            {pending.map((a) => (
                                <div
                                    key={a.id}
                                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Clock
                                                size={14}
                                                className="mt-0.5 shrink-0 text-amber-500"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    {a.product?.name ?? "—"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    SKU: {a.product?.sku ?? "—"}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                            Pending
                                        </span>
                                    </div>

                                    {/* Details row */}
                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={11} />
                                            {formatDate(
                                                a.effective_from,
                                            )} → {formatDate(a.effective_to)}
                                        </span>
                                        <span>
                                            Profit Share:{" "}
                                            <strong className="text-gray-700">
                                                {Number(
                                                    a.profit_share_percent,
                                                ).toFixed(2)}
                                                %
                                            </strong>
                                        </span>
                                        <span>
                                            Cost Return:{" "}
                                            <strong
                                                className={
                                                    a.cost_return_enabled
                                                        ? "text-green-600"
                                                        : "text-gray-400"
                                                }
                                            >
                                                {a.cost_return_enabled
                                                    ? "Enabled"
                                                    : "Disabled"}
                                            </strong>
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-3 flex gap-2">
                                        {can.approve && (
                                            <button
                                                onClick={() => handleApprove(a)}
                                                className="rounded-md bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {can.edit && (
                                            <button
                                                onClick={() => setEditTarget(a)}
                                                className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {can.edit && (
                                            <button
                                                onClick={() => handleDelete(a)}
                                                className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active approved assignments */}
                {active.length > 0 && (
                    <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-green-600">
                            Active ({active.length})
                        </p>
                        <div className="space-y-2">
                            {active.map((a) => (
                                <div
                                    key={a.id}
                                    className="rounded-lg border border-gray-200 bg-white px-4 py-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle
                                                size={14}
                                                className="mt-0.5 shrink-0 text-green-500"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    {a.product?.name ?? "—"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    SKU: {a.product?.sku ?? "—"}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                            Active
                                        </span>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={11} />
                                            {formatDate(
                                                a.effective_from,
                                            )} → {formatDate(a.effective_to)}
                                        </span>
                                        <span>
                                            Profit Share:{" "}
                                            <strong className="text-gray-700">
                                                {Number(
                                                    a.profit_share_percent,
                                                ).toFixed(2)}
                                                %
                                            </strong>
                                        </span>
                                        <span>
                                            Cost Return:{" "}
                                            <strong
                                                className={
                                                    a.cost_return_enabled
                                                        ? "text-green-600"
                                                        : "text-gray-400"
                                                }
                                            >
                                                {a.cost_return_enabled
                                                    ? "Enabled"
                                                    : "Disabled"}
                                            </strong>
                                        </span>
                                    </div>

                                    {/* Approved by */}
                                    {a.approved_by_user && (
                                        <p className="mt-1.5 text-xs text-gray-400">
                                            Approved by{" "}
                                            {a.approved_by_user.name} ·{" "}
                                            {a.approved_at
                                                ? formatDate(a.approved_at)
                                                : ""}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Historical assignments */}
                {historical.length > 0 && (
                    <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                            Historical ({historical.length})
                        </p>
                        <div className="space-y-2">
                            {historical.map((a) => (
                                <div
                                    key={a.id}
                                    className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 opacity-70"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Package
                                                size={14}
                                                className="mt-0.5 shrink-0 text-gray-400"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">
                                                    {a.product?.name ?? "—"}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    SKU: {a.product?.sku ?? "—"}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                            Ended
                                        </span>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={11} />
                                            {formatDate(
                                                a.effective_from,
                                            )} → {formatDate(a.effective_to)}
                                        </span>
                                        <span>
                                            Profit Share:{" "}
                                            {Number(
                                                a.profit_share_percent,
                                            ).toFixed(2)}
                                            %
                                        </span>
                                        <span>
                                            Cost Return:{" "}
                                            {a.cost_return_enabled
                                                ? "Enabled"
                                                : "Disabled"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {assignments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Package size={32} className="mb-2 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">
                            No product assignments yet
                        </p>
                        <p className="text-xs text-gray-400">
                            Assign products to this partner to enable
                            product-based profit calculations.
                        </p>
                        {can.create && (
                            <button
                                onClick={() => setShowCreate(true)}
                                className="mt-3 flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700"
                            >
                                <Plus size={13} />
                                Add First Assignment
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreate && (
                <CreateProductAssignmentModal
                    partnerId={partnerId}
                    products={products}
                    onClose={() => setShowCreate(false)}
                />
            )}
            {editTarget && (
                <EditProductAssignmentModal
                    partnerId={partnerId}
                    assignment={editTarget}
                    products={products}
                    onClose={() => setEditTarget(null)}
                />
            )}
        </div>
    );
}
