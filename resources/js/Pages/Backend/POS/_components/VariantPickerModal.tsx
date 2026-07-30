import { X } from "lucide-react";

export interface ProductVariant {
    id: number;
    sku: string;
    attributes: Record<string, string>;
    stock_qty: number;
    price_override: number | null;
    cost_price_override: number | null;
    is_active: boolean;
    label: string; // from backend accessor e.g. "Red / XL"
}

interface Props {
    productName: string;
    variants: ProductVariant[];
    onSelect: (variant: ProductVariant) => void;
    onClose: () => void;
}

export default function VariantPickerModal({
    productName,
    variants,
    onSelect,
    onClose,
}: Props) {
    const active = variants.filter((v) => v.is_active);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                            Select Variant
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-500">
                            {productName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Variant list */}
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {active.length === 0 && (
                        <p className="px-5 py-6 text-center text-sm text-gray-400">
                            No active variants available.
                        </p>
                    )}
                    {active.map((v) => {
                        const outOfStock = v.stock_qty <= 0;
                        return (
                            <button
                                key={v.id}
                                type="button"
                                disabled={outOfStock}
                                onClick={() => onSelect(v)}
                                className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        {v.label}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        SKU: {v.sku}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-indigo-600">
                                        ৳
                                        {Number(v.price_override ?? 0).toFixed(
                                            2,
                                        )}
                                    </p>
                                    <p
                                        className={`text-xs ${outOfStock ? "text-red-400" : "text-gray-400"}`}
                                    >
                                        {outOfStock
                                            ? "Out of stock"
                                            : `Stock: ${v.stock_qty}`}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-5 py-3 text-right">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
