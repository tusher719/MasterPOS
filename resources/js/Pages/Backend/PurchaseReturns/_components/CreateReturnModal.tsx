import { AppDateInput } from "@/Components/DatePicker";
import {
    CreateReturnFormData,
    PurchaseOption,
    ReturnItemFormData,
} from "@/types/purchase-return";
import { router } from "@inertiajs/react";
import { Minus, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
    onClose: () => void;
}

const EMPTY_ITEM: ReturnItemFormData = {
    product_id: "",
    variant_id: null,
    quantity: "",
    unit_cost: "",
    reason_note: "",
    product_name: "",
    variant_label: "",
    max_quantity: 0,
};

export default function CreateReturnModal({ onClose }: Props) {
    // ── Form state ───────────────────────────────────────────────────────────
    const [form, setForm] = useState<CreateReturnFormData>({
        purchase_id: "",
        return_date: new Date().toISOString().slice(0, 10),
        return_type: "",
        reason: "",
        note: "",
        items: [],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // ── Purchase search state ────────────────────────────────────────────────
    const [purchaseSearch, setPurchaseSearch] = useState("");
    const [purchaseOptions, setPurchaseOptions] = useState<PurchaseOption[]>(
        [],
    );
    const [selectedPurchase, setSelectedPurchase] =
        useState<PurchaseOption | null>(null);
    const [searching, setSearching] = useState(false);
    const searchRef = useRef<AbortController | null>(null);

    // ── Search purchases (debounced) ─────────────────────────────────────────
    useEffect(() => {
        if (purchaseSearch.length < 2) {
            setPurchaseOptions([]);
            return;
        }

        const timer = setTimeout(() => {
            // Cancel previous request
            searchRef.current?.abort();
            searchRef.current = new AbortController();

            setSearching(true);
            fetch(
                route("backend.purchases.search-for-return") +
                    `?search=${encodeURIComponent(purchaseSearch)}`,
                {
                    signal: searchRef.current.signal,
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                },
            )
                .then((r) => r.json())
                .then((data) => {
                    // Map Inertia paginated response to PurchaseOption[]
                    // purchases.data comes from PurchaseController::index()
                    const options: PurchaseOption[] = (
                        data.purchases?.data ?? []
                    ).map((p: any) => ({
                        id: p.id,
                        reference_no: p.reference_no,
                        supplier_name: p.supplier?.name ?? "Unknown",
                        purchase_date: p.purchase_date,
                        grand_total: p.grand_total,
                        items: (p.items ?? []).map((i: any) => ({
                            id: i.id,
                            product_id: i.product_id,
                            product_name: i.product?.name ?? "Unknown",
                            variant_id: i.variant_id ?? null,
                            variant_label: i.variant
                                ? Object.values(
                                      i.variant.attributes ?? {},
                                  ).join(" / ")
                                : null,
                            quantity: i.quantity,
                            unit_cost: i.unit_cost,
                            available_qty: i.available_qty ?? i.quantity,
                        })),
                    }));
                    setPurchaseOptions(options);
                })
                .catch(() => {
                    // Aborted request — ignore silently
                })
                .finally(() => setSearching(false));
        }, 300);

        return () => clearTimeout(timer);
    }, [purchaseSearch]);

    // ── Select a purchase — pre-fill items ──────────────────────────────────
    const handleSelectPurchase = (purchase: PurchaseOption) => {
        setSelectedPurchase(purchase);
        setPurchaseSearch("");
        setPurchaseOptions([]);
        setForm((prev) => ({
            ...prev,
            purchase_id: purchase.id,
            // Pre-fill all items from the purchase at quantity 0
            items: purchase.items.map((pi) => ({
                product_id: pi.product_id,
                variant_id: pi.variant_id,
                quantity: "",
                unit_cost: String(pi.unit_cost),
                reason_note: "",
                product_name: pi.product_name,
                variant_label: pi.variant_label ?? "",
                max_quantity: pi.available_qty,
            })),
        }));
    };

    // ── Item field update ────────────────────────────────────────────────────
    const updateItem = (
        index: number,
        field: keyof ReturnItemFormData,
        value: string | number | null,
    ) => {
        setForm((prev) => {
            const items = [...prev.items];
            items[index] = { ...items[index], [field]: value };
            return { ...prev, items };
        });
    };

    // ── Remove an item row ───────────────────────────────────────────────────
    const removeItem = (index: number) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    // ── Grand total ──────────────────────────────────────────────────────────
    const grandTotal = form.items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const cost = Number(item.unit_cost) || 0;
        return sum + qty * cost;
    }, 0);

    // ── Client-side guards before submit ────────────────────────────────────
    const validate = (): boolean => {
        const errs: Record<string, string> = {};

        if (!form.purchase_id) errs.purchase_id = "Please select a purchase.";
        if (!form.return_type)
            errs.return_type = "Please select a return type.";
        if (!form.reason.trim()) errs.reason = "Please provide a reason.";

        const filledItems = form.items.filter((i) => Number(i.quantity) > 0);
        if (filledItems.length === 0) {
            errs.items =
                "At least one item with a quantity greater than zero is required.";
        }

        filledItems.forEach((item, idx) => {
            if (Number(item.quantity) > (item.max_quantity ?? 0)) {
                errs[`items.${idx}.quantity`] =
                    `Quantity exceeds available (${item.max_quantity}).`;
            }
        });

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = () => {
        if (!validate()) return;

        // Only send items with qty > 0 and normalize to plain objects so
        // Inertia's RequestPayload typing accepts the payload.
        const payload: Record<string, any> = {
            ...form,
            items: form.items
                .filter((i) => Number(i.quantity) > 0)
                .map((item) => ({ ...item })),
        };

        setSubmitting(true);
        router.post(route("backend.purchase-returns.store"), payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Return draft created successfully.");
                onClose();
            },
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                toast.error("Please fix the errors and try again.");
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-card shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">
                        New Purchase Return
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                    {/* ── Purchase selector ─────────────────────────────────── */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">
                            Purchase <span className="text-red-500">*</span>
                        </label>

                        {selectedPurchase ? (
                            // Selected purchase card
                            <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
                                <div>
                                    <p className="text-sm font-semibold text-indigo-800">
                                        {selectedPurchase.reference_no}
                                    </p>
                                    <p className="text-xs text-indigo-600">
                                        {selectedPurchase.supplier_name} —{" "}
                                        {selectedPurchase.purchase_date}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedPurchase(null);
                                        setForm((prev) => ({
                                            ...prev,
                                            purchase_id: "",
                                            items: [],
                                        }));
                                    }}
                                    className="rounded-md p-1 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600"
                                    title="Change purchase"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            // Search input
                            <div className="relative">
                                <Search
                                    size={15}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <input
                                    type="text"
                                    placeholder="Search by reference number..."
                                    value={purchaseSearch}
                                    onChange={(e) =>
                                        setPurchaseSearch(e.target.value)
                                    }
                                    className="w-full rounded-md border border-border bg-input py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {searching && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        Searching...
                                    </span>
                                )}

                                {/* Dropdown results */}
                                {purchaseOptions.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                                        {purchaseOptions.map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() =>
                                                    handleSelectPurchase(p)
                                                }
                                                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-muted"
                                            >
                                                <span className="font-medium text-foreground">
                                                    {p.reference_no}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {p.supplier_name} —{" "}
                                                    {p.purchase_date}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {errors.purchase_id && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.purchase_id}
                            </p>
                        )}
                    </div>

                    {/* ── Return Date + Type ────────────────────────────────── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-foreground">
                                Return Date{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <AppDateInput
                                value={form.return_date}
                                onChange={(v) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        return_date: v,
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-foreground">
                                Return Type{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.return_type}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        return_type: e.target.value as any,
                                    }))
                                }
                                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select type...</option>
                                <option value="supplier_return">
                                    Supplier Return
                                </option>
                                <option value="damage_wastage">
                                    Damage / Wastage
                                </option>
                            </select>
                            {errors.return_type && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.return_type}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Return type info banner */}
                    {form.return_type === "supplier_return" && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                            <strong>Supplier Return:</strong> Stock will be
                            deducted. Use this when returning items to the
                            supplier due to defects or wrong delivery.
                        </div>
                    )}
                    {form.return_type === "damage_wastage" && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <strong>Damage / Wastage:</strong> Stock will be
                            deducted. Use this when items are damaged, expired,
                            or lost — not returned to supplier.
                        </div>
                    )}

                    {/* ── Reason ────────────────────────────────────────────── */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">
                            Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={2}
                            value={form.reason}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    reason: e.target.value,
                                }))
                            }
                            placeholder="Describe the reason for this return..."
                            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.reason && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.reason}
                            </p>
                        )}
                    </div>

                    {/* ── Items Table ───────────────────────────────────────── */}
                    {form.items.length > 0 && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">
                                Items to Return
                            </label>

                            <div className="overflow-x-auto rounded-lg border border-border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/50">
                                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                                Product
                                            </th>
                                            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-24">
                                                Max Qty
                                            </th>
                                            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-28">
                                                Return Qty
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-muted-foreground w-24">
                                                Unit Cost
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-muted-foreground w-24">
                                                Subtotal
                                            </th>
                                            <th className="px-3 py-2 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {form.items.map((item, idx) => {
                                            const subtotal =
                                                (Number(item.quantity) || 0) *
                                                (Number(item.unit_cost) || 0);
                                            const exceedsMax =
                                                Number(item.quantity) >
                                                (item.max_quantity ?? 0);

                                            return (
                                                <tr
                                                    key={idx}
                                                    className="bg-card hover:bg-muted/30"
                                                >
                                                    <td className="px-3 py-2">
                                                        <p className="font-medium text-foreground">
                                                            {item.product_name}
                                                        </p>
                                                        {item.variant_label && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {
                                                                    item.variant_label
                                                                }
                                                            </p>
                                                        )}
                                                        {/* Per-item reason note */}
                                                        <input
                                                            type="text"
                                                            placeholder="Item note (optional)"
                                                            value={
                                                                item.reason_note
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    idx,
                                                                    "reason_note",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="mt-1 w-full rounded border border-border bg-input px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                                        />
                                                    </td>

                                                    {/* Max available qty */}
                                                    <td className="px-3 py-2 text-center text-muted-foreground">
                                                        {item.max_quantity ?? 0}
                                                    </td>

                                                    {/* Return quantity input */}
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateItem(
                                                                        idx,
                                                                        "quantity",
                                                                        String(
                                                                            Math.max(
                                                                                0,
                                                                                (Number(
                                                                                    item.quantity,
                                                                                ) ||
                                                                                    0) -
                                                                                    1,
                                                                            ),
                                                                        ),
                                                                    )
                                                                }
                                                                className="rounded border border-border p-0.5 text-muted-foreground hover:bg-muted"
                                                            >
                                                                <Minus
                                                                    size={12}
                                                                />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={
                                                                    item.max_quantity
                                                                }
                                                                value={
                                                                    item.quantity
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        idx,
                                                                        "quantity",
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className={`w-16 rounded border px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                                                                    exceedsMax
                                                                        ? "border-red-400 bg-red-50 text-red-700"
                                                                        : "border-border bg-input text-foreground"
                                                                }`}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateItem(
                                                                        idx,
                                                                        "quantity",
                                                                        String(
                                                                            Math.min(
                                                                                item.max_quantity ??
                                                                                    0,
                                                                                (Number(
                                                                                    item.quantity,
                                                                                ) ||
                                                                                    0) +
                                                                                    1,
                                                                            ),
                                                                        ),
                                                                    )
                                                                }
                                                                className="rounded border border-border p-0.5 text-muted-foreground hover:bg-muted"
                                                            >
                                                                <Plus
                                                                    size={12}
                                                                />
                                                            </button>
                                                        </div>
                                                        {exceedsMax && (
                                                            <p className="mt-0.5 text-center text-[10px] text-red-500">
                                                                Max:{" "}
                                                                {
                                                                    item.max_quantity
                                                                }
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Unit cost (read-only snapshot) */}
                                                    <td className="px-3 py-2 text-right text-muted-foreground">
                                                        ৳
                                                        {Number(
                                                            item.unit_cost,
                                                        ).toFixed(2)}
                                                    </td>

                                                    {/* Subtotal */}
                                                    <td className="px-3 py-2 text-right font-medium text-foreground">
                                                        ৳{subtotal.toFixed(2)}
                                                    </td>

                                                    {/* Remove row */}
                                                    <td className="px-3 py-2">
                                                        <button
                                                            onClick={() =>
                                                                removeItem(idx)
                                                            }
                                                            className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                                                            title="Remove item"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>

                                    {/* Grand total row */}
                                    <tfoot>
                                        <tr className="border-t border-border bg-muted/30">
                                            <td
                                                colSpan={4}
                                                className="px-3 py-2 text-right text-sm font-semibold text-foreground"
                                            >
                                                Total Return Value
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm font-bold text-foreground">
                                                ৳{grandTotal.toFixed(2)}
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {errors.items && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.items}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Empty purchase state */}
                    {!selectedPurchase && (
                        <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                            Search and select a purchase above to load its items
                        </div>
                    )}

                    {/* ── Note ──────────────────────────────────────────────── */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">
                            Additional Note
                        </label>
                        <textarea
                            rows={2}
                            value={form.note}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    note: e.target.value,
                                }))
                            }
                            placeholder="Optional internal note..."
                            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {submitting ? "Saving..." : "Save as Draft"}
                    </button>
                </div>
            </div>
        </div>
    );
}
