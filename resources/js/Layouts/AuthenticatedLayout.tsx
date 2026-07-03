import { PropsWithChildren, useState, ElementType } from "react";
import { Link, usePage } from "@inertiajs/react";
import useFlashToast from "@/hooks/useFlashToast";
import {
    LayoutDashboard,
    Users,
    Shield,
    ClipboardList,
    History,
    Settings2,
    CreditCard,
    Tag,
    TrendingUp,
    Package,
    Boxes,
    UserCircle,
    ShoppingCart,
    FileText,
    Receipt,
    Wallet,
    BarChart3,
    ChevronDown,
    ChevronRight,
    Bell,
    LogOut,
    Menu,
    Building2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface NavItem {
    label: string;
    icon: ElementType;
    href?: string; // route name
    active?: string; // route pattern
    children?: NavItem[];
}

// ─── Navigation structure ───────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "dashboard",
        active: "dashboard*",
    },

    // ── User Management group ──
    {
        label: "User Management",
        icon: Users,
        children: [
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
        ],
    },

    // ── Audit group ──
    {
        label: "Audit & Logs",
        icon: ClipboardList,
        children: [
            {
                label: "Login History",
                icon: History,
                href: "backend.login-histories.index",
                active: "backend.login-histories.*",
            },
            {
                label: "Activity Log",
                icon: ClipboardList,
                href: "backend.activity-logs.index",
                active: "backend.activity-logs.*",
            },
        ],
    },

    // ── Settings group ──
    {
        label: "Settings",
        icon: Settings2,
        children: [
            {
                label: "Business Settings",
                icon: Building2,
                href: "backend.settings.index",
                active: "backend.settings.*",
            },
            {
                label: "Payment Methods",
                icon: CreditCard,
                href: "backend.payment-methods.index",
                active: "backend.payment-methods.*",
            },
            {
                label: "Expense Categories",
                icon: Tag,
                href: "backend.expense-categories.index",
                active: "backend.expense-categories.*",
            },
            {
                label: "Investment Types",
                icon: TrendingUp,
                href: "backend.investment-types.index",
                active: "backend.investment-types.*",
            },
        ],
    },

    // ── Products group ──

    {
        label: "Catalogue",
        icon: Package,
        children: [
            {
                label: "Products",
                icon: Package,
                href: "backend.products.index",
                active: "backend.products.*",
            },
            {
                label: "Categories",
                icon: Tag,
                href: "backend.product-categories.index",
                active: "backend.product-categories.*",
            },
            {
                label: "Units",
                icon: TrendingUp,
                href: "backend.units.index",
                active: "backend.units.*",
            },
        ],
    },

    // ── Placeholder / not-yet-implemented items ──
    { label: "Products", icon: Package, active: "backend.products.*" },
    { label: "Inventory", icon: Boxes, active: "backend.inventory.*" },
    { label: "Customers", icon: UserCircle, active: "backend.customers.*" },
    { label: "POS", icon: ShoppingCart, active: "backend.pos.*" },
    { label: "Orders", icon: FileText, active: "backend.orders.*" },
    { label: "Invoices", icon: Receipt, active: "backend.invoices.*" },
    { label: "Expenses", icon: Wallet, active: "backend.expenses.*" },
    {
        label: "Investments",
        icon: TrendingUp,
        active: "backend.investments.*",
    },
    { label: "Reports", icon: BarChart3, active: "backend.reports.*" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function routeExists(name?: string) {
    return !!name && route().has(name);
}

function isActive(pattern?: string) {
    return !!pattern && route().current(pattern);
}

// ─── Leaf nav item ──────────────────────────────────────────────────────────
function NavLeaf({
    item,
    collapsed,
    nested = false,
}: {
    item: NavItem;
    collapsed: boolean;
    nested?: boolean;
}) {
    const Icon = item.icon;
    const implemented = routeExists(item.href);
    const active = implemented && isActive(item.active);
    const padding = nested ? "pl-9 pr-3" : "px-3";

    if (!implemented) {
        return (
            <div
                className={`flex cursor-not-allowed items-center gap-3 rounded-lg ${padding} py-2.5 text-sm font-medium text-gray-300`}
                title="শীঘ্রই আসছে"
            >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
            </div>
        );
    }

    return (
        <Link
            href={route(item.href as string)}
            className={`flex items-center gap-3 rounded-lg ${padding} py-2.5 text-sm font-medium transition ${
                active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
            }`}
        >
            <Icon size={18} />
            {!collapsed && <span>{item.label}</span>}
        </Link>
    );
}

// ─── Collapsible group ──────────────────────────────────────────────────────
function NavGroup({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
    const Icon = item.icon;
    const anyChildActive =
        item.children?.some((c) => routeExists(c.href) && isActive(c.active)) ??
        false;
    const [open, setOpen] = useState(anyChildActive);

    if (collapsed) {
        // icon-only mode: just show the group icon, no dropdown
        return (
            <div
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    anyChildActive ? "text-indigo-700" : "text-gray-400"
                }`}
                title={item.label}
            >
                <Icon size={18} />
            </div>
        );
    }

    return (
        <div>
            <button
                onClick={() => setOpen((o) => !o)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    anyChildActive
                        ? "text-indigo-700"
                        : "text-gray-600 hover:bg-gray-100"
                }`}
            >
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {open ? (
                    <ChevronDown size={14} className="opacity-60" />
                ) : (
                    <ChevronRight size={14} className="opacity-60" />
                )}
            </button>

            {open && (
                <div className="ml-[22px] mt-0.5 space-y-0.5 border-l border-gray-100">
                    {item.children?.map((child) => (
                        <NavLeaf
                            key={child.label}
                            item={child}
                            collapsed={collapsed}
                            nested
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Layout ────────────────────────────────────────────────────────────
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
                    {NAV_ITEMS.map((item) =>
                        item.children ? (
                            <NavGroup
                                key={item.label}
                                item={item}
                                collapsed={collapsed}
                            />
                        ) : (
                            <NavLeaf
                                key={item.label}
                                item={item}
                                collapsed={collapsed}
                            />
                        ),
                    )}
                </nav>

                {/* User info at bottom */}
                <div className="border-t border-gray-100 p-3">
                    <div className="flex items-center gap-3 rounded-lg px-1 py-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                            {auth?.user?.name?.charAt(0)}
                        </div>
                        {!collapsed && (
                            <>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-700">
                                        {auth?.user?.name}
                                    </p>
                                    <p className="truncate text-xs text-gray-400">
                                        {auth?.user?.email}
                                    </p>
                                </div>
                                <Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                    className="shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                                    title="Logout"
                                >
                                    <LogOut size={16} />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
                    <div />
                    <div className="flex items-center gap-4">
                        <button className="relative text-gray-400 hover:text-gray-600">
                            <Bell size={20} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
