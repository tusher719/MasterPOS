import { InventoryData, LowStockProduct, NeverSoldProduct } from "../Index";
import { Package, AlertTriangle, XCircle, PackageX, Boxes } from "lucide-react";

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

function StatCard({
    label,
    value,
    icon,
    gradient,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    gradient: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-3.5 transition hover:shadow-sm">
            <div
                className={`absolute -right-3 -top-3 h-14 w-14 rounded-full opacity-[0.08] ${gradient}`}
            />
            <div className="relative flex items-center gap-2">
                <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${gradient}`}
                >
                    {icon}
                </div>
                <p className="text-[11px] font-medium text-gray-500">{label}</p>
            </div>
            <p className="relative mt-2 text-lg font-bold text-gray-800">
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                    label="Inventory Value"
                    value={fmtCurrency(inventory.total_inventory_value)}
                    icon={<Boxes className="h-3.5 w-3.5" />}
                    gradient="bg-indigo-500"
                />
                <StatCard
                    label="Total SKU"
                    value={inventory.total_sku.toLocaleString()}
                    icon={<Package className="h-3.5 w-3.5" />}
                    gradient="bg-gray-500"
                />
                <StatCard
                    label="Low Stock"
                    value={inventory.low_stock_count.toLocaleString()}
                    icon={<AlertTriangle className="h-3.5 w-3.5" />}
                    gradient="bg-amber-500"
                />
                <StatCard
                    label="Out of Stock"
                    value={inventory.out_of_stock_count.toLocaleString()}
                    icon={<XCircle className="h-3.5 w-3.5" />}
                    gradient="bg-red-500"
                />
            </div>

            <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Low stock products
                </p>
                {lowStock.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-3 text-xs text-gray-400">
                        <Package className="h-4 w-4" />
                        No low stock products — inventory looks healthy.
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {lowStock.map((p) => {
                            const pct =
                                p.low_stock_threshold > 0
                                    ? Math.min(
                                          100,
                                          (p.stock_qty /
                                              p.low_stock_threshold) *
                                              100,
                                      )
                                    : 0;
                            return (
                                <div
                                    key={p.id}
                                    className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 text-xs transition hover:border-amber-200 hover:bg-amber-50/40"
                                >
                                    <span className="min-w-0 flex-1 truncate text-gray-700">
                                        {p.name}
                                    </span>
                                    <div className="h-1.5 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            className="h-full rounded-full bg-amber-400"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                                        {p.stock_qty}/{p.low_stock_threshold}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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
                                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-xs transition hover:bg-gray-50"
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
