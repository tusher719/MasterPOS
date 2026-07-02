import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { useRef, useState } from "react";
import {
    Building2,
    DollarSign,
    Receipt,
    Bell,
    Upload,
    X,
    Save,
    Info,
} from "lucide-react";
import useFlashToast from "@/hooks/useFlashToast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SettingsGroup {
    [key: string]: string | null | undefined;
}
interface Props {
    settings: {
        business?: SettingsGroup;
        currency?: SettingsGroup;
        tax?: SettingsGroup;
        notification?: SettingsGroup;
    };
}

const TABS = [
    { id: "business", label: "Business Info", icon: Building2 },
    { id: "currency", label: "Currency", icon: DollarSign },
    { id: "tax", label: "Tax & Billing", icon: Receipt },
    { id: "notification", label: "Notifications", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsIndex({ settings }: Props) {
    useFlashToast();
    const [activeTab, setActiveTab] = useState<TabId>("business");

    return (
        <AuthenticatedLayout>
            <Head title="Business Settings" />

            <div className="space-y-5">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Business Settings
                    </h1>
                    <p className="text-sm text-gray-500">
                        Configure your business profile, currency, tax, and
                        notifications
                    </p>
                </div>

                <div className="grid grid-cols-4 gap-5">
                    {/* Tab sidebar */}
                    <div className="col-span-1 rounded-lg border border-gray-200 bg-white p-3">
                        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Settings
                        </p>
                        <nav className="space-y-1">
                            {TABS.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                                        activeTab === id
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    <Icon size={16} />
                                    {label}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-4 border-t border-gray-100 pt-4">
                            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Configuration
                            </p>
                            <nav className="space-y-1">
                                {[
                                    {
                                        label: "Payment Methods",
                                        href: route(
                                            "backend.payment-methods.index",
                                        ),
                                    },
                                    {
                                        label: "Expense Categories",
                                        href: route(
                                            "backend.expense-categories.index",
                                        ),
                                    },
                                    {
                                        label: "Investment Types",
                                        href: route(
                                            "backend.investment-types.index",
                                        ),
                                    },
                                ].map((link) => (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        className="block rounded-md px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Content panel */}
                    <div className="col-span-3">
                        {activeTab === "business" && (
                            <BusinessTab settings={settings} />
                        )}
                        {activeTab === "currency" && (
                            <CurrencyTab settings={settings} />
                        )}
                        {activeTab === "tax" && <TaxTab settings={settings} />}
                        {activeTab === "notification" && (
                            <NotificationTab settings={settings} />
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// ─── Reusable section card ────────────────────────────────────────────────────
function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-5 border-b border-gray-100 pb-4">
                <h2 className="text-base font-semibold text-gray-800">
                    {title}
                </h2>
                {description && (
                    <p className="mt-0.5 text-sm text-gray-500">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </div>
    );
}

// ─── Reusable form row ────────────────────────────────────────────────────────
function FormRow({
    label,
    required,
    hint,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-3 items-start gap-4">
            <label className="pt-2 text-sm font-medium text-gray-700">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            <div className="col-span-2 space-y-1">
                {children}
                {hint && <p className="text-xs text-gray-400">{hint}</p>}
            </div>
        </div>
    );
}

// ─── Field components ─────────────────────────────────────────────────────────
function Field({
    value,
    onChange,
    placeholder,
    type = "text",
    maxLength,
    className = "",
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    maxLength?: number;
    className?: string;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${className}`}
        />
    );
}

function SelectField({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

function Toggle({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                {description && (
                    <p className="text-xs text-gray-400">{description}</p>
                )}
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    checked ? "bg-indigo-600" : "bg-gray-200"
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        checked ? "translate-x-6" : "translate-x-1"
                    }`}
                />
            </button>
        </div>
    );
}

function SaveButton({
    processing,
    label = "Save Changes",
}: {
    processing: boolean;
    label?: string;
}) {
    return (
        <div className="flex justify-end pt-2">
            <button
                type="button"
                disabled={processing}
                className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
                <Save size={14} />
                {processing ? "Saving..." : label}
            </button>
        </div>
    );
}

// ─── Business Info Tab ────────────────────────────────────────────────────────
function BusinessTab({ settings }: Props) {
    const b = settings.business ?? {};
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        b.business_logo ? `/storage/${b.business_logo}` : null,
    );

    const form = useForm({
        group: "business",
        business_name: b.business_name ?? "",
        business_email: b.business_email ?? "",
        business_phone: b.business_phone ?? "",
        business_address: b.business_address ?? "",
    });

    const logoForm = useForm<{ logo: File | null }>({ logo: null });

    const submit = () => {
        form.post(route("backend.settings.update"), {
            onSuccess: () => toast.success("Business info saved."),
        });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        logoForm.setData("logo", file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const submitLogo = () => {
        logoForm.post(route("backend.settings.logo"), {
            forceFormData: true,
            onSuccess: () => toast.success("Logo updated."),
        });
    };

    return (
        <div className="space-y-5">
            {/* Logo */}
            <Section
                title="Business Logo"
                description="Displayed on invoices, receipts and reports."
            >
                <div className="flex items-center gap-6">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
                        {logoPreview ? (
                            <img
                                src={logoPreview}
                                alt="Logo"
                                className="h-full w-full rounded-xl object-contain p-2"
                            />
                        ) : (
                            <Building2 size={32} className="text-gray-300" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoChange}
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                <Upload size={14} /> Choose Image
                            </button>
                            {logoForm.data.logo && (
                                <button
                                    type="button"
                                    onClick={submitLogo}
                                    disabled={logoForm.processing}
                                    className="flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    <Save size={14} /> Upload
                                </button>
                            )}
                            {logoPreview && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLogoPreview(null);
                                        logoForm.setData("logo", null);
                                    }}
                                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-400">
                            PNG, JPG, WEBP — max 2 MB
                        </p>
                    </div>
                </div>
            </Section>

            {/* Info */}
            <Section
                title="Business Information"
                description="Core details about your business."
            >
                <div className="space-y-4">
                    <FormRow label="Business Name" required>
                        <Field
                            value={form.data.business_name}
                            onChange={(v) => form.setData("business_name", v)}
                            placeholder="My POS Shop"
                        />
                        {form.errors.business_name && (
                            <p className="text-xs text-red-600">
                                {form.errors.business_name}
                            </p>
                        )}
                    </FormRow>
                    <FormRow label="Email Address">
                        <Field
                            type="email"
                            value={form.data.business_email}
                            onChange={(v) => form.setData("business_email", v)}
                            placeholder="shop@example.com"
                        />
                        {form.errors.business_email && (
                            <p className="text-xs text-red-600">
                                {form.errors.business_email}
                            </p>
                        )}
                    </FormRow>
                    <FormRow label="Phone Number">
                        <Field
                            value={form.data.business_phone}
                            onChange={(v) => form.setData("business_phone", v)}
                            placeholder="+880 1700 000000"
                        />
                    </FormRow>
                    <FormRow label="Address">
                        <textarea
                            value={form.data.business_address}
                            onChange={(e) =>
                                form.setData("business_address", e.target.value)
                            }
                            placeholder="Shop address..."
                            rows={3}
                            className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </FormRow>
                    <div onClick={submit}>
                        <SaveButton
                            processing={form.processing}
                            label="Save Business Info"
                        />
                    </div>
                </div>
            </Section>
        </div>
    );
}

// ─── Currency Tab ─────────────────────────────────────────────────────────────
function CurrencyTab({ settings }: Props) {
    const c = settings.currency ?? {};

    const form = useForm({
        group: "currency",
        business_currency: c.business_currency ?? "BDT",
        currency_symbol: c.currency_symbol ?? "৳",
        currency_position: c.currency_position ?? "before",
        decimal_places: c.decimal_places ?? "2",
    });

    const submit = () => {
        form.post(route("backend.settings.update"), {
            onSuccess: () => toast.success("Currency settings saved."),
        });
    };

    const preview = () => {
        const symbol = form.data.currency_symbol || "$";
        const decimals = parseInt(form.data.decimal_places) || 2;
        const amount = (1234.5).toFixed(decimals);
        return form.data.currency_position === "before"
            ? `${symbol}${amount}`
            : `${amount}${symbol}`;
    };

    return (
        <Section
            title="Currency Settings"
            description="Define how amounts are displayed throughout the system."
        >
            <div className="space-y-4">
                {/* Live preview */}
                <div className="flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
                    <Info size={14} className="shrink-0 text-indigo-500" />
                    <span className="text-sm text-gray-600">
                        Preview:{" "}
                        <strong className="text-gray-800">{preview()}</strong>
                    </span>
                </div>

                <FormRow
                    label="Currency Code"
                    required
                    hint="ISO code e.g. BDT, USD, EUR"
                >
                    <Field
                        value={form.data.business_currency}
                        onChange={(v) => form.setData("business_currency", v)}
                        placeholder="BDT"
                        maxLength={10}
                        className="max-w-36"
                    />
                </FormRow>
                <FormRow label="Currency Symbol" required>
                    <Field
                        value={form.data.currency_symbol}
                        onChange={(v) => form.setData("currency_symbol", v)}
                        placeholder="৳"
                        maxLength={10}
                        className="max-w-24"
                    />
                </FormRow>
                <FormRow label="Symbol Position" required>
                    <div className="max-w-52">
                        <SelectField
                            value={form.data.currency_position}
                            onChange={(v) =>
                                form.setData("currency_position", v)
                            }
                            options={[
                                {
                                    value: "before",
                                    label: "Before amount (৳100)",
                                },
                                {
                                    value: "after",
                                    label: "After amount (100৳)",
                                },
                            ]}
                        />
                    </div>
                </FormRow>
                <FormRow label="Decimal Places" required>
                    <div className="max-w-36">
                        <SelectField
                            value={form.data.decimal_places}
                            onChange={(v) => form.setData("decimal_places", v)}
                            options={[0, 1, 2, 3, 4].map((n) => ({
                                value: String(n),
                                label: `${n} decimal${n !== 1 ? "s" : ""}`,
                            }))}
                        />
                    </div>
                </FormRow>
                <div onClick={submit}>
                    <SaveButton
                        processing={form.processing}
                        label="Save Currency Settings"
                    />
                </div>
            </div>
        </Section>
    );
}

// ─── Tax Tab ──────────────────────────────────────────────────────────────────
function TaxTab({ settings }: Props) {
    const t = settings.tax ?? {};

    const form = useForm({
        group: "tax",
        tax_enabled: t.tax_enabled ?? "false",
        tax_name: t.tax_name ?? "VAT",
        tax_rate: t.tax_rate ?? "15",
        tax_inclusive: t.tax_inclusive ?? "false",
    });

    const taxEnabled = form.data.tax_enabled === "true";

    const submit = () => {
        form.post(route("backend.settings.update"), {
            onSuccess: () => toast.success("Tax settings saved."),
        });
    };

    return (
        <Section
            title="Tax & Billing"
            description="Configure tax calculation for sales and invoices."
        >
            <div className="space-y-4">
                <Toggle
                    checked={taxEnabled}
                    onChange={(v) =>
                        form.setData("tax_enabled", v ? "true" : "false")
                    }
                    label="Enable Tax"
                    description="Apply tax on sales transactions"
                />

                {taxEnabled && (
                    <div className="space-y-4 rounded-lg border border-dashed border-gray-200 p-4">
                        <FormRow label="Tax Name" required>
                            <Field
                                value={form.data.tax_name}
                                onChange={(v) => form.setData("tax_name", v)}
                                placeholder="VAT"
                            />
                        </FormRow>
                        <FormRow label="Tax Rate (%)" required>
                            <div className="flex max-w-36 items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={form.data.tax_rate}
                                    onChange={(e) =>
                                        form.setData("tax_rate", e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-400">%</span>
                            </div>
                        </FormRow>
                        <Toggle
                            checked={form.data.tax_inclusive === "true"}
                            onChange={(v) =>
                                form.setData(
                                    "tax_inclusive",
                                    v ? "true" : "false",
                                )
                            }
                            label="Tax Inclusive Pricing"
                            description="Prices already include tax (not added on top)"
                        />
                    </div>
                )}

                <div onClick={submit}>
                    <SaveButton
                        processing={form.processing}
                        label="Save Tax Settings"
                    />
                </div>
            </div>
        </Section>
    );
}

// ─── Notification Tab ─────────────────────────────────────────────────────────
function NotificationTab({ settings }: Props) {
    const n = settings.notification ?? {};

    const form = useForm({
        group: "notification",
        notify_on_sale: n.notify_on_sale ?? "true",
        notify_low_stock: n.notify_low_stock ?? "true",
        notify_on_expense: n.notify_on_expense ?? "false",
        low_stock_threshold: n.low_stock_threshold ?? "10",
    });

    const lowStockEnabled = form.data.notify_low_stock === "true";

    const submit = () => {
        form.post(route("backend.settings.update"), {
            onSuccess: () => toast.success("Notification settings saved."),
        });
    };

    return (
        <Section
            title="Notification Settings"
            description="Control which events trigger in-app notifications."
        >
            <div className="space-y-3">
                <Toggle
                    checked={form.data.notify_on_sale === "true"}
                    onChange={(v) =>
                        form.setData("notify_on_sale", v ? "true" : "false")
                    }
                    label="New Sale"
                    description="Notify when a new sale is completed"
                />

                <div className="space-y-2">
                    <Toggle
                        checked={lowStockEnabled}
                        onChange={(v) =>
                            form.setData(
                                "notify_low_stock",
                                v ? "true" : "false",
                            )
                        }
                        label="Low Stock Alert"
                        description="Notify when product stock falls below threshold"
                    />
                    {lowStockEnabled && (
                        <div className="ml-4 flex items-center gap-3 rounded-md border border-dashed border-gray-200 px-4 py-2">
                            <label className="shrink-0 text-sm text-gray-600">
                                Threshold (units)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="9999"
                                value={form.data.low_stock_threshold}
                                onChange={(e) =>
                                    form.setData(
                                        "low_stock_threshold",
                                        e.target.value,
                                    )
                                }
                                className="w-24 rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    )}
                </div>

                <Toggle
                    checked={form.data.notify_on_expense === "true"}
                    onChange={(v) =>
                        form.setData("notify_on_expense", v ? "true" : "false")
                    }
                    label="Expense Recorded"
                    description="Notify when a new expense is logged"
                />

                <div onClick={submit}>
                    <SaveButton
                        processing={form.processing}
                        label="Save Notification Settings"
                    />
                </div>
            </div>
        </Section>
    );
}
