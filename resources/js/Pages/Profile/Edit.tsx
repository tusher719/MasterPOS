import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Activity,
    Check,
    Clock,
    Globe,
    KeyRound,
    Lock,
    Mail,
    Phone,
    Shield,
    ShieldCheck,
    Smartphone,
    UserCheck,
    Users,
    UserX,
    Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";

interface LoginHistoryItem {
    id: number;
    ip_address: string;
    user_agent: string;
    logged_in_at: string | null;
}

interface UserProfile {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    avatar: string | null;
    email_verified_at: string | null;
    created_at: string | null;
    roles: string[];
    all_permissions: string[];
    permissions_by_module: Record<string, string[]>;
    login_histories: LoginHistoryItem[];
}

interface StaffUser {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    roles: string[];
    last_seen_at: string | null;
    created_at: string | null;
}

interface CustomerUser {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    is_active: boolean;
    sales_count: number;
    opening_balance: number;
    created_at: string | null;
}

interface Props {
    mustVerifyEmail: boolean;
    status?: string;
    profile: UserProfile;
    staffUsers?: StaffUser[];
    customers?: CustomerUser[];
}

type TabType = "profile" | "permissions" | "logins" | "staff" | "customers";

export default function Edit({
    mustVerifyEmail,
    status,
    profile,
    staffUsers = [],
    customers = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<TabType>("profile");
    const [permSearch, setPermSearch] = useState("");
    const [staffSearch, setStaffSearch] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");

    // Filtered permissions
    const filteredModules = useMemo(() => {
        if (!permSearch.trim()) return profile?.permissions_by_module || {};
        const query = permSearch.toLowerCase();
        const res: Record<string, string[]> = {};

        Object.entries(profile?.permissions_by_module || {}).forEach(
            ([module, perms]) => {
                const matched = perms.filter(
                    (p) =>
                        p.toLowerCase().includes(query) ||
                        module.toLowerCase().includes(query)
                );
                if (matched.length > 0) {
                    res[module] = matched;
                }
            }
        );
        return res;
    }, [profile?.permissions_by_module, permSearch]);

    // Filtered staff
    const filteredStaff = useMemo(() => {
        if (!staffSearch.trim()) return staffUsers;
        const q = staffSearch.toLowerCase();
        return staffUsers.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q) ||
                (s.phone && s.phone.toLowerCase().includes(q)) ||
                s.roles.some((r) => r.toLowerCase().includes(q))
        );
    }, [staffUsers, staffSearch]);

    // Filtered customers
    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return customers;
        const q = customerSearch.toLowerCase();
        return customers.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.phone && c.phone.toLowerCase().includes(q)) ||
                (c.email && c.email.toLowerCase().includes(q)) ||
                (c.city && c.city.toLowerCase().includes(q))
        );
    }, [customers, customerSearch]);

    const formatTimestamp = (iso?: string | null) => {
        if (!iso) return "—";
        try {
            return new Date(iso).toLocaleString("en-BD", {
                dateStyle: "medium",
                timeStyle: "short",
            });
        } catch {
            return iso;
        }
    };

    const initials = profile?.name
        ? profile.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
        : "U";

    return (
        <AuthenticatedLayout>
            <Head title="User Profile & Security Hub" />

            <div className="space-y-6">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="relative">
                                {profile?.avatar ? (
                                    <img
                                        src={profile.avatar}
                                        alt={profile.name}
                                        className="h-20 w-20 rounded-2xl object-cover border-2 border-primary/20 shadow-md"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-2xl font-bold text-white shadow-md">
                                        {initials}
                                    </div>
                                )}
                                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-card text-white">
                                    <Check size={12} strokeWidth={3} />
                                </span>
                            </div>

                            {/* User Meta */}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                        {profile?.name}
                                    </h1>
                                    {profile?.roles?.map((role) => (
                                        <span
                                            key={role}
                                            className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary"
                                        >
                                            {role}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Mail size={13} />
                                        <span>{profile?.email}</span>
                                    </div>
                                    {profile?.phone && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone size={13} />
                                            <span>{profile.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={13} />
                                        <span>
                                            Member since{" "}
                                            {profile?.created_at
                                                ? new Date(
                                                      profile.created_at
                                                  ).toLocaleDateString("en-BD", {
                                                      year: "numeric",
                                                      month: "short",
                                                  })
                                                : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Badges */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-2.5">
                                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Granted Permissions
                                    </p>
                                    <p className="text-base font-bold text-foreground">
                                        {profile?.all_permissions?.length ?? 0}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-2.5">
                                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                                    <Activity size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Recent Logins
                                    </p>
                                    <p className="text-base font-bold text-foreground">
                                        {profile?.login_histories?.length ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mt-6 flex items-center gap-1.5 border-t border-border pt-4 overflow-x-auto scrollbar-none">
                        {[
                            {
                                id: "profile" as TabType,
                                label: "My Profile & Security",
                                icon: KeyRound,
                            },
                            {
                                id: "permissions" as TabType,
                                label: "Permissions Matrix",
                                icon: ShieldCheck,
                                count: profile?.all_permissions?.length,
                            },
                            {
                                id: "logins" as TabType,
                                label: "Session & Login History",
                                icon: Clock,
                                count: profile?.login_histories?.length,
                            },
                            {
                                id: "staff" as TabType,
                                label: "Staff Directory",
                                icon: Users,
                                count: staffUsers.length,
                            },
                            {
                                id: "customers" as TabType,
                                label: "Customer Accounts",
                                icon: UserCheck,
                                count: customers.length,
                            },
                        ].map(({ id, label, icon: Icon, count }) => {
                            const active = activeTab === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0 ${
                                        active
                                            ? "bg-primary text-white shadow-xs"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                >
                                    <Icon size={14} />
                                    <span>{label}</span>
                                    {count !== undefined && (
                                        <span
                                            className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                                                active
                                                    ? "bg-white/20 text-white"
                                                    : "bg-muted-foreground/15 text-muted-foreground"
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab 1: Profile & Password Management */}
                {activeTab === "profile" && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Profile Info Form */}
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        </div>

                        {/* Password Form */}
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                            <UpdatePasswordForm />
                        </div>

                        {/* Danger Zone */}
                        <div className="lg:col-span-2 rounded-2xl border border-rose-500/20 bg-rose-50/30 dark:bg-rose-950/10 p-6 shadow-xs">
                            <DeleteUserForm />
                        </div>
                    </div>
                )}

                {/* Tab 2: Permissions Matrix */}
                {activeTab === "permissions" && (
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
                            <div>
                                <h3 className="text-base font-bold text-foreground">
                                    Assigned System Permissions
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Active RBAC capabilities granted through
                                    your roles (
                                    {profile?.roles?.join(", ") || "No Roles"}
                                    ).
                                </p>
                            </div>
                            <input
                                type="text"
                                value={permSearch}
                                onChange={(e) => setPermSearch(e.target.value)}
                                placeholder="Filter permissions..."
                                className="w-full sm:w-64 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>

                        {Object.keys(filteredModules).length === 0 ? (
                            <div className="rounded-2xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
                                No matching permissions found.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {Object.entries(filteredModules).map(
                                    ([module, perms]) => (
                                        <div
                                            key={module}
                                            className="rounded-2xl border border-border bg-card p-4 shadow-xs"
                                        >
                                            <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                                        {module}
                                                    </h4>
                                                </div>
                                                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                    {perms.length} items
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {perms.map((perm) => (
                                                    <span
                                                        key={perm}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                                                    >
                                                        <Check
                                                            size={11}
                                                            strokeWidth={3}
                                                        />
                                                        {perm}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: Login History */}
                {activeTab === "logins" && (
                    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                        <div className="border-b border-border p-4">
                            <h3 className="text-base font-bold text-foreground">
                                Recent Authentication Audit Log
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Last 10 successful authentication sessions
                                recorded for your account.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                            #
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                            IP Address
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                            Browser & Client Device
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                            Timestamp
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(!profile?.login_histories ||
                                        profile.login_histories.length ===
                                            0) && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="py-12 text-center text-sm text-muted-foreground"
                                            >
                                                No login records found.
                                            </td>
                                        </tr>
                                    )}
                                    {profile?.login_histories?.map((lh, i) => (
                                        <tr
                                            key={lh.id || i}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                                                {i + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                                                    <Globe
                                                        size={13}
                                                        className="text-muted-foreground"
                                                    />
                                                    {lh.ip_address ||
                                                        "127.0.0.1"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-md truncate">
                                                <div className="flex items-center gap-1.5">
                                                    <Smartphone
                                                        size={13}
                                                        className="shrink-0 text-muted-foreground"
                                                    />
                                                    <span className="truncate">
                                                        {lh.user_agent ||
                                                            "Mozilla Browser"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {formatTimestamp(
                                                    lh.logged_in_at
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                    Success
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 4: Staff Directory */}
                {activeTab === "staff" && (
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
                            <div>
                                <h3 className="text-base font-bold text-foreground">
                                    Backend Staff Directory
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    All staff members, administrators, and
                                    assigned portal roles.
                                </p>
                            </div>
                            <input
                                type="text"
                                value={staffSearch}
                                onChange={(e) => setStaffSearch(e.target.value)}
                                placeholder="Search by name, email, role..."
                                className="w-full sm:w-64 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>

                        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                Staff Member
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                Roles
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                Contact Info
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                Last Active
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredStaff.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="py-12 text-center text-sm text-muted-foreground"
                                                >
                                                    No staff users found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStaff.map((staff) => (
                                                <tr
                                                    key={staff.id}
                                                    className="hover:bg-muted/30 transition-colors"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary shrink-0">
                                                                {staff.name
                                                                    .substring(
                                                                        0,
                                                                        2
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-foreground">
                                                                    {staff.name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground font-mono">
                                                                    ID #{staff.id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {staff.roles.map(
                                                                (r) => (
                                                                    <span
                                                                        key={r}
                                                                        className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary border border-primary/20"
                                                                    >
                                                                        {r}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                                        <div>{staff.email}</div>
                                                        {staff.phone && (
                                                            <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                                                                {staff.phone}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                                        {formatTimestamp(
                                                            staff.last_seen_at
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                                                                staff.status ===
                                                                "active"
                                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                    : "bg-muted text-muted-foreground border-border"
                                                            }`}
                                                        >
                                                            {staff.status ||
                                                                "active"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 5: Customer Directory */}
                {activeTab === "customers" && (
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
                            <div>
                                <h3 className="text-base font-bold text-foreground">
                                    Customer Accounts Hub
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Browse registered customer accounts, order
                                    counts, and account balances.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={customerSearch}
                                    onChange={(e) =>
                                        setCustomerSearch(e.target.value)
                                    }
                                    placeholder="Search customer by name, phone..."
                                    className="w-full sm:w-64 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                />
                                <Link
                                    href={route("backend.customers.index")}
                                    className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors shrink-0"
                                >
                                    Manage All
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                Customer
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                Contact
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                Location
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                Orders Placed
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                Opening Balance
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredCustomers.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="py-12 text-center text-sm text-muted-foreground"
                                                >
                                                    No customer profiles found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredCustomers.map((cust) => (
                                                <tr
                                                    key={cust.id}
                                                    className="hover:bg-muted/30 transition-colors"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                                                {cust.name
                                                                    .substring(
                                                                        0,
                                                                        2
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-foreground">
                                                                    {cust.name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Joined{" "}
                                                                    {formatTimestamp(
                                                                        cust.created_at
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                                        <div className="font-mono text-foreground">
                                                            {cust.phone || "—"}
                                                        </div>
                                                        {cust.email && (
                                                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                                                {cust.email}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                                        {cust.city || "Dhaka"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                                                            {cust.sales_count}{" "}
                                                            orders
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-semibold text-foreground">
                                                        ৳
                                                        {Number(
                                                            cust.opening_balance
                                                        ).toLocaleString(
                                                            "en-BD",
                                                            {
                                                                minimumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                                                                cust.is_active
                                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                    : "bg-muted text-muted-foreground border-border"
                                                            }`}
                                                        >
                                                            {cust.is_active
                                                                ? "Active"
                                                                : "Inactive"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
