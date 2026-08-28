import { Link } from "@inertiajs/react";
import { AlertTriangle, Boxes, Package } from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { route } from "ziggy-js";
import {
    ChartTooltipBox,
    fmtShort,
    KpiCard,
    SectionCard,
} from "./SharedComponents";

// ─── Colors ───────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#f43f5e",
    "#0ea5e9",
    "#8b5cf6",
    "#fb923c",
    "#14b8a6",
];

// ─── Stock by category chart ──────────────────────────────────────────────────

function CategoryStockChart({ byCategory }: { byCategory: any[] }) {
    if (!byCategory?.length) {
        return <p className="text-xs text-gray-400">No category data.</p>;
    }

    const data = byCategory.map((c: any) => ({
        category: c.category,
        value: Number(c.total_value),
        qty: Number(c.total_qty),
        count: Number(c.product_count),
    }));

    return (
        <div className="space-y-3">
            <ResponsiveContainer width="100%" height={200}>
                <BarChart
                    data={data}
                    margin={{ top: 4, right: 8, left: 0, bottom: 24 }}
                    barSize={24}
                >
                    <CartesianGrid
                        strokeDasharray="3 6"
                        stroke="#f1f5f9"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="category"
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={fmtShort}
                        width={44}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                                <ChartTooltipBox
                                    label={d.category}
                                    rows={[
                                        {
                                            name: "Stock Value",
                                            value: fmtShort(d.value),
                                            color: "#6366f1",
                                        },
                                        {
                                            name: "Total Qty",
                                            value: String(d.qty),
                                            color: "#10b981",
                                        },
                                        {
                                            name: "Products",
                                            value: String(d.count),
                                            color: "#9ca3af",
                                        },
                                    ]}
                                />
                            );
                        }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.map((_, i) => (
                            <Cell
                                key={i}
                                fill={
                                    CATEGORY_COLORS[i % CATEGORY_COLORS.length]
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Legend rows */}
            <div className="space-y-1.5">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span
                            className="h-2 w-2 flex-shrink-0 rounded-full"
                            style={{
                                background:
                                    CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                            }}
                        />
                        <span className="flex-1 truncate text-gray-600">
                            {d.category}
                        </span>
                        <span className="text-gray-400">
                            {d.count} products
                        </span>
                        <span className="w-16 text-right font-medium text-gray-700">
                            {fmtShort(d.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Top moving chart ─────────────────────────────────────────────────────────

function TopMovingChart({ topMoving }: { topMoving: any[] }) {
    if (!topMoving?.length) {
        return (
            <p className="text-xs text-gray-400">
                No sales data in this period.
            </p>
        );
    }

    const data = topMoving.slice(0, 8).map((p: any) => ({
        name: p.name.length > 16 ? p.name.slice(0, 14) + "…" : p.name,
        fullName: p.name,
        qty: Number(p.total_qty_sold),
        revenue: Number(p.total_revenue),
        stock: Number(p.stock_qty),
    }));

    return (
        <div className="space-y-3">
            <ResponsiveContainer width="100%" height={200}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                    barSize={12}
                >
                    <CartesianGrid
                        strokeDasharray="3 6"
                        stroke="#f1f5f9"
                        horizontal={false}
                    />
                    <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#6b7280" }}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                                <ChartTooltipBox
                                    label={d.fullName}
                                    rows={[
                                        {
                                            name: "Qty Sold",
                                            value: String(d.qty),
                                            color: "#10b981",
                                        },
                                        {
                                            name: "Revenue",
                                            value: fmtShort(d.revenue),
                                            color: "#6366f1",
                                        },
                                        {
                                            name: "In Stock",
                                            value: String(d.stock),
                                            color: "#9ca3af",
                                        },
                                    ]}
                                />
                            );
                        }}
                    />
                    <Bar dataKey="qty" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Low stock list ───────────────────────────────────────────────────────────

function LowStockList({ lowStock }: { lowStock: any[] }) {
    if (!lowStock?.length) {
        return (
            <p className="text-xs text-gray-400">
                All products are well stocked.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {lowStock.map((p: any) => {
                const pct =
                    p.low_stock_threshold > 0
                        ? Math.min(
                              100,
                              (p.stock_qty / p.low_stock_threshold) * 100,
                          )
                        : 0;
                return (
                    <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-gray-700">
                                {p.name}
                            </p>
                            {p.category_name && (
                                <p className="text-[10px] text-gray-400">
                                    {p.category_name}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                {p.stock_qty}/{p.low_stock_threshold}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Out of stock list ────────────────────────────────────────────────────────

function OutOfStockList({
    outOfStock,
    neverSoldCount,
}: {
    outOfStock: any[];
    neverSoldCount: number;
}) {
    if (!outOfStock?.length) {
        return (
            <p className="text-xs text-gray-400">No out-of-stock products.</p>
        );
    }

    return (
        <div className="space-y-1.5">
            {outOfStock.slice(0, 10).map((p: any) => (
                <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-red-50 bg-red-50/30 px-3 py-2 text-xs"
                >
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-700">
                            {p.name}
                        </p>
                        {p.category_name && (
                            <p className="text-[10px] text-gray-400">
                                {p.category_name}
                            </p>
                        )}
                    </div>
                    <span className="flex-shrink-0 font-semibold text-gray-700">
                        {fmtShort(Number(p.sale_price))}
                    </span>
                </div>
            ))}
            {neverSoldCount > 0 && (
                <p className="mt-1 text-[10px] text-gray-400">
                    + {neverSoldCount} product(s) have never been sold.
                </p>
            )}
        </div>
    );
}

// ─── Main InventoryTab ────────────────────────────────────────────────────────

export default function InventoryTab({ data }: { data: any }) {
    const {
        kpis,
        low_stock,
        out_of_stock,
        never_sold,
        top_moving,
        by_category,
    } = data;

    return (
        <div className="space-y-5">
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard
                    label="Inventory Value"
                    value={fmtShort(kpis.total_inventory_value)}
                    sub={`${kpis.total_sku} SKUs total`}
                    icon={Boxes}
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-50"
                />
                <KpiCard
                    label="Active Products"
                    value={Number(kpis.active_products).toLocaleString()}
                    sub={`in ${kpis.category_count} categories`}
                    icon={Package}
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-50"
                />
                <KpiCard
                    label="Low Stock"
                    value={Number(kpis.low_stock_count).toLocaleString()}
                    sub="need restocking"
                    icon={AlertTriangle}
                    iconColor="text-amber-600"
                    iconBg="bg-amber-50"
                />
                <KpiCard
                    label="Out of Stock"
                    value={Number(kpis.out_of_stock_count).toLocaleString()}
                    sub="zero quantity"
                    icon={Package}
                    iconColor="text-red-600"
                    iconBg="bg-red-50"
                />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <SectionCard title="Stock Value by Category">
                    <CategoryStockChart byCategory={by_category ?? []} />
                </SectionCard>

                <SectionCard title="Top Moving Products (by qty sold)">
                    <TopMovingChart topMoving={top_moving ?? []} />
                </SectionCard>
            </div>

            {/* Low stock + out of stock */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <SectionCard
                    title={`Low Stock (${(low_stock ?? []).length})`}
                    action={
                        <Link
                            href={route("backend.products.index")}
                            className="font-medium text-emerald-600 hover:text-emerald-800"
                        >
                            Manage →
                        </Link>
                    }
                >
                    <LowStockList lowStock={low_stock ?? []} />
                </SectionCard>

                <SectionCard
                    title={`Out of Stock (${(out_of_stock ?? []).length})`}
                >
                    <OutOfStockList
                        outOfStock={out_of_stock ?? []}
                        neverSoldCount={(never_sold ?? []).length}
                    />
                </SectionCard>
            </div>
        </div>
    );
}
