import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Link } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, PackagePlus, AlertCircle, Loader2 } from "lucide-react";
import ProductFormFields from "./_components/ProductFormFields";
import ImageUploader, { ImageFile } from "./_components/ImageUploader";

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

interface Props {
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

export default function ProductCreate({ categories, units }: Props) {
    const [newImages, setNewImages] = useState<ImageFile[]>([]);

    const { data, setData, processing, errors } = useForm<FormData>({
        name: "",
        sku: "",
        barcode: "",
        category_id: "",
        unit_id: "",
        cost_price: "0.00",
        sale_price: "0.00",
        stock_qty: "0.00",
        low_stock_threshold: "5.00",
        min_sale_qty: "1.00",
        description: "",
        is_taxable: false,
        discount_type: "",
        discount_value: "",
        is_featured: false,
        sort_order: "0",
        weight: "",
        weight_unit: "",
        meta_title: "",
        meta_description: "",
        is_active: true,
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
    };

    const handleSubmit = () => {
        if (!isFormValid) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (typeof value === "boolean") {
                formData.append(key, value ? "1" : "0");
            } else {
                formData.append(key, String(value));
            }
        });

        const primaryIndex = newImages.findIndex((img) => img.isPrimary);
        newImages.forEach((img) => formData.append("images[]", img.file));
        if (primaryIndex >= 0) {
            formData.append("primary_image_index", String(primaryIndex));
        }

        router.post(route("backend.products.store"), formData, {
            forceFormData: true,
            onSuccess: () => toast.success("Product created successfully."),
            onError: () => toast.error("Please fix the errors below."),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Add Product" />

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
                            Add Product
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Fill in the details to add a new product to your
                            catalog
                        </p>
                    </div>
                    <div className="hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 sm:flex">
                        <PackagePlus size={20} />
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
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right — form fields + submit */}
                    <div className="space-y-5 lg:col-span-2">
                        <ProductFormFields
                            data={data}
                            errors={errors}
                            onChange={handleFieldChange}
                            categories={categories}
                            units={units}
                        />

                        {/* Submit bar — sits naturally at the end of the form */}
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
                                        : "Create Product"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
