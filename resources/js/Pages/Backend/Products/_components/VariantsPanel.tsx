import { Plus, Trash2 } from "lucide-react";

export interface VariantRow {
    // null id = new (not yet saved); number id = existing DB record
    id: number | null;
    sku: string;
    attributes: Record<string, string>; // e.g. { color: "Red", size: "XL" }
    stock_qty: string;
    price_override: string; // empty string = use product base price
    cost_price_override: string; // empty string = use product base cost
    is_active: boolean;
}

interface Props {
    rows: VariantRow[];
    onChange: (rows: VariantRow[]) => void;
    baseSalePrice: string;
    baseCostPrice: string;
}

// Common attribute keys to suggest — user can type anything
const COMMON_ATTRS = ["color", "size", "material", "style"];

function emptyRow(): VariantRow {
    return {
        id: null,
        sku: "",
        attributes: { color: "", size: "" },
        stock_qty: "0",
        price_override: "",
        cost_price_override: "",
        is_active: true,
    };
}

export default function VariantsPanel({
    rows,
    onChange,
    baseSalePrice,
    baseCostPrice,
}: Props) {
    const addRow = () => onChange([...rows, emptyRow()]);

    const removeRow = (index: number) => {
        onChange(rows.filter((_, i) => i !== index));
    };

    const updateRow = (index: number, patch: Partial<VariantRow>) => {
        onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    };

    const updateAttr = (rowIndex: number, key: string, value: string) => {
        const attrs = { ...rows[rowIndex].attributes, [key]: value };
        updateRow(rowIndex, { attributes: attrs });
    };

    const addAttrKey = (rowIndex: number) => {
        const existing = Object.keys(rows[rowIndex].attributes);
        const next =
            COMMON_ATTRS.find((k) => !existing.includes(k)) ?? "custom";
        const attrs = { ...rows[rowIndex].attributes, [next]: "" };
        updateRow(rowIndex, { attributes: attrs });
    };

    const removeAttrKey = (rowIndex: number, key: string) => {
        const attrs = { ...rows[rowIndex].attributes };
        delete attrs[key];
        updateRow(rowIndex, { attributes: attrs });
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div>
                    <h2 className="text-sm font-semibold text-gray-800">
                        Product Variants
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Leave price/cost blank to use the base product price
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                >
                    <Plus size={13} />
                    Add Variant
                </button>
            </div>

            {/* Empty state */}
            {rows.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                    No variants yet. Click "Add Variant" to start.
                </div>
            )}

            {/* Rows */}
            <div className="divide-y divide-gray-100">
                {rows.map((row, idx) => (
                    <div key={idx} className="px-5 py-4 space-y-3">
                        {/* Row header */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">
                                Variant {idx + 1}
                            </span>
                            <div className="flex items-center gap-3">
                                {/* Active toggle */}
                                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={row.is_active}
                                        onChange={(e) =>
                                            updateRow(idx, {
                                                is_active: e.target.checked,
                                            })
                                        }
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Active
                                </label>
                                <button
                                    type="button"
                                    onClick={() => removeRow(idx)}
                                    className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* SKU */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    SKU <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={row.sku}
                                    onChange={(e) =>
                                        updateRow(idx, { sku: e.target.value })
                                    }
                                    placeholder="e.g. RED-XL-001"
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Stock Qty
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={row.stock_qty}
                                    onChange={(e) =>
                                        updateRow(idx, {
                                            stock_qty: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Price overrides */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Sale Price Override
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={row.price_override}
                                    onChange={(e) =>
                                        updateRow(idx, {
                                            price_override: e.target.value,
                                        })
                                    }
                                    placeholder={`Base: ${baseSalePrice}`}
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Cost Price Override
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={row.cost_price_override}
                                    onChange={(e) =>
                                        updateRow(idx, {
                                            cost_price_override: e.target.value,
                                        })
                                    }
                                    placeholder={`Base: ${baseCostPrice}`}
                                    className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Attributes */}
                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-600">
                                    Attributes
                                </label>
                                <button
                                    type="button"
                                    onClick={() => addAttrKey(idx)}
                                    className="text-xs text-indigo-600 hover:text-indigo-700"
                                >
                                    + Add attribute
                                </button>
                            </div>
                            <div className="space-y-2">
                                {Object.entries(row.attributes).map(
                                    ([key, val]) => (
                                        <div
                                            key={key}
                                            className="flex items-center gap-2"
                                        >
                                            <input
                                                type="text"
                                                value={key}
                                                readOnly
                                                className="w-24 rounded-md border-gray-200 bg-gray-50 text-xs text-gray-500 focus:border-indigo-300 focus:ring-indigo-300"
                                            />
                                            <input
                                                type="text"
                                                value={val}
                                                onChange={(e) =>
                                                    updateAttr(
                                                        idx,
                                                        key,
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={`Enter ${key}`}
                                                className="flex-1 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeAttrKey(idx, key)
                                                }
                                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer count */}
            {rows.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-2.5 text-right text-xs text-gray-400">
                    {rows.length} variant{rows.length !== 1 ? "s" : ""}
                </div>
            )}
        </div>
    );
}
