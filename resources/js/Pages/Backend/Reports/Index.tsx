import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
    BarChart2,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
    Package,
    Users,
    Briefcase,
    ArrowRight,
} from "lucide-react";

const REPORTS = [
    {
        key: "sales",
        title: "Sales Report",
        description:
            "Daily sales, revenue, discounts, tax, and payment status breakdown.",
        icon: ShoppingCart,
        color: "indigo",
        route: "backend.reports.sales",
    },
    {
        key: "purchases",
        title: "Purchase Report",
        description:
            "Purchase orders, supplier-wise costs, payment dues, and order status.",
        icon: Package,
        color: "blue",
        route: "backend.reports.purchases",
    },
    {
        key: "expenses",
        title: "Expense Report",
        description:
            "Expense entries grouped by category with status and payment method.",
        icon: TrendingDown,
        color: "red",
        route: "backend.reports.expenses",
    },
    {
        key: "profit-loss",
        title: "Profit & Loss Statement",
        description:
            "Revenue vs COGS vs expenses — gross profit, net profit, and margins.",
        icon: BarChart2,
        color: "green",
        route: "backend.reports.profit-loss",
    },
    {
        key: "inventory",
        title: "Inventory Report",
        description:
            "Current stock levels, stock value, low stock, and out-of-stock items.",
        icon: Package,
        color: "amber",
        route: "backend.reports.inventory",
    },
    {
        key: "customer-ledger",
        title: "Customer Ledger",
        description:
            "Per-customer sales history, total spent, paid amount, and dues.",
        icon: Users,
        color: "purple",
        route: "backend.reports.customer-ledger",
    },
    {
        key: "investments",
        title: "Investment Report",
        description:
            "Investment entries and profit distributions paid out in the period.",
        icon: Briefcase,
        color: "teal",
        route: "backend.reports.investments",
    },
];

// Tailwind color map — avoids dynamic class purging
const COLOR_MAP: Record<string, { bg: string; icon: string; arrow: string }> = {
    indigo: {
        bg: "bg-indigo-50",
        icon: "text-indigo-600",
        arrow: "text-indigo-500",
    },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", arrow: "text-blue-500" },
    red: { bg: "bg-red-50", icon: "text-red-600", arrow: "text-red-500" },
    green: {
        bg: "bg-green-50",
        icon: "text-green-600",
        arrow: "text-green-500",
    },
    amber: {
        bg: "bg-amber-50",
        icon: "text-amber-600",
        arrow: "text-amber-500",
    },
    purple: {
        bg: "bg-purple-50",
        icon: "text-purple-600",
        arrow: "text-purple-500",
    },
    teal: { bg: "bg-teal-50", icon: "text-teal-600", arrow: "text-teal-500" },
};

export default function ReportsIndex() {
    return (
        <AuthenticatedLayout>
            <Head title="Reports" />

            <div className="space-y-6">
                {/* Page header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Reports
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Filterable, exportable business reports — select a
                        report to get started.
                    </p>
                </div>

                {/* Report cards grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {REPORTS.map((report) => {
                        const colors = COLOR_MAP[report.color];
                        const Icon = report.icon;

                        return (
                            <Link
                                key={report.key}
                                href={route(report.route)}
                                className="group flex flex-col rounded-lg border border-gray-200 bg-white p-5
                                           shadow-sm transition hover:border-gray-300 hover:shadow-md"
                            >
                                {/* Icon */}
                                <div
                                    className={`mb-4 inline-flex w-fit rounded-lg p-2.5 ${colors.bg}`}
                                >
                                    <Icon
                                        className={`h-5 w-5 ${colors.icon}`}
                                    />
                                </div>

                                {/* Title + description */}
                                <h2 className="text-sm font-semibold text-gray-800">
                                    {report.title}
                                </h2>
                                <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-500">
                                    {report.description}
                                </p>

                                {/* CTA */}
                                <div
                                    className={`mt-4 flex items-center gap-1 text-xs font-medium ${colors.arrow}
                                                transition group-hover:gap-2`}
                                >
                                    View Report
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
