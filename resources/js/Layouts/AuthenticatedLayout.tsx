import useFlashToast from "@/hooks/useFlashToast";
import { Notification, NotificationShared } from "@/types/notification";
import { Link, router, usePage } from "@inertiajs/react";
import {
    BarChart3,
    Bell,
    Boxes,
    Building2,
    CheckCheck,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    CreditCard,
    FileText,
    Gauge,
    History,
    Landmark,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    PieChart,
    Receipt,
    ScrollText,
    Settings2,
    Shield,
    ShoppingBag,
    ShoppingCart,
    Tag,
    Trash2,
    TrendingUp,
    Truck,
    Users,
    Wallet,
} from "lucide-react";
import {
    ElementType,
    PropsWithChildren,
    useEffect,
    useRef,
    useState,
} from "react";

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
    {
        label: "Backend Dashboard",
        icon: Gauge,
        href: "backend.dashboard.index",
        active: "backend.dashboard*",
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

    {
        label: "Purchase & Inventory",
        icon: Boxes,
        children: [
            {
                label: "Suppliers",
                icon: Truck,
                href: "backend.suppliers.index",
                active: "backend.suppliers.*",
            },
            {
                label: "Purchases",
                icon: ShoppingBag,
                href: "backend.purchases.index",
                active: "backend.purchases.*",
            },
        ],
    },
    {
        label: "Customers",
        icon: Users,
        children: [
            {
                label: "Customers",
                icon: Users,
                href: "backend.customers.index",
                active: "backend.customers.*",
            },
        ],
    },

    {
        label: "Point of Sale",
        icon: ShoppingCart,
        children: [
            {
                label: "POS Terminal",
                icon: ShoppingCart,
                href: "backend.pos.index",
                active: "backend.pos.index*",
            },
            {
                label: "Sales History",
                icon: ShoppingBag,
                href: "backend.pos.sales.index",
                active: "backend.pos.sales*",
            },
        ],
    },
    {
        label: "Invoices",
        icon: FileText,
        children: [
            {
                label: "Invoice List",
                icon: FileText,
                href: "backend.invoices.index",
                active: "backend.invoices*",
            },
        ],
    },
    {
        label: "Finance",
        icon: Wallet,
        children: [
            {
                label: "Expenses",
                icon: Receipt,
                href: "backend.expenses.index",
                active: "backend.expenses.*",
            },
        ],
    },
    {
        label: "Investments",
        icon: TrendingUp,
        children: [
            {
                label: "Investments",
                icon: TrendingUp,
                href: "backend.investments.index",
                active: "backend.investments.*",
            },
            {
                label: "Profit Distributions",
                icon: PieChart,
                href: "backend.profit-distributions.index",
                active: "backend.profit-distributions.*",
            },
            {
                label: "Investor Balances",
                icon: Wallet,
                href: "backend.investor-balances.index",
                active: "backend.investor-balances.*",
            },
            {
                label: "Capital Ledger",
                href: "backend.capital-ledger.index", // route() call না, শুধু route name string
                icon: Landmark,
                active: "backend.capital-ledger.*", // pattern matching consistent রাখো
            },
        ],
    },
    {
        label: "Reports",
        icon: BarChart3,
        children: [
            {
                label: "Reports",
                icon: ScrollText,
                href: "backend.reports.index",
                active: "backend.reports.index*",
            },
        ],
    },

    // ── Placeholder / not-yet-implemented items ──
    { label: "Orders", icon: FileText, active: "backend.orders.*" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function routeExists(name?: string) {
    return !!name && route().has(name);
}

function isActive(pattern?: string) {
    return !!pattern && route().current(pattern);
}

const NOTIFICATION_ICON_MAP: Record<string, React.ReactNode> = {
    package: <Package size={15} />,
    "shopping-cart": <ShoppingCart size={15} />,
    receipt: <Receipt size={15} />,
};

function getNotificationIcon(icon: string) {
    return NOTIFICATION_ICON_MAP[icon] ?? <Bell size={15} />;
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

// ─── Notification bell + dropdown ──────────────────────────────────────────
function NotificationBell() {
    const { notifications: notifShared } = usePage<{
        auth: any;
        notifications: NotificationShared;
    }>().props;

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleMarkRead = (id: string) => {
        router.post(
            route("backend.notifications.read", id),
            {},
            { preserveScroll: true },
        );
    };

    const handleMarkAllRead = () => {
        router.post(
            route("backend.notifications.read-all"),
            {},
            { preserveScroll: true },
        );
    };

    const handleDelete = (id: string) => {
        router.delete(route("backend.notifications.destroy", id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
                <Bell size={20} />
                {notifShared.unread_count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {notifShared.unread_count > 99
                            ? "99+"
                            : notifShared.unread_count}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <span className="text-sm font-semibold text-gray-800">
                            Notifications
                            {notifShared.unread_count > 0 && (
                                <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                    {notifShared.unread_count} new
                                </span>
                            )}
                        </span>
                        {notifShared.unread_count > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                            >
                                <CheckCheck size={13} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 divide-y divide-gray-50 overflow-y-auto">
                        {notifShared.latest.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-400">
                                No notifications yet
                            </div>
                        ) : (
                            notifShared.latest.map((n: Notification) => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                                        !n.read_at ? "bg-indigo-50/40" : ""
                                    }`}
                                >
                                    {/* Icon */}
                                    <div
                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                            !n.read_at
                                                ? "bg-indigo-100 text-indigo-600"
                                                : "bg-gray-100 text-gray-400"
                                        }`}
                                    >
                                        {getNotificationIcon(n.data.icon)}
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={`text-xs font-medium leading-snug ${
                                                !n.read_at
                                                    ? "text-gray-800"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            {n.data.title}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-gray-400">
                                            {n.data.message}
                                        </p>
                                        <p className="mt-1 text-[10px] text-gray-300">
                                            {n.created_at}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex shrink-0 flex-col gap-1">
                                        {!n.read_at && (
                                            <button
                                                onClick={() =>
                                                    handleMarkRead(n.id)
                                                }
                                                className="rounded p-1 text-gray-300 hover:bg-indigo-50 hover:text-indigo-500"
                                                title="Mark as read"
                                            >
                                                <CheckCheck size={13} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(n.id)}
                                            className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-400"
                                            title="Delete"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 px-4 py-2.5">
                        <Link
                            href={route("backend.notifications.index")}
                            className="block text-center text-xs font-medium text-indigo-600 hover:text-indigo-800"
                            onClick={() => setDropdownOpen(false)}
                        >
                            View all notifications →
                        </Link>
                    </div>
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
                        <NotificationBell />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
