// resources/js/Pages/Backend/Purchases/Create.tsx

import React, { useCallback } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, ShoppingCart } from "lucide-react";
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

interface Props {
    suppliers: Supplier[];
    products: Product[];
    paymentMethods: PaymentMethod[];
    referenceNo: string;
    purchaseStatuses: Record<string, string>;
    paymentStatuses: Record<string, string>;
}

// ─── Default Item ─────────────────────────────────────────────────────────────

function makeEmptyItem(): PurchaseItemRow {
    return {
        product_id: "",
        quantity: 1,
        unit_cost: 0,
        subtotal: 0,
    };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Create({
    suppliers,
    products,
    paymentMethods,
    referenceNo,
    purchaseStatuses,
    paymentStatuses,
}: Props) {
    const { data, setData, post, processing, errors } =
        useForm<PurchaseFormData>({
            supplier_id: "",
            purchase_date: new Date().toISOString().split("T")[0],
            purchase_status: "draft",
            discount: 0,
            tax: 0,
            shipping_cost: 0,
            paid_amount: 0,
            payment_method_id: "",
            note: "",
            items: [makeEmptyItem()],
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
        setData("items", [...data.items, makeEmptyItem()]);
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

        post(route("backend.purchases.store"), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Purchase created successfully.");
            },
            onError: () => {
                toast.error("Please fix the errors and try again.");
            },
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="New Purchase" />

            <div className="space-y-5">
                {/* ── Page Header ───────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("backend.purchases.index")}
                            className="rounded-md p-1.5 text-gray-400
                                       hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                New Purchase
                            </h1>
                            <p className="mt-0.5 text-sm text-gray-500">
                                Ref:&nbsp;
                                <span className="font-medium text-indigo-600">
                                    {referenceNo}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

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
                        isEdit={false}
                    />

                    {/* ── Form Footer ───────────────────────────────────────── */}
                    <div
                        className="flex items-center justify-end gap-3 rounded-lg
                                    border border-gray-200 bg-white px-5 py-4"
                    >
                        <Link
                            href={route("backend.purchases.index")}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2
                                       text-sm font-medium text-gray-700 hover:bg-gray-50
                                       transition-colors"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600
                                       px-5 py-2 text-sm font-medium text-white
                                       hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            {processing ? "Saving…" : "Create Purchase"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
