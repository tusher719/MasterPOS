// resources/js/Pages/Backend/PreOrders/_components/ConvertToSaleModal.tsx

import { PreOrder } from "@/types/pre-order";
import { router } from "@inertiajs/react";
import { Info, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    preOrder: PreOrder;
    onClose: () => void;
}

export default function ConvertToSaleModal({ preOrder, onClose }: Props) {
    const [saleReference, setSaleReference] = useState("");
    const [saleId, setSaleId] = useState<number | null>(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // ── Search sale by reference number ──────────────────────────────────────
    // Admin types the reference (SL-YYYYMMDD-XXXX) and we look it up
    function handleSearch() {
        if (!saleReference.trim()) {
            setSearchError("Please enter a sale reference number.");
            return;
        }

        setSearching(true);
        setSearchError("");
        setSaleId(null);

        // Fetch sale by reference via Inertia visit to avoid a separate API endpoint
        // We use a simple fetch against the sales list with reference filter
        fetch(
            route("backend.pos.sales.index") +
                `?search=${encodeURIComponent(saleReference.trim())}`,
            {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                },
            },
        )
            .then((res) => res.json())
            .then((json) => {
                // salesList returns paginated data — find exact reference match
                const match = json?.data?.find(
                    (s: { id: number; reference_no: string }) =>
                        s.reference_no === saleReference.trim(),
                );
                if (match) {
                    setSaleId(match.id);
                    setSearchError("");
                } else {
                    setSearchError(
                        `No sale found with reference "${saleReference.trim()}". Please check and try again.`,
                    );
                }
            })
            .catch(() => {
                setSearchError("Failed to search. Please try again.");
            })
            .finally(() => setSearching(false));
    }

    // ── Convert ───────────────────────────────────────────────────────────────
    function handleConvert() {
        if (!saleId) {
            toast.error("Please find a valid sale first.");
            return;
        }

        setSubmitting(true);

        // .then() pattern — NOT async/await (Rule 5)
        router.post(
            route("backend.pre-orders.convert-to-sale", preOrder.id),
            { sale_id: saleId },
            {
                onSuccess: () => {
                    toast.success(
                        "Pre-order linked to sale and marked as delivered.",
                    );
                    onClose();
                },
                onError: (errs) => {
                    const first = Object.values(errs)[0];
                    toast.error(
                        typeof first === "string"
                            ? first
                            : "Failed to convert pre-order.",
                    );
                },
                onFinish: () => setSubmitting(false),
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Convert to Sale
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-400">
                            {preOrder.customer_name_snapshot}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    {/* Info banner */}
                    <div className="flex items-start gap-2 rounded-md bg-indigo-50 border border-indigo-100 px-4 py-3">
                        <Info
                            size={15}
                            className="mt-0.5 shrink-0 text-indigo-500"
                        />
                        <p className="text-xs text-indigo-700">
                            Link this pre-order to an existing sale. The
                            pre-order will be marked as{" "}
                            <strong>Delivered</strong> once linked. Create the
                            sale in POS first, then come back here to link it.
                        </p>
                    </div>

                    {/* Pre-order summary */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer</span>
                            <span className="font-medium text-gray-800">
                                {preOrder.customer_name_snapshot}
                            </span>
                        </div>
                        {preOrder.product_name_snapshot && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Product</span>
                                <span className="font-medium text-gray-800">
                                    {preOrder.product_name_snapshot}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-500">Total Amount</span>
                            <span className="font-medium text-gray-800">
                                ৳
                                {Number(preOrder.total_amount).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Advance Paid</span>
                            <span className="font-medium text-green-700">
                                ৳
                                {Number(
                                    preOrder.advance_amount,
                                ).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                            <span className="text-gray-500">Due Amount</span>
                            <span className="font-semibold text-red-600">
                                ৳{Number(preOrder.due_amount).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Sale reference search */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Sale Reference Number{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={saleReference}
                                onChange={(e) => {
                                    setSaleReference(e.target.value);
                                    setSaleId(null);
                                    setSearchError("");
                                }}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleSearch()
                                }
                                placeholder="SL-YYYYMMDD-XXXX"
                                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={searching}
                                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                            >
                                {searching ? "..." : "Find"}
                            </button>
                        </div>

                        {/* Search error */}
                        {searchError && (
                            <p className="mt-1 text-xs text-red-500">
                                {searchError}
                            </p>
                        )}

                        {/* Found sale confirmation */}
                        {saleId && !searchError && (
                            <div className="mt-2 flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2">
                                <ShoppingCart
                                    size={14}
                                    className="text-green-600"
                                />
                                <p className="text-xs text-green-700">
                                    Sale <strong>{saleReference}</strong> found.
                                    Click "Link & Convert" to proceed.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConvert}
                        disabled={submitting || !saleId}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <ShoppingCart size={14} />
                        {submitting ? "Linking..." : "Link & Convert"}
                    </button>
                </div>
            </div>
        </div>
    );
}
