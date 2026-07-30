import {
    AlertCircle,
    Boxes,
    CheckCircle2,
    Coins,
    Info,
    LayoutGrid,
    LucideIcon,
    Search,
    Tags,
    Truck,
} from "lucide-react";
import { useState } from "react";

interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    parent_name: string | null;
}

interface Unit {
    id: number;
    name: string;
    short_code: string;
}

interface FormData {
    name: string;
    sku: string;
    barcode: string;
    category_id: string;
    unit_id: string;
    cost_price: string;
    sale_price: string;
    stock_qty: string;
    low_stock_threshold: string;
    min_sale_qty: string;
    description: string;
    is_taxable: boolean;
    discount_type: string;
    discount_value: string;
    is_featured: boolean;
    sort_order: string;
    weight: string;
    weight_unit: string;
    meta_title: string;
    meta_description: string;
    has_variants: boolean;
    is_active: boolean;
}

interface Props {
    data: FormData;
    errors: Partial<Record<keyof FormData, string>>;
    onChange: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
    categories: Category[];
    units: Unit[];
    isEdit?: boolean;
}

/* ── shared styling helpers ── */

const baseInputCls =
    "w-full rounded-md text-sm shadow-sm transition-colors focus:outline-none focus:ring-2";

function stateClasses(
    required: boolean,
    touched: boolean,
    filled: boolean,
    hasError: boolean,
) {
    if (hasError)
        return "border-red-400 focus:border-red-500 focus:ring-red-100";
    if (required && touched) {
        return filled
            ? "border-green-400 focus:border-green-500 focus:ring-green-100"
            : "border-red-400 focus:border-red-500 focus:ring-red-100";
    }
    return "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100";
}

function StatusIcon({ show, valid }: { show: boolean; valid: boolean }) {
    if (!show) return null;
    return valid ? (
        <CheckCircle2
            size={16}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500"
        />
    ) : (
        <AlertCircle
            size={16}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500"
        />
    );
}

/* ── field primitives ── */

function TextInput({
    label,
    required,
    value,
    onChange,
    error,
    type = "text",
    placeholder,
    mono,
    min,
    step,
    maxLength,
}: {
    label: string;
    required?: boolean;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    type?: string;
    placeholder?: string;
    mono?: boolean;
    min?: string;
    step?: string;
    maxLength?: number;
}) {
    const [touched, setTouched] = useState(false);
    const filled = value.trim().length > 0;
    const showStatus = (!!required && touched) || !!error;
    const isValid = filled && !error;

    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    min={min}
                    step={step}
                    maxLength={maxLength}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder={placeholder}
                    className={`${baseInputCls} border ${stateClasses(!!required, touched, filled, !!error)} ${
                        mono ? "font-mono" : ""
                    } px-3 py-2 ${showStatus ? "pr-9" : ""} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <StatusIcon show={showStatus} valid={isValid} />
            </div>
            {error ? (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            ) : required && touched && !filled ? (
                <p className="mt-1 text-xs text-red-500">
                    This field is required
                </p>
            ) : null}
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    error,
    required,
    children,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    const [touched, setTouched] = useState(false);
    const filled = value.trim().length > 0;
    const showStatus = (!!required && touched) || !!error;

    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={() => setTouched(true)}
                className={`${baseInputCls} border ${stateClasses(!!required, touched, filled, !!error)} px-3 py-2`}
            >
                {children}
            </select>
            {error ? (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            ) : required && touched && !filled ? (
                <p className="mt-1 text-xs text-red-500">
                    This field is required
                </p>
            ) : null}
        </div>
    );
}

function TextArea({
    label,
    value,
    onChange,
    error,
    rows = 3,
    placeholder,
    maxLength,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    rows?: number;
    placeholder?: string;
    maxLength?: number;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
                {label}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                maxLength={maxLength}
                placeholder={placeholder}
                className={`${baseInputCls} border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-100`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function Toggle({
    value,
    onChange,
    label,
}: {
    value: boolean;
    onChange: (v: boolean) => void;
    label: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={() => onChange(!value)}
                className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? "bg-indigo-600" : "bg-gray-200"
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        value ? "translate-x-6" : "translate-x-1"
                    }`}
                />
            </button>
            <span className="text-sm text-gray-600">{label}</span>
        </div>
    );
}

function SectionHeader({
    icon: Icon,
    title,
    hint,
}: {
    icon: LucideIcon;
    title: string;
    hint?: string;
}) {
    return (
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-3.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Icon size={15} />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                {hint && <p className="text-xs text-gray-400">{hint}</p>}
            </div>
        </div>
    );
}

const sectionCls = "rounded-lg border border-gray-200 bg-white overflow-hidden";

export default function ProductFormFields({
    data,
    errors,
    onChange,
    categories,
    units,
}: Props) {
    const topLevel = categories.filter((c) => c.parent_id === null);
    const children = categories.filter((c) => c.parent_id !== null);

    return (
        <div className="space-y-5">
            {/* ── Basic Info ── */}
            <div className={sectionCls}>
                <SectionHeader icon={Info} title="Basic Information" />
                <div className="space-y-4 p-5">
                    <TextInput
                        label="Product Name"
                        required
                        value={data.name}
                        onChange={(v) => onChange("name", v)}
                        error={errors.name}
                        placeholder="e.g. Premium Rice"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <TextInput
                            label="SKU"
                            required
                            mono
                            value={data.sku}
                            onChange={(v) => onChange("sku", v)}
                            error={errors.sku}
                            placeholder="e.g. RICE-001"
                        />
                        <TextInput
                            label="Barcode"
                            mono
                            value={data.barcode}
                            onChange={(v) => onChange("barcode", v)}
                            error={errors.barcode}
                            placeholder="e.g. 8901234567890"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SelectField
                            label="Category"
                            value={data.category_id}
                            onChange={(v) => onChange("category_id", v)}
                            error={errors.category_id}
                        >
                            <option value="">— Select category —</option>
                            {topLevel.map((parent) => {
                                const kids = children.filter(
                                    (c) => c.parent_id === parent.id,
                                );
                                return kids.length > 0 ? (
                                    <optgroup
                                        key={parent.id}
                                        label={parent.name}
                                    >
                                        {kids.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ) : (
                                    <option key={parent.id} value={parent.id}>
                                        {parent.name}
                                    </option>
                                );
                            })}
                        </SelectField>
                        <SelectField
                            label="Unit"
                            value={data.unit_id}
                            onChange={(v) => onChange("unit_id", v)}
                            error={errors.unit_id}
                        >
                            <option value="">— Select unit —</option>
                            {units.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.short_code})
                                </option>
                            ))}
                        </SelectField>
                    </div>

                    <TextArea
                        label="Description"
                        value={data.description}
                        onChange={(v) => onChange("description", v)}
                        error={errors.description}
                        rows={3}
                        placeholder="Product description (optional)"
                    />
                </div>
            </div>

            {/* ── Pricing ── */}
            <div className={sectionCls}>
                <SectionHeader icon={Coins} title="Pricing" />
                <div className="space-y-4 p-5">
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput
                            label="Cost Price (৳)"
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.cost_price}
                            onChange={(v) => onChange("cost_price", v)}
                            error={errors.cost_price}
                            placeholder="0.00"
                        />
                        <TextInput
                            label="Sale Price (৳)"
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.sale_price}
                            onChange={(v) => onChange("sale_price", v)}
                            error={errors.sale_price}
                            placeholder="0.00"
                        />
                    </div>

                    <Toggle
                        value={data.is_taxable}
                        onChange={(v) => onChange("is_taxable", v)}
                        label="Taxable product"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <SelectField
                            label="Discount Type"
                            value={data.discount_type}
                            onChange={(v) => onChange("discount_type", v)}
                            error={errors.discount_type}
                        >
                            <option value="">— No discount —</option>
                            <option value="flat">Flat (৳)</option>
                            <option value="percentage">Percentage (%)</option>
                        </SelectField>
                        <TextInput
                            label="Discount Value"
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.discount_value}
                            onChange={(v) => onChange("discount_value", v)}
                            error={errors.discount_value}
                            placeholder="0.00"
                        />
                    </div>
                </div>
            </div>

            {/* ── Stock ── */}
            <div className={sectionCls}>
                <SectionHeader icon={Boxes} title="Stock" />
                <div className="grid grid-cols-3 gap-4 p-5">
                    <TextInput
                        label="Initial Stock Qty"
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.stock_qty}
                        onChange={(v) => onChange("stock_qty", v)}
                        error={errors.stock_qty}
                        placeholder="0.00"
                    />
                    <TextInput
                        label="Low Stock Alert"
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.low_stock_threshold}
                        onChange={(v) => onChange("low_stock_threshold", v)}
                        error={errors.low_stock_threshold}
                        placeholder="5.00"
                    />
                    <TextInput
                        label="Min Sale Qty"
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.min_sale_qty}
                        onChange={(v) => onChange("min_sale_qty", v)}
                        error={errors.min_sale_qty}
                        placeholder="1.00"
                    />
                </div>
            </div>

            {/* ── Shipping ── */}
            <div className={sectionCls}>
                <SectionHeader
                    icon={Truck}
                    title="Shipping"
                    hint="Optional — for future delivery module"
                />
                <div className="grid grid-cols-2 gap-4 p-5">
                    <TextInput
                        label="Weight"
                        type="number"
                        min="0"
                        step="0.001"
                        value={data.weight}
                        onChange={(v) => onChange("weight", v)}
                        error={errors.weight}
                        placeholder="0.000"
                    />
                    <SelectField
                        label="Weight Unit"
                        value={data.weight_unit}
                        onChange={(v) => onChange("weight_unit", v)}
                        error={errors.weight_unit}
                    >
                        <option value="">— Select —</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="lb">lb</option>
                    </SelectField>
                </div>
            </div>

            {/* ── Variants ── */}
            <div className={sectionCls}>
                <SectionHeader
                    icon={Tags}
                    title="Product Variants"
                    hint="Enable if this product has sizes, colors, or other options"
                />
                <div className="p-5">
                    <Toggle
                        value={data.has_variants}
                        onChange={(v) => onChange("has_variants", v)}
                        label="This product has variants (size, color, etc.)"
                    />
                    {data.has_variants && (
                        <p className="mt-2 text-xs text-amber-600">
                            ⚠ When variants are enabled, stock is tracked per
                            variant — not on the main product.
                        </p>
                    )}
                </div>
            </div>

            {/* ── POS & Display ── */}
            <div className={sectionCls}>
                <SectionHeader icon={LayoutGrid} title="POS & Display" />
                <div className="grid grid-cols-2 items-end gap-4 p-5">
                    <TextInput
                        label="Sort Order"
                        type="number"
                        min="0"
                        value={data.sort_order}
                        onChange={(v) => onChange("sort_order", v)}
                        error={errors.sort_order}
                        placeholder="0"
                    />
                    <div className="space-y-2 pb-1">
                        <Toggle
                            value={data.is_featured}
                            onChange={(v) => onChange("is_featured", v)}
                            label="Featured product"
                        />
                        <Toggle
                            value={data.is_active}
                            onChange={(v) => onChange("is_active", v)}
                            label="Active"
                        />
                    </div>
                </div>
            </div>

            {/* ── SEO ── */}
            <div className={sectionCls}>
                <SectionHeader
                    icon={Search}
                    title="SEO"
                    hint="Optional — for future online store"
                />
                <div className="space-y-4 p-5">
                    <TextInput
                        label="Meta Title"
                        value={data.meta_title}
                        onChange={(v) => onChange("meta_title", v)}
                        error={errors.meta_title}
                        placeholder="Page title for search engines"
                        maxLength={255}
                    />
                    <TextArea
                        label="Meta Description"
                        value={data.meta_description}
                        onChange={(v) => onChange("meta_description", v)}
                        error={errors.meta_description}
                        rows={2}
                        placeholder="Short description for search engines"
                        maxLength={500}
                    />
                </div>
            </div>
        </div>
    );
}
