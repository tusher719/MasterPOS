import { PurchaseReturn } from "@/types/purchase-return";
import { router } from "@inertiajs/react";
import { AlertTriangle, CheckCircle2, Package, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    purchaseReturn: PurchaseReturn;
    onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
    supplier_return: "Supplier Return",
    damage_wastage:  "Damage / Wastage",
};

export default function ConfirmReturnModal({ purchaseReturn, onClose }: Props) {
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = () => {
        setSubmitting(true);
        router.post(
            route("backend.purchase-returns.confirm", purchaseReturn.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Return confirmed and stock updated.");
                    onClose();
                },
                onError: (errs) => {
                    toast.error(
                        errs.confirm ?? "Could not confirm this return.",
                    );
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-card shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">
                        Confirm Return
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-5 py-4">
                    {/* Warning banner */}
                    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <AlertTriangle
                            size={18}
                            className="mt-0.5 shrink-0 text-amber-500"
                        />
                        <div className="text-sm text-amber-800">
                            <p className="font-semibold">
                                This action cannot be undone.
                            </p>
                            <p className="mt-0.5">
                                Confirming will permanently deduct stock for all
                                items in this return. Make sure the quantities
                                are correct before proceeding.
                            </p>
                        </div>
                    </div>

                    {/* Return summary */}
                    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Purchase</span>
                            <span className="font-medium text-foreground font-mono">
                                {purchaseReturn.purchase?.reference_no ?? "—"}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Supplier</span>
                            <span className="font-medium text-foreground">
                                {purchaseReturn.purchase?.supplier?.name ?? "—"}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Return Type</span>
                            <span className="font-medium text-foreground">
                                {TYPE_LABELS[purchaseReturn.return_type] ??
                                    purchaseReturn.return_type}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Return Date</span>
                            <span className="font-medium text-foreground">
                                {purchaseReturn.return_date}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Value</span>
                            <span className="font-semibold text-foreground">
                                ৳
                                {Number(
                                    purchaseReturn.total_return_value,
                                ).toLocaleString("en-BD", {
                                    minimumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                    </div>

                    {/* What happens on confirm */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            What happens when confirmed
                        </p>
                        <ul className="space-y-1.5 text-sm text-foreground">
                            <li className="flex items-start gap-2">
                                <CheckCircle2
                                    size={15}
                                    className="mt-0.5 shrink-0 text-green-500"
                                />
                                Stock quantity deducted for each returned item
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2
                                    size={15}
                                    className="mt-0.5 shrink-0 text-green-500"
                                />
                                Stock movement recorded (type: return)
                            </li>
                            <li className="flex items-start gap-2">
                                <Package
                                    size={15}
                                    className="mt-0.5 shrink-0 text-blue-500"
                                />
                                {purchaseReturn.return_type === "supplier_return"
                                    ? "Supplier credit note reference saved for reconciliation"
                                    : "Wastage recorded — no supplier credit generated"}
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        <CheckCircle2 size={15} />
                        {submitting ? "Confirming..." : "Confirm & Deduct Stock"}
                    </button>
                </div>
            </div>
        </div>
    );
}
