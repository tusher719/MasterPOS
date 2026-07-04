// resources/js/Pages/Backend/Purchases/Edit.tsx

import React, { useCallback } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PurchaseFormFields, {
    PurchaseFormData,
    PurchaseItemRow,
} from "./_components/PurchaseFormFields";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
    id: number;
    name: string;
    company: string | null;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    cost_price: number;
    stock_qty: number;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface ExistingItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_cost: number;
    subtotal: number;
}

interface Purchase {
    id: number;
    reference_no: string;
    supplier_id: number;
    purchase_date: string;
    purchase_status: string;
    subtotal: number;
    discount: number;
    tax: number;
    shipping_cost: number;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    note: string | null;
    items: ExistingItem[];
}

interface Props {
    purchase: Purchase;
    suppliers: Supplier[];
    products: Product[];
    paymentMethods: PaymentMethod[];
    purchaseStatuses: Record<string, string>;
    paymentStatuses: Record<string, string>;
    latestPaymentMethodId: number | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Edit({
    purchase,
    suppliers,
    products,
    paymentMethods,
    purchaseStatuses,
    paymentStatuses,
    latestPaymentMethodId,
}: Props) {
    // Map existing items into form shape
    const initialItems: PurchaseItemRow[] = purchase.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: Number(item.unit_cost),
        subtotal: Number(item.subtotal),
    }));

    const { data, setData, put, processing, errors } =
        useForm<PurchaseFormData>({
            supplier_id: purchase.supplier_id,
            purchase_date: purchase.purchase_date,
            purchase_status: purchase.purchase_status,
            discount: Number(purchase.discount),
            tax: Number(purchase.tax),
            shipping_cost: Number(purchase.shipping_cost),
            paid_amount: Number(purchase.paid_amount),
            payment_method_id: latestPaymentMethodId ?? "",
            note: purchase.note ?? "",
            items: initialItems,
        });

    // ── Field Change ──────────────────────────────────────────────────────────

    const handleChange = useCallback(
        (field: keyof PurchaseFormData, value: unknown) => {
            setData(field, value as never);
        },
        [setData],
    );

    // ── Item Change ───────────────────────────────────────────────────────────

    const handleItemChange = useCallback(
        (index: number, updates: Partial<PurchaseItemRow>) => {
            setData((prevData) => {
                const items = prevData.items.map((item, i) => {
                    if (i !== index) return item;
                    const newItem = { ...item, ...updates };
                    if ("quantity" in updates || "unit_cost" in updates) {
                        newItem.subtotal = parseFloat(
                            (
                                Number(newItem.quantity) *
                                Number(newItem.unit_cost)
                            ).toFixed(2),
                        );
                    }
                    return newItem;
                });
                return { ...prevData, items };
            });
        },
        [setData],
    );

    // ── Add / Remove Item ─────────────────────────────────────────────────────

    function handleAddItem() {
        setData("items", [
            ...data.items,
            { product_id: "", quantity: 1, unit_cost: 0, subtotal: 0 },
        ]);
    }

    function handleRemoveItem(index: number) {
        if (data.items.length === 1) return; // keep at least one row
        setData(
            "items",
            data.items.filter((_, i) => i !== index),
        );
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        put(route("backend.purchases.update", purchase.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Purchase updated successfully.");
            },
            onError: () => {
                toast.error("Please fix the errors and try again.");
            },
        });
    }

    const isCancelled = purchase.purchase_status === "cancelled";

    return (
        <AuthenticatedLayout>
            <Head title={`Edit Purchase — ${purchase.reference_no}`} />

            <div className="space-y-5">
                {/* ── Page Header ───────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("backend.purchases.show", purchase.id)}
                            className="rounded-md p-1.5 text-gray-400
                                       hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Edit Purchase
                            </h1>
                            <p className="mt-0.5 text-sm text-gray-500">
                                Ref:&nbsp;
                                <span className="font-medium text-indigo-600">
                                    {purchase.reference_no}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Cancelled Warning ─────────────────────────────────────── */}
                {isCancelled && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-medium text-amber-700">
                            This purchase is cancelled and cannot be edited.
                            Please duplicate it to create a new one.
                        </p>
                    </div>
                )}

                {/* ── Form ─────────────────────────────────────────────────── */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <PurchaseFormFields
                        data={data}
                        errors={errors}
                        suppliers={suppliers}
                        products={products}
                        paymentMethods={paymentMethods}
                        purchaseStatuses={purchaseStatuses}
                        onChange={handleChange}
                        onItemChange={handleItemChange}
                        onAddItem={handleAddItem}
                        onRemoveItem={handleRemoveItem}
                        isEdit={true}
                    />

                    {/* ── Form Footer ───────────────────────────────────────── */}
                    <div
                        className="flex items-center justify-end gap-3 rounded-lg
                                    border border-gray-200 bg-white px-5 py-4"
                    >
                        <Link
                            href={route("backend.purchases.show", purchase.id)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2
                                       text-sm font-medium text-gray-700 hover:bg-gray-50
                                       transition-colors"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={processing || isCancelled}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600
                                       px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? "Saving…" : "Update Purchase"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
