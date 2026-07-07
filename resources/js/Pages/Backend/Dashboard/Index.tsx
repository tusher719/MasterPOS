import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useState, useEffect, useCallback } from "react";
import { route } from "ziggy-js";
import PeriodFilter from "./_components/PeriodFilter";
import FinancialSummary from "./_components/FinancialSummary";
import SalesChart from "./_components/SalesChart";
import SalesAnalytics from "./_components/SalesAnalytics";
import InventoryPanel from "./_components/InventoryPanel";
import CustomerAnalytics from "./_components/CustomerAnalytics";
import ProductAnalytics from "./_components/ProductAnalytics";
import NeedsAttention from "./_components/NeedsAttention";
import RecentActivities from "./_components/RecentActivities";
import NotificationsPanel from "./_components/NotificationsPanel";
import RecentSales from "./_components/RecentSales";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeriodMeta {
    type: string;
    from: string;
    to: string;
}

export interface FinancialData {
    revenue: number;
    today_revenue: number;
    expenses: number;
    cogs: number;
    net_profit: number;
    today_profit: number;
    sales_count: number;
    aov: number;
    profit_margin: number;
    sales_due: number;
    purchase_due: number;
    total_investment: number;
    total_distributed: number;
    prev_revenue: number;
    prev_expenses: number;
    prev_profit: number;
    revenue_change_pct: number;
    expenses_change_pct: number;
    profit_change_pct: number;
}

export interface SalesAnalyticsData {
    payment_breakdown: { method: string; count: number; total: number }[];
    status_breakdown: {
        payment_status: string;
        count: number;
        total: number;
    }[];
}

export interface InventoryData {
    total_inventory_value: number;
    total_sku: number;
    out_of_stock_count: number;
    low_stock_count: number;
}

export interface CustomerAnalyticsData {
    total: number;
    new: number;
    returning: number;
}

export interface ProductItem {
    id: number;
    name: string;
    total_qty: number;
    total_revenue?: number;
    total_profit?: number;
}

export interface ProductAnalyticsData {
    fast_moving: ProductItem[];
    slow_moving: ProductItem[];
    highest_profit: ProductItem[];
}

export interface ChartData {
    granularity: "daily" | "monthly";
    sales_trend: { label: string; revenue: number; count: number }[];
    expense_trend: { label: string; amount: number }[];
    expense_by_category: { category: string; total: number }[];
}

export interface RecentSaleItem {
    id: number;
    reference_no: string;
    sale_date: string;
    grand_total: number;
    payment_status: string;
    customer_name: string;
}

export interface TopProduct {
    id: number;
    name: string;
    total_qty: number;
    total_revenue: number;
}

export interface TopCustomer {
    id: number;
    name: string;
    phone: string;
    total_orders: number;
    total_spent: number;
}

export interface LowStockProduct {
    id: number;
    name: string;
    stock_qty: number;
    low_stock_threshold: number;
}

export interface NeverSoldProduct {
    id: number;
    name: string;
    stock_qty: number;
    sale_price: number;
}

export interface NeedsAttentionData {
    low_stock_count: number;
    out_of_stock_count: number;
    sales_due_count: number;
    purchase_due_count: number;
    draft_distributions_count: number;
    unread_notifications_count: number;
}

export interface ActivityItem {
    id: number;
    user_id: number;
    module: string;
    action: string;
    description: string;
    created_at: string;
    user?: { id: number; name: string };
}

export interface NotificationItem {
    id: string;
    type: string;
    data: string;
    read_at: string | null;
    created_at: string;
}

export interface DashboardData {
    period: PeriodMeta;
    financial: FinancialData;
    sales_analytics: SalesAnalyticsData;
    inventory: InventoryData;
    customer_analytics: CustomerAnalyticsData;
    product_analytics: ProductAnalyticsData;
    charts: ChartData;
    recent_sales: RecentSaleItem[];
    top_products: TopProduct[];
    top_customers: TopCustomer[];
    low_stock: LowStockProduct[];
    never_sold: NeverSoldProduct[];
    needs_attention: NeedsAttentionData;
    recent_activities: ActivityItem[];
    recent_notifications: NotificationItem[];
}

export type PeriodType =
    | "today"
    | "this_week"
    | "this_month"
    | "this_year"
    | "custom";

export interface PeriodParams {
    period: PeriodType;
    date_from?: string;
    date_to?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardIndex() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [periodParams, setPeriodParams] = useState<PeriodParams>({
        period: "this_month",
    });

    const fetchData = useCallback(async (params: PeriodParams) => {
        setLoading(true);
        setError(null);

        try {
            const query = new URLSearchParams({ period: params.period });
            if (
                params.period === "custom" &&
                params.date_from &&
                params.date_to
            ) {
                query.set("date_from", params.date_from);
                query.set("date_to", params.date_to);
            }

            const res = await fetch(
                `${route("backend.dashboard.data")}?${query.toString()}`,
                {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                },
            );

            if (!res.ok) throw new Error("Failed to load dashboard data.");

            const json: DashboardData = await res.json();
            setData(json);
        } catch (err) {
            setError("Could not load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(periodParams);
    }, [periodParams, fetchData]);

    const handlePeriodChange = (params: PeriodParams) => {
        setPeriodParams(params);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6 p-6">
                {/* ── Header ── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Dashboard
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Business overview and analytics
                        </p>
                    </div>

                    <PeriodFilter
                        value={periodParams}
                        onChange={handlePeriodChange}
                        disabled={loading}
                    />
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* ── Needs Attention ── */}
                {data && <NeedsAttention data={data.needs_attention} />}

                {/* ── Financial Summary ── */}
                <Section title="Financial overview" loading={loading}>
                    {data && (
                        <FinancialSummary
                            financial={data.financial}
                            period={data.period}
                        />
                    )}
                </Section>

                {/* ── Charts row ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Section
                            title="Sales & expense trend"
                            loading={loading}
                        >
                            {data && <SalesChart charts={data.charts} />}
                        </Section>
                    </div>
                    <div>
                        <Section title="Sales analytics" loading={loading}>
                            {data && (
                                <SalesAnalytics
                                    analytics={data.sales_analytics}
                                    charts={data.charts}
                                />
                            )}
                        </Section>
                    </div>
                </div>

                {/* ── Inventory + Customer row ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Section title="Inventory" loading={loading}>
                        {data && (
                            <InventoryPanel
                                inventory={data.inventory}
                                lowStock={data.low_stock}
                                neverSold={data.never_sold}
                            />
                        )}
                    </Section>
                    <Section title="Customers" loading={loading}>
                        {data && (
                            <CustomerAnalytics
                                analytics={data.customer_analytics}
                                topCustomers={data.top_customers}
                            />
                        )}
                    </Section>
                </div>

                {/* ── Product Analytics ── */}
                <Section title="Product analytics" loading={loading}>
                    {data && (
                        <ProductAnalytics
                            analytics={data.product_analytics}
                            topProducts={data.top_products}
                        />
                    )}
                </Section>

                {/* ── Recent Sales ── */}
                <Section title="Recent sales" loading={loading}>
                    {data && <RecentSales sales={data.recent_sales} />}
                </Section>

                {/* ── Activity + Notifications row ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Section title="Recent activities" loading={loading}>
                        {data && (
                            <RecentActivities
                                activities={data.recent_activities}
                            />
                        )}
                    </Section>
                    <Section title="Notifications" loading={loading}>
                        {data && (
                            <NotificationsPanel
                                notifications={data.recent_notifications}
                            />
                        )}
                    </Section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({
    title,
    loading,
    children,
}: {
    title: string;
    loading: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
                <h2 className="text-sm font-medium text-gray-700">{title}</h2>
            </div>
            <div className="p-5">{loading ? <Skeleton /> : children}</div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="animate-pulse space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-100" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
            <div className="h-4 w-2/3 rounded bg-gray-100" />
        </div>
    );
}
