// resources/js/Pages/Backend/Purchases/_components/PurchaseFormFields.tsx

import React, { useCallback } from "react";
import { Plus, Minus, Trash2, AlertCircle } from "lucide-react";

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

export interface PurchaseItemRow {
    product_id: number | "";
    quantity: number;
    unit_cost: number;
    subtotal: number;
}

export interface PurchaseFormData {
    supplier_id: number | "";
    purchase_date: string;
    purchase_status: string;
    discount: number;
    tax: number;
    shipping_cost: number;
    paid_amount: number;
    payment_method_id: number | "";
    note: string;
    items: PurchaseItemRow[];
}

interface Props {
    data: PurchaseFormData;
    errors: Partial<Record<string, string>>;
    suppliers: Supplier[];
    products: Product[];
    paymentMethods: PaymentMethod[];
    purchaseStatuses: Record<string, string>;
    onChange: (field: keyof PurchaseFormData, value: unknown) => void;
    onItemChange: (index: number, updates: Partial<PurchaseItemRow>) => void;
    onAddItem: () => void;
    onRemoveItem: (index: number) => void;
    isEdit?: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
    label,
    error,
    required,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            {children}
            {error && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}

function inputClass(error?: string) {
    return `w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1
        ${
            error
                ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
        }`;
}

function formatCurrency(value: number): string {
    return Number(value).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PurchaseFormFields({
    data,
    errors,
    suppliers,
    products,
    paymentMethods,
    purchaseStatuses,
    onChange,
    onItemChange,
    onAddItem,
    onRemoveItem,
    isEdit = false,
}: Props) {
    // ── Derived Totals ────────────────────────────────────────────────────────

    const subtotal = data.items.reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0,
    );

    const grandTotal = Math.max(
        0,
        subtotal -
            (data.discount || 0) +
            (data.tax || 0) +
            (data.shipping_cost || 0),
    );

    const dueAmount = Math.max(0, grandTotal - (data.paid_amount || 0));

    // ── Item Change Handler ───────────────────────────────────────────────────

    const handleItemChange = useCallback(
        (index: number, updates: Partial<PurchaseItemRow>) => {
            onItemChange(index, updates);
        },
        [onItemChange],
    );

    // ── Auto-fill unit_cost from product cost_price ───────────────────────────

    function handleProductSelect(index: number, productId: number | string) {
        const id = Number(productId);
        const product = products.find((p) => p.id === id);

        handleItemChange(index, {
            product_id: id || "",
            unit_cost: product ? product.cost_price : 0,
        });
    }

    return (
        <div className="space-y-5">
            {/* ── Section 1: Purchase Info ─────────────────────────────────── */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Purchase Information
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Supplier */}
                    <div className="lg:col-span-2">
                        <Field
                            label="Supplier"
                            error={errors.supplier_id}
                            required
                        >
                            <select
                                value={data.supplier_id}
                                onChange={(e) =>
                                    onChange(
                                        "supplier_id",
                                        Number(e.target.value) || "",
                                    )
                                }
                                className={inputClass(errors.supplier_id)}
                            >
                                <option value="">Select supplier…</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                        {s.company ? ` — ${s.company}` : ""}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    {/* Purchase Date */}
                    <Field
                        label="Purchase Date"
                        error={errors.purchase_date}
                        required
                    >
                        <input
                            type="date"
                            value={data.purchase_date}
                            onChange={(e) =>
                                onChange("purchase_date", e.target.value)
                            }
                            className={inputClass(errors.purchase_date)}
                        />
                    </Field>

                    {/* Purchase Status */}
                    <Field
                        label="Purchase Status"
                        error={errors.purchase_status}
                        required
                    >
                        <select
                            value={data.purchase_status}
                            onChange={(e) =>
                                onChange("purchase_status", e.target.value)
                            }
                            disabled={
                                isEdit && data.purchase_status === "cancelled"
                            }
                            className={inputClass(errors.purchase_status)}
                        >
                            {Object.entries(purchaseStatuses).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label as string}
                                    </option>
                                ),
                            )}
                        </select>
                    </Field>
                </div>
            </div>

            {/* ── Section 2: Purchase Items ────────────────────────────────── */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Purchase Items
                    </h3>
                    <button
                        type="button"
                        onClick={onAddItem}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600
                                   px-3 py-1.5 text-xs font-medium text-white
                                   hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Item
                    </button>
                </div>

                {errors.items && (
                    <p className="mb-3 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {errors.items}
                    </p>
                )}

                {/* Items Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="px-3 py-2 text-left font-medium text-gray-500 w-[35%]">
                                    Product
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-gray-500 w-[10%]">
                                    Stock
                                </th>
                                <th className="px-3 py-2 text-center font-medium text-gray-500 w-[20%]">
                                    Qty
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-gray-500 w-[15%]">
                                    Unit Cost
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-gray-500 w-[15%]">
                                    Subtotal
                                </th>
                                <th className="w-10" />
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {data.items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-3 py-6 text-center text-sm text-gray-400"
                                    >
                                        No items added yet. Click "Add Item" to
                                        begin.
                                    </td>
                                </tr>
                            ) : (
                                data.items.map((item, index) => {
                                    const selectedProduct = products.find(
                                        (p) => p.id === Number(item.product_id),
                                    );

                                    return (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-50/50"
                                        >
                                            {/* Product Select */}
                                            <td className="px-3 py-2">
                                                <select
                                                    value={item.product_id}
                                                    onChange={(e) =>
                                                        handleProductSelect(
                                                            index,
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={inputClass(
                                                        errors[
                                                            `items.${index}.product_id`
                                                        ],
                                                    )}
                                                >
                                                    <option value="">
                                                        Select product…
                                                    </option>
                                                    {products.map((p) => (
                                                        <option
                                                            key={p.id}
                                                            value={p.id}
                                                        >
                                                            {p.name}
                                                            {p.sku
                                                                ? ` (${p.sku})`
                                                                : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors[
                                                    `items.${index}.product_id`
                                                ] && (
                                                    <p className="mt-0.5 text-xs text-red-500">
                                                        {
                                                            errors[
                                                                `items.${index}.product_id`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </td>

                                            {/* Current Stock */}
                                            <td className="px-3 py-2 text-right text-gray-500">
                                                {selectedProduct
                                                    ? selectedProduct.stock_qty
                                                    : "—"}
                                            </td>

                                            {/* Quantity with +/- stepper */}
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleItemChange(
                                                                index,
                                                                {
                                                                    quantity:
                                                                        Math.max(
                                                                            1,
                                                                            item.quantity -
                                                                                1,
                                                                        ),
                                                                },
                                                            )
                                                        }
                                                        className="flex h-9 w-8 shrink-0 items-center
                                                                   justify-center rounded-md border
                                                                   border-gray-300 text-gray-500
                                                                   hover:bg-gray-100 hover:text-gray-700
                                                                   transition-colors"
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </button>

                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            handleItemChange(
                                                                index,
                                                                {
                                                                    quantity:
                                                                        Math.max(
                                                                            1,
                                                                            parseInt(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                1,
                                                                        ),
                                                                },
                                                            )
                                                        }
                                                        className={`text-center ${inputClass(
                                                            errors[
                                                                `items.${index}.quantity`
                                                            ],
                                                        )}`}
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleItemChange(
                                                                index,
                                                                {
                                                                    quantity:
                                                                        item.quantity +
                                                                        1,
                                                                },
                                                            )
                                                        }
                                                        className="flex h-9 w-8 shrink-0 items-center
                                                                   justify-center rounded-md border
                                                                   border-gray-300 text-gray-500
                                                                   hover:bg-gray-100 hover:text-gray-700
                                                                   transition-colors"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                {errors[
                                                    `items.${index}.quantity`
                                                ] && (
                                                    <p className="mt-0.5 text-xs text-red-500">
                                                        {
                                                            errors[
                                                                `items.${index}.quantity`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </td>

                                            {/* Unit Cost */}
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={item.unit_cost}
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            index,
                                                            {
                                                                unit_cost:
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                            },
                                                        )
                                                    }
                                                    className={`text-right ${inputClass(
                                                        errors[
                                                            `items.${index}.unit_cost`
                                                        ],
                                                    )}`}
                                                />
                                                {errors[
                                                    `items.${index}.unit_cost`
                                                ] && (
                                                    <p className="mt-0.5 text-xs text-red-500">
                                                        {
                                                            errors[
                                                                `items.${index}.unit_cost`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </td>

                                            {/* Subtotal */}
                                            <td className="px-3 py-2 text-right font-medium text-gray-700 whitespace-nowrap">
                                                ৳{" "}
                                                {formatCurrency(item.subtotal)}
                                            </td>

                                            {/* Remove */}
                                            <td className="px-3 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onRemoveItem(index)
                                                    }
                                                    disabled={
                                                        data.items.length === 1
                                                    }
                                                    className="rounded-md p-1 text-gray-400
                                                               hover:bg-red-50 hover:text-red-500
                                                               disabled:opacity-30 disabled:cursor-not-allowed
                                                               transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Section 3: Totals & Payment ──────────────────────────────── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Note */}
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Note
                    </h3>
                    <textarea
                        rows={5}
                        value={data.note}
                        onChange={(e) => onChange("note", e.target.value)}
                        placeholder="Optional note about this purchase…"
                        className={inputClass(errors.note)}
                    />
                    {errors.note && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.note}
                        </p>
                    )}
                </div>

                {/* Order Summary */}
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Order Summary
                    </h3>

                    <div className="space-y-3">
                        {/* Subtotal — read only */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium text-gray-800">
                                ৳ {formatCurrency(subtotal)}
                            </span>
                        </div>

                        {/* Discount */}
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="shrink-0 text-gray-600">
                                Discount (৳)
                            </span>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={data.discount}
                                onChange={(e) =>
                                    onChange(
                                        "discount",
                                        parseFloat(e.target.value) || 0,
                                    )
                                }
                                className="w-36 rounded-md border border-gray-300 px-3 py-1.5
                                           text-right text-sm focus:border-indigo-500
                                           focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Tax */}
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="shrink-0 text-gray-600">
                                Tax (৳)
                            </span>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={data.tax}
                                onChange={(e) =>
                                    onChange(
                                        "tax",
                                        parseFloat(e.target.value) || 0,
                                    )
                                }
                                className="w-36 rounded-md border border-gray-300 px-3 py-1.5
                                           text-right text-sm focus:border-indigo-500
                                           focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Shipping */}
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="shrink-0 text-gray-600">
                                Shipping (৳)
                            </span>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={data.shipping_cost}
                                onChange={(e) =>
                                    onChange(
                                        "shipping_cost",
                                        parseFloat(e.target.value) || 0,
                                    )
                                }
                                className="w-36 rounded-md border border-gray-300 px-3 py-1.5
                                           text-right text-sm focus:border-indigo-500
                                           focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Grand Total */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                            <span className="font-semibold text-gray-800">
                                Grand Total
                            </span>
                            <span className="text-lg font-bold text-indigo-600">
                                ৳ {formatCurrency(grandTotal)}
                            </span>
                        </div>

                        {/* Paid Amount */}
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="shrink-0 text-gray-600">
                                Paid Amount (৳)
                            </span>
                            <input
                                type="number"
                                min={0}
                                max={grandTotal}
                                step="0.01"
                                value={data.paid_amount}
                                onChange={(e) =>
                                    onChange(
                                        "paid_amount",
                                        Math.min(
                                            grandTotal,
                                            parseFloat(e.target.value) || 0,
                                        ),
                                    )
                                }
                                className="w-36 rounded-md border border-gray-300 px-3 py-1.5
                                           text-right text-sm focus:border-indigo-500
                                           focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Payment Method — only shown if paid_amount > 0 */}
                        {data.paid_amount > 0 && (
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="shrink-0 text-gray-600">
                                    Payment Method
                                </span>
                                <select
                                    value={data.payment_method_id}
                                    onChange={(e) =>
                                        onChange(
                                            "payment_method_id",
                                            Number(e.target.value) || "",
                                        )
                                    }
                                    className="w-36 rounded-md border border-gray-300 px-3 py-1.5
                                               text-sm focus:border-indigo-500 focus:outline-none
                                               focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Select…</option>
                                    {paymentMethods.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Due Amount */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                            <span className="font-semibold text-gray-800">
                                Due Amount
                            </span>
                            <span
                                className={`text-lg font-bold ${
                                    dueAmount > 0
                                        ? "text-red-500"
                                        : "text-green-600"
                                }`}
                            >
                                ৳ {formatCurrency(dueAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
