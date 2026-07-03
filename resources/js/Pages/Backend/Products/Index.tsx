import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { toast } from "sonner";
import ProductStatsCards from "./_components/ProductStatsCards";
import ProductTable from "./_components/ProductTable";

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode: string | null;
    category_name: string | null;
    unit_short_code: string | null;
    cost_price: string;
    sale_price: string;
    stock_qty: string;
    low_stock_threshold: string;
    is_low_stock: boolean;
    is_featured: boolean;
    is_active: boolean;
    primary_image: string | null;
}

interface Stats {
    total: number;
    active: number;
    low_stock: number;
    featured: number;
}

interface Props {
    products: Product[];
    stats: Stats;
}

export default function ProductsIndex({ products, stats }: Props) {
    const handleDelete = (product: Product) => {
        import("@/lib/confirm").then(({ confirmAction }) => {
            confirmAction({
                title: "Delete Product?",
                text: `"${product.name}" will be soft-deleted. This cannot be undone easily.`,
                confirmButtonText: "Yes, delete",
            }).then((ok) => {
                if (!ok) return;
                router.delete(route("backend.products.destroy", product.id), {
                    onSuccess: () => toast.success("Product deleted."),
                    onError: () => toast.error("Failed to delete product."),
                });
            });
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Products" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Products
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage your product catalogue
                        </p>
                    </div>
                    <Link
                        href={route("backend.products.create")}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        + Add Product
                    </Link>
                </div>

                {/* Stats */}
                <ProductStatsCards stats={stats} />

                {/* Table */}
                <ProductTable products={products} onDelete={handleDelete} />
            </div>
        </AuthenticatedLayout>
    );
}
