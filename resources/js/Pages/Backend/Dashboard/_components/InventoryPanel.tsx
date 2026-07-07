import { InventoryData, LowStockProduct, NeverSoldProduct } from "../Index";
import { Package, AlertTriangle, XCircle, PackageX } from "lucide-react";

interface Props {
    inventory: InventoryData;
    lowStock: LowStockProduct[];
    neverSold: NeverSoldProduct[];
}

function fmtCurrency(value: number): string {
    return (
        "৳" +
        Number(value).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

function StatBox({
    label,
    value,
    icon,
    accent,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    accent: string;
}) {
    return (
        <div className="rounded-md border border-gray-100 p-3">
            <div className="flex items-center gap-2">
                <div className={`rounded-md p-1.5 ${accent}`}>{icon}</div>
                <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className="mt-1.5 text-base font-semibold text-gray-800">
                {value}
            </p>
        </div>
    );
}

export default function InventoryPanel({
    inventory,
    lowStock,
    neverSold,
}: Props) {
    return (
        <div className="space-y-5">
            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatBox
                    label="Inventory Value"
                    value={fmtCurrency(inventory.total_inventory_value)}
                    icon={<Package className="h-3.5 w-3.5 text-indigo-600" />}
                    accent="bg-indigo-50"
                />
                <StatBox
                    label="Total SKU"
                    value={inventory.total_sku.toLocaleString()}
                    icon={<Package className="h-3.5 w-3.5 text-gray-500" />}
                    accent="bg-gray-100"
                />
                <StatBox
                    label="Low Stock"
                    value={inventory.low_stock_count.toLocaleString()}
                    icon={
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    }
                    accent="bg-amber-50"
                />
                <StatBox
                    label="Out of Stock"
                    value={inventory.out_of_stock_count.toLocaleString()}
                    icon={<XCircle className="h-3.5 w-3.5 text-red-500" />}
                    accent="bg-red-50"
                />
            </div>

            {/* Low stock list */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Low stock products
                </p>
                {lowStock.length === 0 ? (
                    <p className="text-xs text-gray-400">
                        No low stock products.
                    </p>
                ) : (
                    <div className="space-y-1.5">
                        {lowStock.map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-xs"
                            >
                                <span className="truncate text-gray-700">
                                    {p.name}
                                </span>
                                <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                                    {p.stock_qty} / {p.low_stock_threshold}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Never sold list */}
            <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <PackageX className="h-3.5 w-3.5" />
                    Never sold products
                </p>
                {neverSold.length === 0 ? (
                    <p className="text-xs text-gray-400">
                        Every product has been sold at least once.
                    </p>
                ) : (
                    <div className="space-y-1.5">
                        {neverSold.map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-xs"
                            >
                                <span className="truncate text-gray-700">
                                    {p.name}
                                </span>
                                <span className="flex-shrink-0 text-gray-500">
                                    Stock: {p.stock_qty} ·{" "}
                                    {fmtCurrency(p.sale_price)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
