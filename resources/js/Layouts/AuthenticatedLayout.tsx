// resources/js/Layouts/AuthenticatedLayout.tsx

import { AppLauncherModal } from "@/Components/AppLauncher";
import { GlobalSearchModal } from "@/Components/GlobalSearch";
import OfflineOverlay from "@/Components/OfflineOverlay";
import ThemeProvider from "@/Components/ThemeProvider";
import useFlashToast from "@/hooks/useFlashToast";
import { useTheme } from "@/hooks/useTheme";
import { Notification, NotificationShared } from "@/types/notification";
import { Link, router, usePage } from "@inertiajs/react";
import {
    BarChart3,
    Bell,
    BookOpen,
    Boxes,
    Building2,
    CheckCheck,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Command,
    CreditCard,
    FileText,
    Gauge,
    Grid2x2,
    History,
    Landmark,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Palette,
    PieChart,
    Receipt,
    ScrollText,
    Search,
    Settings2,
    Shield,
    ShieldAlert,
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
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthUser {
    id?: number | string;
    name?: string;
    email?: string;
}

interface AuthData {
    user?: AuthUser;
}

interface ThemeSettings {
    logo_type?: "text" | "image" | "both";
    logo_text_segments?: string;
    logo_image_path?: string;
    business_name?: string;
    sidebar_color?: string;
}

// Badge type for feature announcements
interface FeatureBadge {
    badge_label: string;
    badge_type: "new" | "hot" | "beta" | "custom";
}

// Live counts for nav items (order_tasks, pre_orders)
interface NavCounts {
    order_tasks?: number;
    pre_orders?: number;
}

interface PageProps {
    auth?: AuthData;
    settings?: ThemeSettings;
    notifications?: NotificationShared;
    featureAnnouncements?: Record<string, FeatureBadge>;
    navCounts?: NavCounts;
}

interface NavItem {
    label: string;
    icon: ElementType;
    href?: string;
    active?: string;
    children?: NavItem[];
}

interface LogoSegment {
    text: string;
    color?: string;
}

interface NavbarLogoProps {
    settings?: ThemeSettings;
}

interface UserDropdownProps {
    auth?: AuthData;
}

// ─── Nav Badge component ──────────────────────────────────────────────────────
// Renders feature announcement badge (New/Hot/Beta/Custom) beside nav label.
// badge_type drives the color — custom uses same color as 'new'.
function NavBadge({ badge_label, badge_type }: FeatureBadge) {
    const colorMap: Record<string, string> = {
        new: "bg-indigo-100 text-indigo-700",
        hot: "bg-red-100 text-red-700",
        beta: "bg-amber-100 text-amber-700",
        custom: "bg-indigo-100 text-indigo-700",
    };

    const cls = colorMap[badge_type] ?? colorMap.new;

    return (
        <span
            className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${cls}`}
        >
            {badge_label}
        </span>
    );
}

// ─── Nav Count Dot component ──────────────────────────────────────────────────
// Renders a small count pill for live counts (pending tasks, pre-orders).
// Hidden when count is 0 or undefined.
function NavCountDot({ count }: { count?: number }) {
    if (!count || count === 0) return null;

    return (
        <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {count > 99 ? "99+" : count}
        </span>
    );
}

// ─── Navigation structure ─────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboards",
        icon: LayoutDashboard,
        children: [
            {
                label: "Home",
                icon: Grid2x2,
                href: "backend.quick-links.index",
                active: "backend.quick-links.*",
            },
            {
                label: "Overview",
                icon: Gauge,
                href: "backend.dashboard.index",
                active: "backend.dashboard*",
            },
            {
                label: "Sales & Analytics",
                icon: ShoppingCart,
                href: "dashboard",
                active: "dashboard",
            },
        ],
    },
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
            {
                label: "Audit Trail",
                icon: ClipboardList,
                href: "backend.audit-trail.index",
                active: "backend.audit-trail.*",
            },
        ],
    },
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
                icon: Landmark,
                href: "backend.capital-ledger.index",
                active: "backend.capital-ledger.*",
            },
            {
                label: "Investor Statements",
                icon: FileText,
                href: "backend.investor-statements.index",
                active: "backend.investor-statements.*",
            },
        ],
    },
    {
        label: "Partners",
        icon: Users,
        children: [
            {
                label: "Partners",
                icon: Users,
                href: "backend.partners.index",
                active: "backend.partners.index*",
            },
        ],
    },
    {
        label: "Fraud Protection",
        icon: ShieldAlert,
        children: [
            {
                label: "Fraud Flags",
                icon: ShieldAlert,
                href: "backend.fraud-flags.index",
                active: "backend.fraud-flags.*",
            },
        ],
    },
    {
        label: "Fulfillment",
        icon: ClipboardList,
        children: [
            {
                label: "Order Tasks",
                icon: ClipboardList,
                href: "backend.order-tasks.index",
                active: "backend.order-tasks.index",
            },
            {
                label: "Performance Report",
                icon: TrendingUp,
                href: "backend.order-tasks.performance",
                active: "backend.order-tasks.performance*",
            },
            {
                label: "Pre-Orders",
                icon: BookOpen,
                href: "backend.pre-orders.index",
                active: "backend.pre-orders.*",
            },
            {
                label: "Planning Tasks",
                icon: ClipboardList,
                href: "backend.product-planning-tasks.index",
                active: "backend.product-planning-tasks.*",
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
    { label: "Orders", icon: FileText, active: "backend.orders.*" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Sidebar width helper ─────────────────────────────────────────────────────
function getSidebarWidthClass(width: string, collapsed: boolean): string {
    if (collapsed) return "w-16";
    switch (width) {
        case "compact":
            return "w-[220px]";
        case "wide":
            return "w-[300px]";
        default:
            return "w-[260px]";
    }
}

// ─── NavLeaf ──────────────────────────────────────────────────────────────────
function NavLeaf({
    item,
    collapsed,
    nested = false,
    sidebarIsLight,
}: {
    item: NavItem;
    collapsed: boolean;
    nested?: boolean;
    sidebarIsLight: boolean;
}) {
    const Icon = item.icon;
    const implemented = routeExists(item.href);
    const active = implemented && isActive(item.active);
    const padding = nested ? "pl-9 pr-3" : "px-3";

    // Read globally shared badge + count data from Inertia props
    const { featureAnnouncements, navCounts } = usePage()
        .props as unknown as PageProps;

    // Feature announcement badge for this nav item (keyed by route_name)
    const badge = item.href ? featureAnnouncements?.[item.href] : undefined;

    // Live count badge — matched by route_name convention
    // order-tasks.index → navCounts.order_tasks
    // pre-orders.index  → navCounts.pre_orders
    const countKeyMap: Record<string, keyof NavCounts> = {
        "backend.order-tasks.index": "order_tasks",
        "backend.pre-orders.index": "pre_orders",
    };
    const countKey = item.href ? countKeyMap[item.href] : undefined;
    const liveCount = countKey ? navCounts?.[countKey] : undefined;

    // Text colors based on sidebar background
    const textBase = sidebarIsLight ? "text-gray-600" : "text-gray-300";
    const textActive = sidebarIsLight ? "text-indigo-700" : "text-white";
    const bgActive = sidebarIsLight ? "bg-indigo-50" : "bg-card/10";
    const bgHover = sidebarIsLight ? "hover:bg-gray-100" : "hover:bg-card/7";
    const textDisabled = sidebarIsLight ? "text-gray-400" : "text-gray-500";

    if (!implemented) {
        return (
            <div
                className={`flex cursor-not-allowed items-center gap-3 rounded-lg ${padding} py-2.5 text-sm font-medium ${textDisabled}`}
                title="coming soon"
            >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
            </div>
        );
    }

    return (
        <Link
            href={route(item.href as string)}
            className={`flex items-center gap-2 rounded-lg ${padding} py-1.5 text-sm font-medium transition-all duration-200 ${
                active ? `${bgActive} ${textActive}` : `${textBase} ${bgHover}`
            }`}
        >
            <Icon size={18} />
            {!collapsed && (
                <>
                    {/* Nav label */}
                    <span className="flex-1">{item.label}</span>

                    {/* Feature announcement badge (New / Hot / Beta / Custom) */}
                    {badge && (
                        <NavBadge
                            badge_label={badge.badge_label}
                            badge_type={badge.badge_type}
                        />
                    )}

                    {/* Live count dot — pending order tasks / pre-orders */}
                    {!badge && <NavCountDot count={liveCount} />}
                </>
            )}
        </Link>
    );
}

// ─── NavGroup ─────────────────────────────────────────────────────────────────
function NavGroup({
    item,
    collapsed,
    sidebarIsLight,
}: {
    item: NavItem;
    collapsed: boolean;
    sidebarIsLight: boolean;
}) {
    const Icon = item.icon;
    const anyChildActive =
        item.children?.some((c) => routeExists(c.href) && isActive(c.active)) ??
        false;
    const [open, setOpen] = useState(anyChildActive);

    const textBase = sidebarIsLight ? "text-gray-600" : "text-gray-300";
    const textActive = sidebarIsLight ? "text-indigo-700" : "text-white";
    const bgHover = sidebarIsLight ? "hover:bg-gray-100" : "hover:bg-card/7";
    const borderColor = sidebarIsLight ? "border-border" : "border-white/10";

    if (collapsed) {
        return (
            <div
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    anyChildActive ? textActive : textBase
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
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    anyChildActive ? textActive : `${textBase} ${bgHover}`
                }`}
            >
                <Icon size={16} />
                <span className="flex-1 text-left">{item.label}</span>
                {open ? (
                    <ChevronDown size={14} className="opacity-60" />
                ) : (
                    <ChevronRight size={14} className="opacity-60" />
                )}
            </button>

            {open && (
                <div
                    className={`ml-[22px] mt-0.5 space-y-0.5 border-l ${borderColor}`}
                >
                    {item.children?.map((child) => (
                        <NavLeaf
                            key={child.label}
                            item={child}
                            collapsed={collapsed}
                            nested
                            sidebarIsLight={sidebarIsLight}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell() {
    const props = usePage().props as any;
    const notifShared: NotificationShared = props.notifications ?? {
        unread_count: 0,
        latest: [],
    };

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const handleMarkRead = (id: string) =>
        router.post(
            route("backend.notifications.read", id),
            {},
            { preserveScroll: true },
        );

    const handleMarkAllRead = () =>
        router.post(
            route("backend.notifications.read-all"),
            {},
            { preserveScroll: true },
        );

    const handleDelete = (id: string) =>
        router.delete(route("backend.notifications.destroy", id), {
            preserveScroll: true,
        });

    // Click on a notification row — mark read + navigate to url
    const handleNotificationClick = (n: Notification) => {
        if (!n.read_at) {
            router.post(
                route("backend.notifications.read", n.id),
                {},
                { preserveScroll: true },
            );
        }
        if (n.data.url) {
            setDropdownOpen(false);
            router.visit(n.data.url);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

            {dropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg">
                    <div className="flex items-center justify-between border-b border-border  px-4 py-3">
                        <span className="text-sm font-semibold text-foreground">
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

                    <div className="max-h-80 divide-y divide-border overflow-y-auto">
                        {notifShared.latest.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                No notifications yet
                            </div>
                        ) : (
                            notifShared.latest.map((n: Notification) => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                                        n.data.url
                                            ? "cursor-pointer hover:bg-muted/50"
                                            : ""
                                    } ${!n.read_at ? "bg-indigo-50/40" : ""}`}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <div
                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                            !n.read_at
                                                ? "bg-indigo-100 text-indigo-600"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {getNotificationIcon(n.data.icon)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={`text-xs font-medium leading-snug ${
                                                !n.read_at
                                                    ? "text-gray-800"
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            {n.data.title}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            {n.data.message}
                                        </p>
                                        <p className="mt-1 text-[10px] text-muted-foreground/60">
                                            {n.created_at}
                                        </p>
                                    </div>
                                    <div
                                        className="flex shrink-0 flex-col gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
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

                    <div className="border-t border-border px-4 py-2.5">
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

// ─── Navbar Logo ──────────────────────────────────────────────────────────────
function NavbarLogo({ settings }: { settings: any }) {
    const logoType = settings?.logo_type ?? "text";

    const parseSegments = () => {
        try {
            const s = JSON.parse(settings?.logo_text_segments ?? "[]");
            return Array.isArray(s) ? s : [];
        } catch {
            return [];
        }
    };

    if (logoType === "both") {
        const segments = parseSegments();
        return (
            <div className="flex items-center gap-2">
                {settings?.logo_image_path && (
                    <img
                        src={"/storage/" + settings.logo_image_path}
                        alt="Logo"
                        className="max-h-7 max-w-[36px] object-contain"
                    />
                )}
                {segments.length > 0 && (
                    <span className="text-lg font-bold">
                        {segments.map((seg: any, i: number) => (
                            <span key={i} style={{ color: seg.color }}>
                                {seg.text}
                            </span>
                        ))}
                    </span>
                )}
            </div>
        );
    }

    if (logoType === "image" && settings?.logo_image_path) {
        return (
            <img
                src={"/storage/" + settings.logo_image_path}
                alt={settings?.business_name ?? "Logo"}
                className="max-h-8 max-w-[140px] object-contain"
            />
        );
    }

    if (logoType === "text" && settings?.logo_text_segments) {
        const segments = parseSegments();
        if (segments.length > 0) {
            return (
                <span className="text-lg font-bold">
                    {segments.map((seg: any, i: number) => (
                        <span key={i} style={{ color: seg.color }}>
                            {seg.text}
                        </span>
                    ))}
                </span>
            );
        }
    }

    return (
        <span className="text-lg font-bold text-indigo-600">
            {settings?.business_name ?? "Master POS"}
        </span>
    );
}

// ─── User Dropdown ────────────────────────────────────────────────────────────

function UserDropdown({ auth }: UserDropdownProps) {
    const [open, setOpen] = useState<boolean>(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handler = (e: globalThis.MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition hover:bg-muted"
            >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {auth?.user?.name
                        ?.split(" ")
                        .map((word: string) => word.charAt(0))
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                </div>
                <span className="hidden font-medium sm:block">
                    {auth?.user?.name}
                </span>
                <ChevronDown size={14} className="opacity-60" />
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg">
                    <div className="border-b border-border px-4 py-3">
                        <p className="truncate text-sm font-medium text-foreground">
                            {auth?.user?.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {auth?.user?.email}
                        </p>
                    </div>

                    <div className="py-1">
                        {/* Theme link → Settings My Theme tab */}
                        <Link
                            href={
                                route("backend.settings.index") + "?tab=theme"
                            }
                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                            onClick={() => setOpen(false)}
                        >
                            <Palette size={15} />
                            My Theme
                        </Link>
                    </div>

                    <div className="border-t border-border py-1">
                        <Link
                            href={route("logout")}
                            method="post"
                            as="button"
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                            onClick={() => setOpen(false)}
                        >
                            <LogOut size={15} />
                            Logout
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Inner layout — reads theme from hook ─────────────────────────────────────
function InnerLayout({ children }: PropsWithChildren) {
    useFlashToast();
    const { auth, settings } = usePage().props as any;
    const { ui, toggleSidebarCollapsed } = useTheme();

    const [collapsed, setCollapsed] = useState(ui.sidebar_collapsed ?? false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [launcherOpen, setLauncherOpen] = useState(false);

    // Ctrl+K / Cmd+K — open global search from anywhere
    const handleSearchOpen = useCallback(() => setSearchOpen(true), []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                handleSearchOpen();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === ".") {
                e.preventDefault();
                setLauncherOpen(true);
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [handleSearchOpen]);

    // Sync collapse state with saved preference on mount
    useEffect(() => {
        setCollapsed(ui.sidebar_collapsed);
    }, [ui.sidebar_collapsed]);

    const handleToggleCollapse = async () => {
        const next = !collapsed;
        setCollapsed(next);
        await toggleSidebarCollapsed(next);
    };

    // Determine if sidebar bg is light — for adaptive text colors
    const sidebarColor = settings?.sidebar_color ?? "#111827";
    const sidebarIsLight = (() => {
        const hex = sidebarColor.replace("#", "");
        if (hex.length !== 6) return false;
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
    })();

    const sidebarWidthClass = getSidebarWidthClass(ui.sidebar_width, collapsed);

    return (
        <div className="flex h-screen bg-background">
            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <aside
                className={`${sidebarWidthClass} flex flex-col border-r transition-all duration-200`}
                style={{
                    background: `var(--theme-sidebar-bg, #111827)`,
                    borderColor: `var(--theme-sidebar-border, rgba(255,255,255,0.08))`,
                }}
            >
                {/* Logo + collapse button */}
                <div
                    className="flex h-16 items-center justify-between px-4"
                    style={{
                        borderBottom: `1px solid var(--theme-sidebar-border, rgba(255,255,255,0.08))`,
                    }}
                >
                    {!collapsed && <NavbarLogo settings={settings} />}
                    <button
                        onClick={handleToggleCollapse}
                        className="rounded-lg p-1.5 transition-colors"
                        style={{ color: "var(--theme-sidebar-text, #D1D5DB)" }}
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
                    {NAV_ITEMS.map((item) =>
                        item.children ? (
                            <NavGroup
                                key={item.label}
                                item={item}
                                collapsed={collapsed}
                                sidebarIsLight={sidebarIsLight}
                            />
                        ) : (
                            <NavLeaf
                                key={item.label}
                                item={item}
                                collapsed={collapsed}
                                sidebarIsLight={sidebarIsLight}
                            />
                        ),
                    )}
                </nav>

                {/* User info at bottom */}
                <div
                    className="p-3"
                    style={{
                        borderTop: `1px solid var(--theme-sidebar-border, rgba(255,255,255,0.08))`,
                    }}
                >
                    <div className="flex items-center gap-3 rounded-lg px-1 py-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                            {auth?.user?.name?.charAt(0)}
                        </div>
                        {!collapsed && (
                            <>
                                <div className="min-w-0 flex-1">
                                    <p
                                        className="truncate text-sm font-medium"
                                        style={{
                                            color: "var(--theme-sidebar-active, #FFFFFF)",
                                        }}
                                    >
                                        {auth?.user?.name}
                                    </p>
                                    <p
                                        className="truncate text-xs"
                                        style={{
                                            color: "var(--theme-sidebar-text, #9CA3AF)",
                                        }}
                                    >
                                        {auth?.user?.email}
                                    </p>
                                </div>
                                <Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                    className="shrink-0 rounded-md p-1.5 transition hover:bg-red-500/20 hover:text-red-400"
                                    style={{
                                        color: "var(--theme-sidebar-text, #9CA3AF)",
                                    }}
                                    title="Logout"
                                >
                                    <LogOut size={16} />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── Main ────────────────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Navbar */}
                <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
                    <div className="flex items-center gap-2">
                        {/* App Launcher button */}
                        <button
                            onClick={() => setLauncherOpen(true)}
                            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            title="Quick Links (Ctrl+.)"
                        >
                            <Grid2x2 size={20} />
                        </button>

                        {/* Search trigger button */}
                        <button
                            onClick={handleSearchOpen}
                            className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground
                            w-[180px] sm:w-[240px] md:w-[320px] lg:w-[400px]"
                        >
                            <Search size={15} />
                            <span className="flex-1 text-left hidden sm:block">
                                Search...
                            </span>
                            <span className="hidden items-center gap-0.5 sm:flex ml-auto">
                                <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px]">
                                    <Command size={9} className="inline" />
                                </kbd>
                                <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px]">
                                    K
                                </kbd>
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <UserDropdown auth={auth} />
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6 bg-background">
                    {children}
                </main>

                {/* Global Search Modal — rendered at layout level, always available */}
                <GlobalSearchModal
                    isOpen={searchOpen}
                    onClose={() => setSearchOpen(false)}
                />
                <AppLauncherModal
                    isOpen={launcherOpen}
                    onClose={() => setLauncherOpen(false)}
                />
                <OfflineOverlay />
            </div>
        </div>
    );
}

// ─── Main export — wraps everything in ThemeProvider ─────────────────────────
export default function AuthenticatedLayout({ children }: PropsWithChildren) {
    return (
        <ThemeProvider>
            <InnerLayout>{children}</InnerLayout>
        </ThemeProvider>
    );
}
