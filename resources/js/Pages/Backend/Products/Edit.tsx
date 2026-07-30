import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { AlertCircle, ChevronLeft, Loader2, PackageCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ImageUploader, {
    ExistingImage,
    ImageFile,
} from "./_components/ImageUploader";
import ProductFormFields from "./_components/ProductFormFields";
import VariantsPanel, { VariantRow } from "./_components/VariantsPanel";

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

interface ExistingVariant {
    id: number;
    sku: string;
    attributes: Record<string, string>;
    stock_qty: string;
    price_override: string | null;
    cost_price_override: string | null;
    image_id: number | null;
    is_active: boolean;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode: string | null;
    category_id: number | null;
    unit_id: number | null;
    cost_price: string;
    sale_price: string;
    is_taxable: boolean;
    tax_id: string | null;
    discount_type: string | null;
    discount_value: string | null;
    stock_qty: string;
    low_stock_threshold: string;
    min_sale_qty: string | null;
    has_variants: boolean;
    weight: string | null;
    weight_unit: string | null;
    is_featured: boolean;
    sort_order: number | null;
    meta_title: string | null;
    meta_description: string | null;
    description: string | null;
    is_active: boolean;
    images: ExistingImage[];
    variants: ExistingVariant[];
}

interface Props {
    product: Product;
    categories: Category[];
    units: Unit[];
}

type FormData = {
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
    has_variants: boolean;
    is_featured: boolean;
    sort_order: string;
    weight: string;
    weight_unit: string;
    meta_title: string;
    meta_description: string;
    is_active: boolean;
};

const REQUIRED_FIELDS: (keyof FormData)[] = [
    "name",
    "sku",
    "cost_price",
    "sale_price",
    "stock_qty",
    "low_stock_threshold",
];

// Map ExistingVariant → VariantRow for the panel
function toVariantRow(v: ExistingVariant): VariantRow {
    return {
        id: v.id,
        sku: v.sku,
        attributes: v.attributes ?? {},
        stock_qty: v.stock_qty ?? "0",
        price_override: v.price_override ?? "",
        cost_price_override: v.cost_price_override ?? "",
        is_active: v.is_active,
    };
}

export default function ProductEdit({ product, categories, units }: Props) {
    const [newImages, setNewImages] = useState<ImageFile[]>([]);
    const [existingImages, setExistingImages] = useState<ExistingImage[]>(
        product.images,
    );
    const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

    // Initialise variant rows from existing DB variants
    const [variantRows, setVariantRows] = useState<VariantRow[]>(
        product.variants.map(toVariantRow),
    );

    const { data, setData, processing, errors, clearErrors } =
        useForm<FormData>({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode ?? "",
            category_id: product.category_id?.toString() ?? "",
            unit_id: product.unit_id?.toString() ?? "",
            cost_price: product.cost_price,
            sale_price: product.sale_price,
            stock_qty: product.stock_qty,
            low_stock_threshold: product.low_stock_threshold,
            min_sale_qty: product.min_sale_qty ?? "1.00",
            description: product.description ?? "",
            is_taxable: product.is_taxable,
            discount_type: product.discount_type ?? "",
            discount_value: product.discount_value ?? "",
            has_variants: product.has_variants,
            is_featured: product.is_featured,
            sort_order: product.sort_order?.toString() ?? "0",
            weight: product.weight ?? "",
            weight_unit: product.weight_unit ?? "",
            meta_title: product.meta_title ?? "",
            meta_description: product.meta_description ?? "",
            is_active: product.is_active,
        });

    const errorCount = Object.keys(errors).length;
    const isFormValid = REQUIRED_FIELDS.every(
        (key) => String(data[key]).trim().length > 0,
    );

    const handleFieldChange = (
        key: keyof typeof data,
        value: string | boolean,
    ) => {
        setData(key, value as any);

        // When toggling has_variants off, clear variant rows
        if (key === "has_variants" && value === false) {
            setVariantRows([]);
        }
    };

    // Mark existing image for deletion
    const handleDeleteExisting = (id: number) => {
        setDeletedImageIds((prev) => [...prev, id]);
        setExistingImages((prev) => prev.filter((img) => img.id !== id));
    };

    // Set existing image as primary
    const handleSetExistingPrimary = (id: number) => {
        if (id === -1) {
            setExistingImages((prev) =>
                prev.map((img) => ({ ...img, is_primary: false })),
            );
            return;
        }
        setExistingImages((prev) =>
            prev.map((img) => ({ ...img, is_primary: img.id === id })),
        );
        setNewImages((prev) =>
            prev.map((img) => ({ ...img, isPrimary: false })),
        );
    };

    const handleSubmit = () => {
        if (!isFormValid) {
            toast.error("Please fill in all required fields.");
            return;
        }

        // Validate variants if enabled
        if (data.has_variants && variantRows.length === 0) {
            toast.error(
                "Add at least one variant, or disable the variants toggle.",
            );
            return;
        }

        clearErrors();

        const formData = new FormData();
        formData.append("_method", "PUT");

        Object.entries(data).forEach(([key, value]) => {
            if (typeof value === "boolean") {
                formData.append(key, value ? "1" : "0");
            } else {
                formData.append(key, String(value));
            }
        });

        // Variants — full array as JSON; backend diffs against existing
        if (data.has_variants && variantRows.length > 0) {
            formData.append("variants", JSON.stringify(variantRows));
        }

        // Deleted image ids
        deletedImageIds.forEach((id) => {
            formData.append("deleted_image_ids[]", String(id));
        });

        // Primary existing image
        const primaryExisting = existingImages.find((img) => img.is_primary);
        if (primaryExisting) {
            formData.append("primary_image_id", String(primaryExisting.id));
        }

        // New images
        const primaryNewIndex = newImages.findIndex((img) => img.isPrimary);
        newImages.forEach((img) => formData.append("images[]", img.file));
        if (primaryNewIndex >= 0 && !primaryExisting) {
            formData.append("primary_image_index", String(primaryNewIndex));
        }

        router.post(route("backend.products.update", product.id), formData, {
            forceFormData: true,
            onSuccess: () => toast.success("Product updated successfully."),
            onError: () => toast.error("Please fix the errors below."),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Edit — ${product.name}`} />

            <div className="max-w-full mx-auto space-y-6 px-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Link
                            href={route("backend.products.index")}
                            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-indigo-600"
                        >
                            <ChevronLeft size={15} />
                            Products
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Edit Product
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            SKU:{" "}
                            <span className="font-mono">{product.sku}</span>
                        </p>
                    </div>
                    <div className="hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 sm:flex">
                        <PackageCheck size={20} />
                    </div>
                </div>

                {errorCount > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        {errorCount === 1
                            ? "There's 1 error to fix before you can save."
                            : `There are ${errorCount} errors to fix before you can save.`}
                    </div>
                )}

                {/* Two-column layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left — images */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 rounded-sm border border-gray-200 bg-white overflow-hidden">
                            <div className="border-b border-gray-100 px-5 py-3">
                                <h2 className="text-sm font-semibold text-gray-800">
                                    Product Images
                                </h2>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Upload photos, then choose your thumbnail
                                </p>
                            </div>
                            <div className="p-5">
                                <ImageUploader
                                    newImages={newImages}
                                    onNewImagesChange={setNewImages}
                                    existingImages={existingImages}
                                    onDeleteExisting={handleDeleteExisting}
                                    onSetExistingPrimary={
                                        handleSetExistingPrimary
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right — form fields + variants + submit */}
                    <div className="space-y-5 lg:col-span-2">
                        <ProductFormFields
                            data={data}
                            errors={errors}
                            onChange={handleFieldChange}
                            categories={categories}
                            units={units}
                            isEdit
                        />

                        {/* Variants panel — only shown when has_variants = true */}
                        {data.has_variants && (
                            <VariantsPanel
                                rows={variantRows}
                                onChange={setVariantRows}
                                baseSalePrice={data.sale_price}
                                baseCostPrice={data.cost_price}
                            />
                        )}

                        {/* Submit bar */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-4">
                            <p className="text-xs text-gray-400">
                                {isFormValid
                                    ? "All required fields are filled in."
                                    : "Fill in the required fields to continue."}
                            </p>
                            <div className="flex items-center gap-3">
                                <Link
                                    href={route("backend.products.index")}
                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </Link>
                                <button
                                    onClick={handleSubmit}
                                    disabled={processing || !isFormValid}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                >
                                    {processing && (
                                        <Loader2
                                            size={15}
                                            className="animate-spin"
                                        />
                                    )}
                                    {processing
                                        ? "Saving..."
                                        : "Update Product"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
