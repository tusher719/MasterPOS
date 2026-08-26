import useFlashToast from "@/hooks/useFlashToast";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ThemeTab from "@/Pages/Backend/Settings/_components/ThemeTab";
import { Head, useForm } from "@inertiajs/react";
import {
    Bell,
    Building2,
    DollarSign,
    Info,
    Monitor,
    Palette,
    Plus,
    Receipt,
    Save,
    Trash2,
    Type,
    Upload,
    X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SettingsGroup {
    [key: string]: string | null | undefined;
}

interface LogoTextSegment {
    text: string;
    color: string;
}

// Internal prop type for tab sub-components
interface TabProps {
    settings: {
        business?: SettingsGroup;
        currency?: SettingsGroup;
        tax?: SettingsGroup;
        notification?: SettingsGroup;
    };
}

interface Props {
    pageSettings: {
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
    { id: "theme", label: "My Theme", icon: Palette },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely parse logo_text_segments from settings (stored as JSON string). */
function parseSegments(raw: string | null | undefined): LogoTextSegment[] {
    if (!raw) return [{ text: "Master", color: "#4f46e5" }];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
        // ignore
    }
    return [{ text: "Master", color: "#4f46e5" }];
}

export default function SettingsIndex({ pageSettings: settings }: Props) {
    useFlashToast();

    // Check URL param ?tab=theme — from navbar user dropdown "My Theme" link
    const initialTab = (): TabId => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get("tab") as TabId | null;
            if (tab && TABS.some((t) => t.id === tab)) return tab;
        }
        return "business";
    };

    const [activeTab, setActiveTab] = useState<TabId>(initialTab);

    return (
        <AuthenticatedLayout>
            <Head title="Business Settings" />

            <div className="space-y-5">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Business Settings
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Configure your business profile, currency, tax, and
                        notifications
                    </p>
                </div>

                <div className="grid grid-cols-4 gap-5">
                    {/* Tab sidebar */}
                    <div className="col-span-1 rounded-lg border border-border bg-card p-3">
                        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Settings
                        </p>
                        <nav className="space-y-1">
                            {TABS.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                                        activeTab === id
                                            ? "bg-primary/10 text-primary"
                                            : "text-foreground hover:bg-muted"
                                    }`}
                                >
                                    <Icon size={16} />
                                    {label}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-4 border-t border-gray-100 pt-4">
                            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                                        className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                        {activeTab === "theme" && <ThemeTab />}
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
    onClick,
}: {
    processing: boolean;
    label?: string;
    onClick?: () => void;
}) {
    return (
        <div className="flex justify-end pt-2">
            <button
                type="button"
                disabled={processing}
                onClick={onClick}
                className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
                <Save size={14} />
                {processing ? "Saving..." : label}
            </button>
        </div>
    );
}

// ─── Navbar Logo Preview ──────────────────────────────────────────────────────
/** Renders a miniature sidebar header so the admin can see exactly
 *  how the logo will look before saving. */
function NavbarLogoPreview({
    logoType,
    logoImageUrl,
    segments,
    businessName,
}: {
    logoType: string;
    logoImageUrl: string | null;
    segments: LogoTextSegment[];
    businessName: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <Monitor size={14} className="shrink-0 text-gray-400" />
            <span className="text-xs text-gray-400">Navbar preview:</span>

            {/* Simulated sidebar header */}
            <div className="flex h-9 items-center rounded-md border border-gray-200 bg-white px-3 shadow-sm">
                {logoType === "both" ? (
                    <div className="flex items-center gap-1.5">
                        {logoImageUrl && (
                            <img
                                src={logoImageUrl}
                                alt="Logo preview"
                                className="max-h-6 max-w-[36px] object-contain"
                            />
                        )}
                        {segments.length > 0 && (
                            <span className="text-sm font-bold">
                                {segments.map((seg, i) => (
                                    <span key={i} style={{ color: seg.color }}>
                                        {seg.text}
                                    </span>
                                ))}
                            </span>
                        )}
                    </div>
                ) : logoType === "image" && logoImageUrl ? (
                    <img
                        src={logoImageUrl}
                        alt="Logo preview"
                        className="max-h-6 max-w-[120px] object-contain"
                    />
                ) : logoType === "text" && segments.length > 0 ? (
                    <span className="text-sm font-bold">
                        {segments.map((seg, i) => (
                            <span key={i} style={{ color: seg.color }}>
                                {seg.text}
                            </span>
                        ))}
                    </span>
                ) : (
                    <span className="text-sm font-bold text-indigo-600">
                        {businessName || "Master POS"}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Business Info Tab ────────────────────────────────────────────────────────
function BusinessTab({ settings }: TabProps) {
    const b = settings.business ?? {};
    const logoInputRef = useRef<HTMLInputElement>(null);

    // Resolve logo image URL — prefer new key, fall back to old key
    const resolveLogoUrl = () => {
        // Controller builds a full URL for logo_image_path_url
        if (b.logo_image_path_url) return b.logo_image_path_url;
        // Fallback: build from raw path
        if (b.logo_image_path) {
            return window.location.origin + "/storage/" + b.logo_image_path;
        }
        if (b.business_logo_url) return b.business_logo_url;
        return null;
    };

    const [logoPreview, setLogoPreview] = useState<string | null>(
        resolveLogoUrl(),
    );

    // ── Logo type + segments form ──
    const [logoType, setLogoType] = useState<"image" | "text" | "both">(
        (b.logo_type as "image" | "text" | "both") ?? "text",
    );
    const [segments, setSegments] = useState<LogoTextSegment[]>(
        parseSegments(b.logo_text_segments),
    );

    // logoStyleForm useForm লাইনটা সরাও — এর বদলে:
    const [logoStyleProcessing, setLogoStyleProcessing] = useState(false);

    const logoForm = useForm<{ logo: File | null }>({ logo: null });

    // ── Business info form ──
    const form = useForm({
        group: "business",
        business_name: b.business_name ?? "",
        business_email: b.business_email ?? "",
        business_phone: b.business_phone ?? "",
        business_address: b.business_address ?? "",
    });

    // ── Handlers ──
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

    // Save logo_type and logo_text_segments together
    // submitLogoStyle replace করো:
    const submitLogoStyle = () => {
        const segmentsJson = JSON.stringify(segments);
        setLogoStyleProcessing(true);

        window.axios
            .post(route("backend.settings.update"), {
                group: "business",
                logo_type: logoType,
                logo_text_segments: segmentsJson,
            })
            .then(() => {
                toast.success("Navbar logo style saved.");
                // Reload after short delay so toast is visible before refresh
                setTimeout(() => window.location.reload(), 800);
            })
            .catch(() => {
                toast.error("Failed to save navbar style.");
            })
            .finally(() => {
                setLogoStyleProcessing(false);
            });
    };

    // ── Segment editor helpers ──
    const addSegment = () => {
        if (segments.length >= 5) return;
        setSegments([...segments, { text: "", color: "#4f46e5" }]);
    };

    const removeSegment = (index: number) => {
        if (segments.length <= 1) return;
        setSegments(segments.filter((_, i) => i !== index));
    };

    const updateSegment = (
        index: number,
        field: keyof LogoTextSegment,
        value: string,
    ) => {
        setSegments(
            segments.map((seg, i) =>
                i === index ? { ...seg, [field]: value } : seg,
            ),
        );
    };

    return (
        <div className="space-y-5">
            {/* ── Logo Upload ───────────────────────────────────────────── */}
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

            {/* ── Navbar Logo Style ─────────────────────────────────────── */}
            <Section
                title="Navbar Logo Style"
                description="Choose how your logo appears in the sidebar navigation."
            >
                <div className="space-y-5">
                    {/* Live preview */}
                    <NavbarLogoPreview
                        logoType={logoType}
                        logoImageUrl={logoPreview}
                        segments={segments}
                        businessName={form.data.business_name}
                    />

                    {/* Type selector */}
                    <FormRow label="Display Type" required>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setLogoType("image")}
                                className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                                    logoType === "image"
                                        ? "border-indigo-600 text-gray-600 hover:bg-gray-50"
                                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                <Upload size={14} />
                                Image Only
                            </button>
                            <button
                                type="button"
                                onClick={() => setLogoType("text")}
                                className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                                    logoType === "text"
                                        ? "border-indigo-600 text-gray-600 hover:bg-gray-50"
                                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                <Type size={14} />
                                Text Only
                            </button>
                            <button
                                type="button"
                                onClick={() => setLogoType("both")}
                                className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                                    logoType === "both"
                                        ? "border-indigo-600 text-gray-600 hover:bg-gray-50"
                                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                <Monitor size={14} />
                                Image + Text
                            </button>
                        </div>
                    </FormRow>

                    {/* Image mode hint — shown for image and both modes */}
                    {(logoType === "image" || logoType === "both") && (
                        <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
                            <Info
                                size={14}
                                className="mt-0.5 shrink-0 text-indigo-500"
                            />
                            <p className="text-sm text-indigo-700">
                                The uploaded image above will be used in the
                                navbar. Upload a new image using the{" "}
                                <strong>Business Logo</strong> section.
                            </p>
                        </div>
                    )}

                    {/* Text segment builder — shown for text and both modes */}
                    {(logoType === "text" || logoType === "both") && (
                        <FormRow
                            label="Text Segments"
                            hint="Each segment can have its own color. Max 5 segments."
                        >
                            <div className="space-y-2">
                                {segments.map((seg, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            type="text"
                                            value={seg.text}
                                            onChange={(e) =>
                                                updateSegment(
                                                    i,
                                                    "text",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={`Segment ${i + 1}`}
                                            maxLength={20}
                                            className="flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        <div className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2 py-1.5">
                                            <input
                                                type="color"
                                                value={seg.color}
                                                onChange={(e) =>
                                                    updateSegment(
                                                        i,
                                                        "color",
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-5 w-8 cursor-pointer rounded border-0 p-0"
                                                title="Pick color"
                                            />
                                            <span className="font-mono text-xs text-gray-400">
                                                {seg.color}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeSegment(i)}
                                            disabled={segments.length <= 1}
                                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                                            title="Remove segment"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {segments.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={addSegment}
                                        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        <Plus size={14} />
                                        Add segment
                                    </button>
                                )}
                            </div>
                        </FormRow>
                    )}

                    <SaveButton
                        processing={logoStyleProcessing}
                        label="Save Navbar Style"
                        onClick={submitLogoStyle}
                    />
                </div>
            </Section>

            {/* ── Business Information ──────────────────────────────────── */}
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
                    <SaveButton
                        processing={form.processing}
                        label="Save Business Info"
                        onClick={submit}
                    />
                </div>
            </Section>
        </div>
    );
}

// ─── Currency Tab ─────────────────────────────────────────────────────────────
function CurrencyTab({ settings }: TabProps) {
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
                <SaveButton
                    processing={form.processing}
                    label="Save Currency Settings"
                    onClick={submit}
                />
            </div>
        </Section>
    );
}

// ─── Tax Tab ──────────────────────────────────────────────────────────────────
function TaxTab({ settings }: TabProps) {
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

                <SaveButton
                    processing={form.processing}
                    label="Save Tax Settings"
                    onClick={submit}
                />
            </div>
        </Section>
    );
}

// ─── Notification Tab ─────────────────────────────────────────────────────────
function NotificationTab({ settings }: TabProps) {
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

                <SaveButton
                    processing={form.processing}
                    label="Save Notification Settings"
                    onClick={submit}
                />
            </div>
        </Section>
    );
}
