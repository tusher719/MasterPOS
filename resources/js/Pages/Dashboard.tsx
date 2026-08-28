import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { BarChart3, Boxes, ShoppingCart, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { route } from "ziggy-js";
import InventoryTab from "./Backend/Dashboard/_components/InventoryTab";
import InvestmentsTab from "./Backend/Dashboard/_components/InvestmentsTab";
import SalesTab from "./Backend/Dashboard/_components/SalesTab";
import {
    PeriodFilter,
    PeriodParams,
    Skeleton,
} from "./Backend/Dashboard/_components/SharedComponents";

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabKey = "sales" | "inventory" | "investments";

interface Tab {
    key: TabKey;
    label: string;
    icon: React.ElementType;
    routeName: string;
    activeColor: string;
    activeBg: string;
}

const TABS: Tab[] = [
    {
        key: "sales",
        label: "Sales",
        icon: ShoppingCart,
        routeName: "dashboard.sales.data",
        activeColor: "text-indigo-600",
        activeBg: "bg-indigo-50",
    },
    {
        key: "inventory",
        label: "Inventory",
        icon: Boxes,
        routeName: "dashboard.inventory.data",
        activeColor: "text-emerald-600",
        activeBg: "bg-emerald-50",
    },
    {
        key: "investments",
        label: "Investments",
        icon: TrendingUp,
        routeName: "dashboard.investments.data",
        activeColor: "text-amber-600",
        activeBg: "bg-amber-50",
    },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<TabKey>("sales");
    const [periodParams, setPeriodParams] = useState<PeriodParams>({
        period: "this_month",
    });
    const [tabData, setTabData] = useState<Record<TabKey, any>>({
        sales: null,
        inventory: null,
        investments: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentTab = TABS.find((t) => t.key === activeTab)!;

    const fetchData = useCallback(async (tab: TabKey, params: PeriodParams) => {
        setLoading(true);
        setError(null);

        try {
            const config = TABS.find((t) => t.key === tab)!;
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
                `${route(config.routeName)}?${query.toString()}`,
                {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                },
            );

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            setTabData((prev) => ({ ...prev, [tab]: json }));
        } catch (err) {
            setError("Could not load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch whenever tab or period changes
    useEffect(() => {
        fetchData(activeTab, periodParams);
    }, [activeTab, periodParams, fetchData]);

    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
    };

    const handlePeriodChange = (params: PeriodParams) => {
        setPeriodParams(params);
        // Clear current tab data so skeleton shows on period change
        setTabData((prev) => ({ ...prev, [activeTab]: null }));
    };

    const currentData = tabData[activeTab];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-5 p-6">
                {/* ── Header ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Dashboard
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {currentTab.label} overview for your business
                        </p>
                    </div>
                    <PeriodFilter
                        value={periodParams}
                        onChange={handlePeriodChange}
                        loading={loading}
                    />
                </div>

                {/* ── Tab bar ── */}
                <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                                    active
                                        ? `${tab.activeBg} ${tab.activeColor} shadow-sm`
                                        : "text-gray-500 hover:bg-gray-50"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-sm text-red-700">{error}</p>
                        <button
                            onClick={() => fetchData(activeTab, periodParams)}
                            className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* ── Content ── */}
                {loading || !currentData ? (
                    <Skeleton />
                ) : (
                    <>
                        {activeTab === "sales" && (
                            <SalesTab data={currentData} />
                        )}
                        {activeTab === "inventory" && (
                            <InventoryTab data={currentData} />
                        )}
                        {activeTab === "investments" && (
                            <InvestmentsTab data={currentData} />
                        )}
                    </>
                )}

                {/* ── Footer ── */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400">
                        Full analytics with charts available in the backend
                        dashboard
                    </p>
                    <Link
                        href={route("backend.dashboard.index")}
                        className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Backend Dashboard
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
