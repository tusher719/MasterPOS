import { PropsWithChildren, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import useFlashToast from "@/hooks/useFlashToast";
import {
    LayoutDashboard,
    Users,
    Shield,
    Package,
    Boxes,
    UserCircle,
    ShoppingCart,
    FileText,
    Receipt,
    Wallet,
    TrendingUp,
    BarChart3,
    Bell,
    LogOut,
    Menu,
} from "lucide-react";

const menu = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "dashboard",
        active: "dashboard*",
    },
    {
        label: "Users",
        icon: Users,
        href: "backend.users.index",
        active: "backend.users.*",
    },
    {
        label: "Roles & Permissions",
        icon: Shield,
        href: "backend.roles.index",
        active: "backend.roles.*",
    },
    {
        label: "Products",
        icon: Package,
        href: null,
        active: "backend.products.*",
    },
    {
        label: "Inventory",
        icon: Boxes,
        href: null,
        active: "backend.inventory.*",
    },
    {
        label: "Customers",
        icon: UserCircle,
        href: null,
        active: "backend.customers.*",
    },
    { label: "POS", icon: ShoppingCart, href: null, active: "backend.pos.*" },
    { label: "Orders", icon: FileText, href: null, active: "backend.orders.*" },
    {
        label: "Invoices",
        icon: Receipt,
        href: null,
        active: "backend.invoices.*",
    },
    {
        label: "Expenses",
        icon: Wallet,
        href: null,
        active: "backend.expenses.*",
    },
    {
        label: "Investments",
        icon: TrendingUp,
        href: null,
        active: "backend.investments.*",
    },
    {
        label: "Reports",
        icon: BarChart3,
        href: null,
        active: "backend.reports.*",
    },
];

export default function AuthenticatedLayout({ children }: PropsWithChildren) {
    useFlashToast();
    const { auth } = usePage().props as any;
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside
                className={`${
                    collapsed ? "w-16" : "w-64"
                } flex flex-col border-r border-gray-200 bg-white transition-all duration-200`}
            >
                <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
                    {!collapsed && (
                        <span className="text-lg font-bold text-indigo-600">
                            Master POS
                        </span>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
                    {menu.map((item) => {
                        const Icon = item.icon;
                        const isImplemented =
                            item.href !== null && route().has(item.href);
                        const isActive =
                            isImplemented && route().current(item.active);

                        if (!isImplemented) {
                            return (
                                <div
                                    key={item.label}
                                    className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300"
                                    title="শীঘ্রই আসছে"
                                >
                                    <Icon size={18} />
                                    {!collapsed && <span>{item.label}</span>}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.label}
                                href={route(item.href as string)}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                <Icon size={18} />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
                    <div />
                    <div className="flex items-center gap-4">
                        <button className="relative text-gray-400 hover:text-gray-600">
                            <Bell size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                                {auth?.user?.name?.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                                {auth?.user?.name}
                            </span>
                        </div>
                        <Link
                            href={route("logout")}
                            method="post"
                            as="button"
                            className="text-gray-400 hover:text-red-500"
                        >
                            <LogOut size={18} />
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
